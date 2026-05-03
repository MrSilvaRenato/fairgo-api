<?php

namespace App\Http\Controllers;

use App\Jobs\CalculateCompanyScore;
use App\Models\AppNotification;
use App\Models\Complaint;
use App\Models\ResolutionFeedback;
use App\Notifications\ComplaintResolvedCompany;
use App\Services\ConsumerReputationService;
use Illuminate\Http\Request;

class ResolutionFeedbackController extends Controller
{
    public function store(Request $request, Complaint $complaint)
    {
        if ($request->user()->id !== $complaint->consumer_id) {
            abort(403, 'Only the complaint author can close this complaint.');
        }

        // Block if already closed AND not re-opened
        if ($complaint->feedback && !$complaint->reopened_at) {
            return response()->json(['message' => 'Feedback already submitted.'], 422);
        }

        $data = $request->validate([
            'resolved'         => 'required|boolean',
            'rating'           => 'nullable|integer|min:1|max:5',
            'comment'          => 'nullable|string|max:1000',
            'would_deal_again' => 'nullable|boolean',
        ]);

        // Update existing feedback if re-opened, create fresh otherwise
        if ($complaint->feedback) {
            $complaint->feedback->update([
                'resolved'         => $data['resolved'],
                'rating'           => $data['rating'] ?? null,
                'comment'          => $data['comment'] ?? null,
                'would_deal_again' => $data['would_deal_again'] ?? null,
            ]);
            $feedback = $complaint->feedback->fresh();
        } else {
            $feedback = ResolutionFeedback::create([
                'complaint_id'     => $complaint->id,
                'consumer_id'      => $request->user()->id,
                'resolved'         => $data['resolved'],
                'rating'           => $data['rating'] ?? null,
                'comment'          => $data['comment'] ?? null,
                'would_deal_again' => $data['would_deal_again'] ?? null,
            ]);
        }

        $complaint->update([
            'status' => $data['resolved'] ? 'resolved' : 'unresolved',
        ]);

        CalculateCompanyScore::dispatch($complaint->company_id);

        // Recalculate consumer reputation after each feedback submission
        (new ConsumerReputationService)->calculate($request->user());

        // Notify company admin
        $complaint->load(['company.user', 'consumer', 'feedback']);
        $companyUser = $complaint->company->user;
        if ($companyUser) {
            $companyUser->notify(new ComplaintResolvedCompany($complaint));
            $verdict  = $data['resolved'] ? 'resolved' : 'marked as unresolved';
            $consumer = $request->user()->name ?? 'A consumer';
            AppNotification::notify(
                $companyUser->id,
                'verdict',
                "{$consumer} {$verdict} a complaint",
                $data['comment'] ? \Str::limit($data['comment'], 100) : null,
                "/complaints/{$complaint->id}"
            );
        }

        return response()->json($feedback, 201);
    }
}
