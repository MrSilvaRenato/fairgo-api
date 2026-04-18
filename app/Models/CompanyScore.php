<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyScore extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $appends = ['badge'];

    protected $fillable = [
        'company_id',
        'response_rate',
        'resolution_rate',
        'avg_response_hours',
        'satisfaction_score',
        'total_complaints',
        'score',
        'last_calculated_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'last_calculated_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function getBadgeAttribute(): string
    {
        if ($this->total_complaints < 1) return 'not_rated';
        if ($this->score >= 80) return 'excellent';
        if ($this->score >= 60) return 'good';
        if ($this->score >= 40) return 'regular';
        return 'poor';
    }
}
