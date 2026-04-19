<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyClaim extends Model
{
    protected $fillable = [
        'company_id', 'user_id', 'claimant_name', 'claimant_email', 'claimant_position',
        'claimant_phone', 'abn_confirmation', 'proof_type', 'message',
        'status', 'reviewed_by', 'reviewed_at', 'rejection_reason',
    ];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }

    public function company()   { return $this->belongsTo(Company::class); }
    public function claimant()  { return $this->belongsTo(User::class, 'user_id'); }
    public function reviewer()  { return $this->belongsTo(User::class, 'reviewed_by'); }
}
