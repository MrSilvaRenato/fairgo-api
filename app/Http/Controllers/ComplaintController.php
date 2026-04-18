<?php

namespace App\Http\Controllers;

use App\Jobs\CalculateCompanyScore;
use App\Jobs\ModerateComplaint;
use App\Models\Complaint;
use App\Notifications\ComplaintFiledConsumer;
use App\Notifications\ComplaintFiledCompany;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'company_id'          => 'required|exists:companies,id',
            'title'               => 'required|string|max:255',
            'description'         => 'required|string|max:5000',
            'expected_resolution' => 'nullable|string|max:1000',
            'category'            => 'required|in:billing,delivery,service,refund,fraud,other',
            'is_public'           => 'boolean',
        ]);

        $complaint = Complaint::create([
            ...$data,
            'consumer_id'       => $request->user()->id,
            'status'            => 'open',
            'is_public'         => $data['is_public'] ?? true,
            'expires_at'        => now()->addDays(7),
            'moderation_status' => 'pending',
        ]);

        $complaint->load(['consumer:id,name,email', 'company:id,name,slug,user_id', 'company.user:id,name,email']);

        CalculateCompanyScore::dispatch($complaint->company_id);
        ModerateComplaint::dispatch($complaint->id);

        // Notify consumer — confirmation
        $request->user()->notify(new ComplaintFiledConsumer($complaint));

        // Notify company admin — new complaint alert
        $companyUser = $complaint->company->user;
        if ($companyUser) {
            $companyUser->notify(new ComplaintFiledCompany($complaint));
        }

        return response()->json(
            $complaint->load(['consumer:id,name', 'company:id,name,slug']),
            201
        );
    }

    public function show(Complaint $complaint)
    {
        if (!$complaint->is_public) {
            if (!request()->user() || request()->user()->id !== $complaint->consumer_id) {
                abort(403);
            }
        }

        return response()->json(
            $complaint->load(['consumer:id,name', 'company:id,name,slug', 'response', 'feedback', 'replies.user:id,name,role'])
        );
    }

    public function index(Request $request)
    {
        $query = Complaint::with(['consumer:id,name', 'company:id,name,slug'])
            ->where('is_public', true)
            ->latest();

        if ($request->company_id) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        return response()->json($query->paginate(15));
    }
}
