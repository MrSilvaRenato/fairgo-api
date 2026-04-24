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
            $isAdmin = $user?->role === 'admin';
            if (!$user || (!$isAdmin && $user->id !== $complaint->consumer_id && $company?->id !== $complaint->company_id)) {
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
                    ->whereNull('consumer_read_at')
                    ->update(['consumer_read_at' => now()]);
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

        // Moderate the reply content before saving
        $content = $data['content'];
        try {
            $moderation = app(\App\Services\ContentModerationService::class);
            $result = $moderation->moderate($content, '', '');
            if ($result['action'] === 'flagged') {
                return response()->json([
                    'message'    => 'Your reply contains content that violates our community guidelines. Please revise and resubmit.',
                    'error_code' => 'reply_flagged',
                ], 422);
            }
            if ($result['action'] === 'edited' && !empty($result['edited_title'])) {
                $content = $result['edited_title'];
            }
        } catch (\Exception $e) {
            // Moderation failure — allow reply through
            \Log::error('Reply moderation failed: ' . $e->getMessage());
        }

        $reply = ComplaintReply::create([
            'complaint_id'    => $complaint->id,
            'user_id'         => $user->id,
            'author_type'     => $isConsumer ? 'consumer' : 'company',
            'content'         => $content,
            // Writer has already read their own message; recipient hasn't
            'consumer_read_at' => $isConsumer ? now() : null,
            'company_read_at'  => $isCompany  ? now() : null,
        ]);

        if ($isCompany) {
            $complaint->load('consumer');
            $complaint->consumer?->notify(new CompanyRepliedConsumer($complaint));
        }

        return response()->json($reply->load('user:id,name,role'), 201);
    }
}
