<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanyScore;
use App\Models\Complaint;

/**
 * Aus Fair Go Score — inspired by Reclame Aqui's reputation model.
 *
 * Core philosophy:
 *   - Response rate is a GATE, not a reward. Ignoring complaints = 0.
 *   - The score is driven by consumer OUTCOMES: did they say it was resolved?
 *     Would they deal again? What star rating did they give?
 *   - Only the last 6 months of complaints count (recent behaviour matters).
 *
 * Formula (weights sum to 1.0):
 *   solution_rate      × 0.45  — consumer confirmed resolved
 *   deal_again_rate    × 0.25  — consumer would deal again
 *   satisfaction_norm  × 0.20  — star rating normalised 0–1
 *   response_rate      × 0.10  — bonus for actually responding
 *
 * Edge rules:
 *   - No complaints in window OR response_rate < 10% → score = 0, badge = not_rated
 *   - If no "would deal again" data → fall back to solution_rate
 *   - If no star ratings → fall back to solution_rate
 */
class ScoreService
{
    /** Scoring window */
    private const WINDOW_MONTHS = 6;

    /**
     * Aus Fair Go Verified badge — mirrors Reclame Aqui's RA1000 criteria:
     *   response_rate  ≥ 90%   (RA: >90%)
     *   solution_rate  ≥ 90%   (RA: ≥90%)
     *   deal_again     ≥ 70%   (RA: ≥70%)
     *   avg_rating     ≥ 3.5/5 (RA: ≥7/10)
     *   min_feedbacks  ≥ 20    (RA: ≥50 — scaled down for AU market size)
     *   account_age    ≥ 6 months
     */
    private const VERIFIED_MIN_COMPLAINTS    = 20;
    private const VERIFIED_MIN_RESPONSE_RATE = 0.90;
    private const VERIFIED_MIN_RESOLUTION    = 0.90;
    private const VERIFIED_MIN_DEAL_AGAIN    = 0.70;
    private const VERIFIED_MIN_AVG_RATING    = 3.5;   // out of 5
    private const VERIFIED_ACCOUNT_MONTHS   = 6;

    /** Not Recommended flag thresholds */
    private const FLAG_MIN_COMPLAINTS    = 5;
    private const FLAG_MAX_SCORE         = 30;
    private const FLAG_MAX_RESPONSE_RATE = 0.30;

    public function calculate(Company $company): CompanyScore
    {
        // Only look at the last 6 months; exclude removed/rejected complaints
        $complaints = Complaint::where('company_id', $company->id)
            ->where('created_at', '>=', now()->subMonths(self::WINDOW_MONTHS))
            ->where('status', '!=', 'removed')
            ->whereNotIn('moderation_status', ['flagged', 'rejected'])
            ->with(['response', 'feedback'])
            ->get();

        $total = $complaints->count();

        $zero = [
            'response_rate'      => 0,
            'resolution_rate'    => 0,
            'avg_response_hours' => 0,
            'satisfaction_score' => 0,
            'total_complaints'   => $total,
            'score'              => 0,
        ];

        if ($total === 0) {
            $score = $this->upsert($company, $zero);
            // No complaints → strip any previous badge/flag; don't penalise
            $company->update(['verified_badge' => false, 'not_recommended' => false]);
            return $score;
        }

        // ── Below minimum threshold — store raw stats, no score yet ──────────
        if ($total < CompanyScore::MIN_FOR_RATING) {
            $responded    = $complaints->filter(
                fn($c) => in_array($c->status, ['responded', 'resolved', 'unresolved'])
            )->count();

            $score = $this->upsert($company, [
                'response_rate'      => $total > 0 ? round($responded / $total, 4) : 0,
                'resolution_rate'    => 0,
                'avg_response_hours' => 0,
                'satisfaction_score' => 0,
                'total_complaints'   => $total,
                'score'              => 0,
            ]);

            // Do NOT set verified_badge or not_recommended — too early to judge
            return $score;
        }

        // ── Response rate ─────────────────────────────────────────────────────
        $responded    = $complaints->filter(
            fn($c) => in_array($c->status, ['responded', 'resolved', 'unresolved'])
        )->count();
        $responseRate = $responded / $total;

        // Gate: < 10% response rate → no score
        if ($responseRate < 0.10) {
            $score = $this->upsert($company, array_merge($zero, [
                'response_rate' => round($responseRate, 4),
            ]));
            $this->updateBadges($company, $score);
            return $score;
        }

        // ── Average response time (for badge threshold only) ──────────────────
        $responseTimes = [];
        foreach ($complaints as $complaint) {
            if ($complaint->response) {
                $responseTimes[] = $complaint->created_at->diffInHours($complaint->response->responded_at);
            }
        }
        $avgHours = count($responseTimes) > 0
            ? array_sum($responseTimes) / count($responseTimes)
            : 0;

        // ── Consumer outcome signals ──────────────────────────────────────────
        $feedbacks = $complaints->map(fn($c) => $c->feedback)->filter();

        // 1. Solution rate — consumer said "resolved = true"
        $solutionRate = $feedbacks->count() > 0
            ? $feedbacks->where('resolved', true)->count() / $feedbacks->count()
            : 0;

        // 2. Would deal again rate — fall back to solution rate if no data
        $dealFeedbacks   = $feedbacks->filter(fn($f) => $f->would_deal_again !== null);
        $dealAgainRate   = $dealFeedbacks->count() > 0
            ? $dealFeedbacks->where('would_deal_again', true)->count() / $dealFeedbacks->count()
            : $solutionRate;

        // 3. Satisfaction — star rating normalised 0–1 (1★=0, 5★=1)
        //    Fall back to solution rate if no ratings submitted
        $ratedFeedbacks   = $feedbacks->filter(fn($f) => $f->rating !== null);
        $satisfactionNorm = $ratedFeedbacks->count() > 0
            ? ($ratedFeedbacks->avg('rating') - 1) / 4
            : $solutionRate;

        // ── Final score — Reclame Aqui formula adapted for Aus Fair Go ───────────
        // RA:  AR = ((IR×2) + (MA×10×3) + (IS×3) + (IN×2)) / 100  → score 0–10
        // FG:  same weights, all inputs normalised 0–1, output × 100 → score 0–100
        //
        //   IR (response)       weight 2  → 20%
        //   MA (avg rating 0–1) weight 3  → 30%
        //   IS (solution)       weight 3  → 30%
        //   IN (would deal)     weight 2  → 20%
        $finalScore = (
            ($responseRate     * 0.20) +
            ($satisfactionNorm * 0.30) +
            ($solutionRate     * 0.30) +
            ($dealAgainRate    * 0.20)
        ) * 100;

        // resolution_rate stored for badge/display purposes (same as solutionRate here)
        $scoreModel = $this->upsert($company, [
            'response_rate'      => round($responseRate, 4),
            'resolution_rate'    => round($solutionRate, 4),
            'avg_response_hours' => round($avgHours, 2),
            'satisfaction_score' => round($satisfactionNorm, 4),
            'total_complaints'   => $total,
            'score'              => round($finalScore, 2),
        ]);

        $this->updateBadges($company, $scoreModel);

        return $scoreModel;
    }

