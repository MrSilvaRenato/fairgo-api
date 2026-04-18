<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanyScore;
use App\Models\Complaint;

class ScoreService
{
    public function calculate(Company $company): CompanyScore
    {
        $complaints = Complaint::where('company_id', $company->id)->get();
        $total = $complaints->count();

        if ($total === 0) {
            return $this->upsert($company, [
                'response_rate'     => 0,
                'resolution_rate'   => 0,
                'avg_response_hours'=> 0,
                'satisfaction_score'=> 0,
                'total_complaints'  => 0,
                'score'             => 0,
            ]);
        }

        // Response rate: complaints that got a response
        $responded = $complaints->filter(fn($c) => in_array($c->status, ['responded', 'resolved', 'unresolved']))->count();
        $responseRate = $responded / $total;

        // Resolution rate: complaints marked resolved
        $resolved = $complaints->where('status', 'resolved')->count();
        $resolutionRate = $responded > 0 ? $resolved / $responded : 0;

        // Average response time in hours
        $responseTimes = [];
        foreach ($complaints as $complaint) {
            if ($complaint->response) {
                $hours = $complaint->created_at->diffInHours($complaint->response->responded_at);
                $responseTimes[] = $hours;
            }
        }
        $avgHours = count($responseTimes) > 0 ? array_sum($responseTimes) / count($responseTimes) : 0;

        // Speed score: 0–1 based on avg response hours (target ≤ 24h = 1.0, ≥ 168h = 0)
        $speedScore = $avgHours <= 0 ? 0 : max(0, min(1, 1 - (($avgHours - 24) / 144)));

        // Satisfaction: average rating from feedbacks (1–5 → 0–1)
        $ratings = $complaints
            ->map(fn($c) => $c->feedback?->rating)
            ->filter()
            ->values();

        $satisfactionAvg = $ratings->count() > 0
            ? ($ratings->avg() - 1) / 4
            : 0;

        // Would deal again: fraction of feedbacks with would_deal_again = true
        $feedbacksWithDealAgain = $complaints
            ->map(fn($c) => $c->feedback)
            ->filter(fn($f) => $f && $f->would_deal_again !== null);

        $dealAgainScore = $feedbacksWithDealAgain->count() > 0
            ? $feedbacksWithDealAgain->where('would_deal_again', true)->count() / $feedbacksWithDealAgain->count()
            : $satisfactionAvg;

        // Final score formula
        $score = (
            ($responseRate   * 0.25) +
            ($resolutionRate * 0.35) +
            ($speedScore     * 0.15) +
            ($satisfactionAvg* 0.15) +
            ($dealAgainScore * 0.10)
        ) * 100;

        return $this->upsert($company, [
            'response_rate'      => round($responseRate, 4),
            'resolution_rate'    => round($resolutionRate, 4),
            'avg_response_hours' => round($avgHours, 2),
            'satisfaction_score' => round($satisfactionAvg, 4),
            'total_complaints'   => $total,
            'score'              => round($score, 2),
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
