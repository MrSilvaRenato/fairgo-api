<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Complaint;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request)
    {
        $q = trim($request->q ?? '');

        if (strlen($q) < 2) {
            return response()->json(['companies' => [], 'complaints' => []]);
        }

        $companies = Company::with('score')
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                      ->orWhere('industry', 'like', "%{$q}%");
            })
            ->limit(8)
            ->get()
            ->map(fn($c) => [
                'id'       => $c->id,
                'name'     => $c->name,
                'slug'     => $c->slug,
                'industry' => $c->industry,
                'website'  => $c->website,
                'logo_url' => $c->logo_url,
                'score'    => $c->score?->score,
                'badge'    => $c->score?->badge,
                'total'    => $c->score?->total_complaints ?? 0,
                'claimed'  => (bool) $c->claimed,
            ]);

        $complaints = Complaint::with(['company:id,name,slug', 'consumer:id,name'])
            ->where('is_public', true)
            ->where('status', '!=', 'removed')
            ->where(function ($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                      ->orWhere('description', 'like', "%{$q}%")
                      ->orWhere('category', 'like', "%{$q}%");
            })
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn($c) => [
                'id'          => $c->id,
                'title'       => $c->title,
                'description' => \Str::limit($c->description, 120),
                'category'    => $c->category,
                'status'      => $c->status,
                'created_at'  => $c->created_at,
                'company'     => $c->company,
                'consumer'    => $c->consumer,
            ]);

        return response()->json([
            'companies'  => $companies,
            'complaints' => $complaints,
        ]);
    }
}
