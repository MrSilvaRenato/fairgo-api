<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AfcaInsight extends Model
{
    protected $fillable = [
        'company_id',
        'firm_name',
        'primary_business',
        'period_year',
        'complaints_received',
        'complaints_resolved',
        'resolution_rate',
    ];

    protected function casts(): array
    {
        return [
            'resolution_rate' => 'decimal:2',
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
