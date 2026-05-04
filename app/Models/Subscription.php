<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'stripe_customer_id',
        'stripe_subscription_id',
        'plan',
        'status',
        'current_period_end',
    ];

    protected $hidden = ['stripe_customer_id', 'stripe_subscription_id'];

    protected function casts(): array
    {
        return [
            'current_period_end' => 'datetime',
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function onPlan(string $plan): bool
    {
        return $this->plan === $plan && $this->isActive();
    }
}
