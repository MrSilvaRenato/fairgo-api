<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\ComplaintReply;
use Illuminate\Http\Request;

class ComplaintReplyController extends Controller
{
    public function index(Complaint $complaint)
    {
        if (!$complaint->is_public) {
            $user = request()->user();
            $company = $user?->company;
            if (!$user || ($user->id !== $complaint->consumer_id && $company?->id !== $complaint->company_id)) {
                abort(403);
            }
        }

        return response()->json(
            $complaint->replies()->with('user:id,name,role')->latest()->get()
        );
    }

    public function store(Request $request, Complaint $complaint)
    {
        $user = $request->user();
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
            'complaint_id' => $complaint->id,
            'user_id'      => $user->id,
            'author_type'  => $isConsumer ? 'consumer' : 'company',
            'content'      => $data['content'],
        ]);

        return response()->json($reply->load('user:id,name,role'), 201);
    }
}
