<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request)
    {
        $q = trim($request->q ?? '');

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $companies = Company::with('score')
            ->where('name', 'like', "%{$q}%")
            ->orWhere('industry', 'like', "%{$q}%")
            ->limit(10)
            ->get()
            ->map(fn($c) => [
                'id'       => $c->id,
                'name'     => $c->name,
                'slug'     => $c->slug,
                'industry' => $c->industry,
                'score'    => $c->score?->score,
                'badge'    => $c->score?->badge,
                'total'    => $c->score?->total_complaints ?? 0,
            ]);

        return response()->json($companies);
    }
}