    /**
     * Auto-compute and persist verified_badge + not_recommended on the company.
     */
    private function updateBadges(Company $company, CompanyScore $score): void
    {
        // Never assign badges below the minimum threshold
        if ($score->total_complaints < CompanyScore::MIN_FOR_RATING) {
            return;
        }

        $total        = $score->total_complaints;
        $finalScore   = $score->score;
        $responseRate = $score->response_rate;
        $resolution   = $score->resolution_rate;

        // Re-fetch rated feedbacks for avg_rating and deal_again checks (exclude removed/rejected)
        $feedbacks      = $company->complaints()
            ->where('status', '!=', 'removed')
            ->whereNotIn('moderation_status', ['flagged', 'rejected'])
            ->with('feedback')
            ->get()
            ->map(fn($c) => $c->feedback)
            ->filter();

        $ratedFeedbacks = $feedbacks->filter(fn($f) => $f->rating !== null);
        $avgRating      = $ratedFeedbacks->count() > 0 ? $ratedFeedbacks->avg('rating') : 0;

        $dealFeedbacks  = $feedbacks->filter(fn($f) => $f->would_deal_again !== null);
        $dealAgainRate  = $dealFeedbacks->count() > 0
            ? $dealFeedbacks->where('would_deal_again', true)->count() / $dealFeedbacks->count()
            : 0;

        $accountAgeMonths = $company->created_at->diffInMonths(now());

        // Aus Fair Go Verified = RA1000 equivalent
        $verified = (
            $total          >= self::VERIFIED_MIN_COMPLAINTS    &&
            $responseRate   >= self::VERIFIED_MIN_RESPONSE_RATE &&
            $resolution     >= self::VERIFIED_MIN_RESOLUTION    &&
            $dealAgainRate  >= self::VERIFIED_MIN_DEAL_AGAIN    &&
            $avgRating      >= self::VERIFIED_MIN_AVG_RATING    &&
            $accountAgeMonths >= self::VERIFIED_ACCOUNT_MONTHS
        );

        $notRecommended = (
            $total >= self::FLAG_MIN_COMPLAINTS &&
            ($finalScore < self::FLAG_MAX_SCORE || $responseRate < self::FLAG_MAX_RESPONSE_RATE)
        );

        $company->update([
            'verified_badge'  => $verified,
            'not_recommended' => $notRecommended,
        ]);
    }

    private function upsert(Company $company, array $data): CompanyScore
    {
        return CompanyScore::updateOrCreate(
            ['company_id' => $company->id],
            array_merge($data, [
                'last_calculated_at' => now(),
                'updated_at'         => now(),
            ])
        );
    }
}
