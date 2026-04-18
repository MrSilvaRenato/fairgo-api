<?php

namespace App\Services;

use App\Models\User;

/**
 * Consumer Reputation Score
 *
 * Starts at 100. Adjusted based on complaint behaviour.
 *
 * Penalty signals:
 *  - High volume of complaints with NO response engagement (never read replies, never closed)
 *  - High proportion of complaints removed by admin
 *  - Very short description complaints (< 20 chars) — likely spam
 *  - Multiple complaints against the same company within 30 days
 *
 * Positive signals:
 *  - Complaints resolved and marked resolved by consumer
 *  - Phone verified
 *  - Account age > 90 days
 *
 * Flags:
 *  - serial_complainer : score < 40  OR  > 50% complaints removed
 *  - verified_consumer : score >= 80 AND phone_verified AND account_age > 90 days
 */
class ConsumerReputationService
{
    public function calculate(User $user): User
    {
        $complaints = $user->complaints()->with('feedback')->get();
        $total      = $complaints->count();

        if ($total === 0) {
            $user->update(['reputation_score' => 100, 'reputation_flag' => null]);
            return $user->fresh();
        }

        $score = 100;

        // ── Penalty: removed complaints ──────────────────────
        $removed    = $complaints->where('status', 'removed')->count();
        $removedPct = $removed / $total;
        if ($removedPct >= 0.5) $score -= 40;
        elseif ($removedPct >= 0.3) $score -= 20;
        elseif ($removedPct >= 0.1) $score -= 10;

        // ── Penalty: high volume with no resolution attempts ──
        $neverClosed = $complaints->filter(
            fn($c) => !$c->feedback && in_array($c->status, ['responded'])
        )->count();
        if ($total >= 5 && $neverClosed / $total >= 0.7) $score -= 15;

        // ── Penalty: spam-like complaints (< 20 char descriptions) ──
        $tooShort = $complaints->filter(fn($c) => strlen($c->description ?? '') < 20)->count();
        if ($tooShort / $total >= 0.5) $score -= 15;

        // ── Penalty: repeat complaints same company, same month ──
        $grouped = $complaints->groupBy('company_id');
        foreach ($grouped as $companyComplaints) {
            $recent = $companyComplaints->filter(
                fn($c) => $c->created_at >= now()->subDays(30)
            );
            if ($recent->count() >= 3) { $score -= 15; break; }
        }

        // ── Bonus: resolved complaints ───────────────────────
        $resolved    = $complaints->where('status', 'resolved')->count();
        $resolvedPct = $resolved / $total;
        if ($resolvedPct >= 0.6) $score += 10;

        // ── Bonus: phone verified ────────────────────────────
        if ($user->isPhoneVerified()) $score += 5;

        // ── Bonus: account age > 90 days ────────────────────
        if ($user->created_at->diffInDays(now()) >= 90) $score += 5;

        $score = max(0, min(100, $score));

        // ── Flag ─────────────────────────────────────────────
        $flag = null;
        if ($score < 40 || $removedPct >= 0.5) {
            $flag = 'serial_complainer';
        } elseif ($score >= 80 && $user->isPhoneVerified() && $user->created_at->diffInDays(now()) >= 90) {
            $flag = 'verified_consumer';
        }

        $user->update(['reputation_score' => $score, 'reputation_flag' => $flag]);

        return $user->fresh();
    }
}
