<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\ComplaintReply;
use App\Notifications\CompanyRepliedConsumer;
use Illuminate\Http\Request;

class ComplaintReplyController extends Controller
{
    public function index(Complaint $complaint)
    {
        if (!$complaint->is_public) {
            $user    = request()->user();
            $company = $user?->company;
            if (!$user || ($user->id !== $complaint->consumer_id && $company?->id !== $complaint->company_id)) {
                abort(403);
            }
        }

        $user    = request()->user();
        $company = $user?->company;

        if ($user) {
            if ($user->id === $complaint->consumer_id) {
                // Consumer opening thread → mark company replies as read
                $complaint->replies()
                    ->where('author_type', 'company')
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            } elseif ($company?->id === $complaint->company_id) {
                // Company opening thread → mark consumer replies as read
                $complaint->replies()
                    ->where('author_type', 'consumer')
                    ->whereNull('company_read_at')
                    ->update(['company_read_at' => now()]);
            }
        }

        return response()->json(
            $complaint->replies()->with('user:id,name,role')->oldest()->get()
        );
    }

    public function store(Request $request, Complaint $complaint)
    {
        $user    = $request->user();
        $company = $user->company;

        $isConsumer = $user->id === $complaint->consumer_id;
        $isCompany  = $company?->id === $complaint->company_id;

        if (!$isConsumer && !$isCompany) {
            abort(403, 'Only the complaint parties can reply.');
        }

        if (in_array($complaint->status, ['resolved', 'unresolved'])) {
            return response()->json(['message' => 'Cannot reply to a closed complaint.'], 422);
        }

        $data = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $reply = ComplaintReply::create([
            'complaint_id'    => $complaint->id,
            'user_id'         => $user->id,
            'author_type'     => $isConsumer ? 'consumer' : 'company',
            'content'         => $data['content'],
            // Writer has read their own message; recipient hasn't
            'read_at'         => $isConsumer ? now() : null,   // consumer-side read
            'company_read_at' => $isCompany  ? now() : null,   // company-side read
        ]);

        if ($isCompany) {
            $complaint->load('consumer');
            $complaint->consumer?->notify(new CompanyRepliedConsumer($complaint));
        }

        return response()->json($reply->load('user:id,name,role'), 201);
    }
}
