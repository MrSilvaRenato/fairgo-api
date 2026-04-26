<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    // GET /profile
    public function show(Request $request)
    {
        $user = $request->user();
        return response()->json($this->format($user));
    }

    // PATCH /profile
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'    => 'sometimes|string|max:255',
            'phone'   => 'sometimes|nullable|string|max:30',
            'address' => 'sometimes|nullable|string|max:500',
        ]);

        $user->update($data);

        return response()->json($this->format($user->fresh()));
    }

    // POST /profile/id-verification
    public function uploadId(Request $request)
    {
        $user = $request->user();

        // Don't allow re-upload if already approved
        if ($user->id_verification_status === 'approved') {
            return response()->json(['message' => 'Your identity is already verified.'], 422);
        }

        $request->validate([
            'document' => 'required|file|mimes:jpeg,jpg,png,pdf|max:10240',
        ]);

        // Remove old document if exists
        if ($user->id_document_path) {
            Storage::disk('private')->delete($user->id_document_path);
        }

        $path = $request->file('document')->store('id-documents', 'private');

        $user->update([
            'id_document_path'       => $path,
            'id_verification_status' => 'pending',
            'id_verified_at'         => null,
            'id_rejection_note'      => null,
        ]);

        return response()->json($this->format($user->fresh()));
    }

    private function format(\App\Models\User $user): array
    {
        return [
            'id'                      => $user->id,
            'name'                    => $user->name,
            'email'                   => $user->email,
            'phone'                   => $user->phone,
            'address'                 => $user->address,
            'role'                    => $user->role,
            'email_verified'          => $user->hasVerifiedEmail(),
            'phone_verified'          => $user->isPhoneVerified(),
            'id_verification_status'  => $user->id_verification_status,
            'id_verified_at'          => $user->id_verified_at?->toISOString(),
            'id_rejection_note'       => $user->id_rejection_note,
            'has_id_document'         => (bool) $user->id_document_path,
            'member_since'            => $user->created_at->format('F Y'),
        ];
    }
}
