<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GooglePlaceSnapshot extends Model
{
    protected $fillable = [
        'company_id',
        'place_id',
        'google_name',
        'rating',
        'user_ratings_total',
        'address',
        'phone',
        'website',
        'maps_url',
        'reviews',
        'fetched_at',
    ];

    protected function casts(): array
    {
        return [
            'rating'     => 'decimal:1',
            'reviews'    => 'array',
            'fetched_at' => 'datetime',
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function isStale(): bool
    {
        return $this->fetched_at === null || $this->fetched_at->lt(now()->subDays(7));
    }
}
