<?php

namespace App\Http\Controllers;

use App\Jobs\CalculateCompanyScore;
use App\Mail\CompanyResponded;
use App\Models\Complaint;
use App\Models\CompanyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

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

        // Notify consumer
        $complaint->load(['consumer', 'company', 'response']);
        Mail::to($complaint->consumer->email)->queue(new CompanyResponded($complaint));

        return response()->json($response, 201);
    }
}
