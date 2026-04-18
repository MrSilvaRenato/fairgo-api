<?php

namespace App\Http\Controllers;

use App\Jobs\CalculateCompanyScore;
use App\Jobs\ModerateComplaint;
use App\Models\Company;
use App\Models\Complaint;
use App\Notifications\ComplaintFiledConsumer;
use App\Notifications\ComplaintFiledCompany;
use App\Services\AbnLookupService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ComplaintController extends Controller
{
    public function store(Request $request, AbnLookupService $abnService)
    {
        $data = $request->validate([
            'company_id'          => 'required_without:company_name|nullable|exists:companies,id',
            'company_name'        => 'required_without:company_id|nullable|string|max:255',
            'company_abn'         => 'required_with:company_name|nullable|string|max:14',
            'title'               => 'required|string|max:255',
            'description'         => 'required|string|max:5000',
            'expected_resolution' => 'nullable|string|max:1000',
            'category'            => 'required|in:billing,delivery,service,refund,fraud,other',
            'is_public'           => 'boolean',
        ]);

        // ── Unregistered company path ────────────────────────────────────────
        if (empty($data['company_id']) && !empty($data['company_name'])) {
            $abn    = preg_replace('/\s+/', '', $data['company_abn']);
            $result = $abnService->lookup($abn);

            if (!$result['valid']) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors'  => ['company_abn' => ['ABN of this company is wrong.']],
                ], 422);
            }

            // Find existing stub or create one
            $company = Company::firstOrCreate(
                ['abn' => $abn, 'is_stub' => true],
                [
                    'name'            => $data['company_name'],
                    'slug'            => Str::slug($data['company_name']) . '-' . substr($abn, -4),
                    'abn_entity_name' => $result['entity_name'] ?? null,
                    'abn_verified'    => true,
                    'is_stub'         => true,
                    'claimed'         => false,
                ]
            );

            $data['company_id'] = $company->id;
        }

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

        // Re-fetch after moderation job ran (sync queue updates the record inline)
        $complaint->refresh();

        return response()->json(
            array_merge(
                $complaint->load(['consumer:id,name', 'company:id,name,slug'])->toArray(),
                ['moderation_status' => $complaint->moderation_status]
            ),
            201
        );
    }

    public function show(Complaint $complaint)
    {
        if (!$complaint->is_public) {
            $user = request()->user();
            $isOwner = $user && $user->id === $complaint->consumer_id;
            $isAdmin = $user && $user->role === 'admin';
            $isCompany = $user && $user->role === 'company_admin' && $user->company?->id === $complaint->company_id;
            if (!$isOwner && !$isAdmin && !$isCompany) {
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
