<?php

namespace App\Http\Controllers;

use App\Jobs\CalculateCompanyScore;
use App\Mail\ComplaintResolved;
use App\Models\Complaint;
use App\Models\ResolutionFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ResolutionFeedbackController extends Controller
{
    public function store(Request $request, Complaint $complaint)
    {
        if ($request->user()->id !== $complaint->consumer_id) {
            abort(403, 'Only the complaint author can close this complaint.');
        }

        if ($complaint->feedback) {
            return response()->json(['message' => 'Feedback already submitted.'], 422);
        }

        $data = $request->validate([
            'resolved'         => 'required|boolean',
            'rating'           => 'nullable|integer|min:1|max:5',
            'comment'          => 'nullable|string|max:1000',
            'would_deal_again' => 'nullable|boolean',
        ]);

        $feedback = ResolutionFeedback::create([
            'complaint_id'     => $complaint->id,
            'consumer_id'      => $request->user()->id,
            'resolved'         => $data['resolved'],
            'rating'           => $data['rating'] ?? null,
            'comment'          => $data['comment'] ?? null,
            'would_deal_again' => $data['would_deal_again'] ?? null,
        ]);

        $complaint->update([
            'status' => $data['resolved'] ? 'resolved' : 'unresolved',
        ]);

        CalculateCompanyScore::dispatch($complaint->company_id);

        // Notify company admin
        $complaint->load(['company.user', 'feedback']);
        $companyUser = $complaint->company->user;
        if ($companyUser?->email) {
            Mail::to($companyUser->email)->queue(new ComplaintResolved($complaint));
        }

        return response()->json($feedback, 201);
    }
}
