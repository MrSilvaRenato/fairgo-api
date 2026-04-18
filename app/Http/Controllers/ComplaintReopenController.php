<?php

namespace App\Http\Controllers;

use App\Jobs\CalculateCompanyScore;
use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintReopenController extends Controller
{
    /**
     * POST /api/complaints/{complaint}/reopen
     *
     * Only the original consumer can re-open.
     * Only resolved/unresolved complaints can be re-opened.
     * A complaint can only be re-opened once.
     */
    public function __invoke(Request $request, Complaint $complaint)
    {
        if ($request->user()->id !== $complaint->consumer_id) {
            abort(403, 'Only the complaint author can re-open it.');
        }

        if (!in_array($complaint->status, ['resolved', 'unresolved'])) {
            return response()->json(['message' => 'Only closed complaints can be re-opened.'], 422);
        }

        if ($complaint->reopened_at !== null) {
            return response()->json(['message' => 'This complaint has already been re-opened once.'], 422);
        }

        $complaint->update([
            'status'      => 'open',
            'reopened_at' => now(),
            'expires_at'  => now()->addDays(7),
        ]);

        CalculateCompanyScore::dispatch($complaint->company_id);

        return response()->json($complaint->fresh());
    }
}
