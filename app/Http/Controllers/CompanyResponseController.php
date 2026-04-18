<?php

namespace App\Http\Controllers;

use App\Jobs\CalculateCompanyScore;
use App\Models\Complaint;
use App\Models\CompanyResponse;
use App\Notifications\CompanyRepliedConsumer;
use Illuminate\Http\Request;

class CompanyResponseController extends Controller
{
    public function store(Request $request, Complaint $complaint)
    {
        $company = $request->user()->company;

        if (!$company || $company->id !== $complaint->company_id) {
            abort(403, 'You can only respond to complaints about your company.');
        }

        if ($complaint->response) {
            return response()->json(['message' => 'A response has already been submitted.'], 422);
        }

        $data = $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $response = CompanyResponse::create([
            'complaint_id' => $complaint->id,
            'company_id'   => $company->id,
            'content'      => $data['content'],
            'responded_at' => now(),
        ]);

        $complaint->update(['status' => 'responded']);

        CalculateCompanyScore::dispatch($complaint->company_id);

        // Notify consumer via queued notification (logs locally, SMTP in production)
        $complaint->load(['consumer', 'company']);
        $complaint->consumer?->notify(new CompanyRepliedConsumer($complaint));

        return response()->json($response, 201);
    }
}
