<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'complaint_id',
        'company_id',
        'content',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'responded_at' => 'datetime',
        ];
    }

    public function complaint()
    {
        return $this->belongsTo(Complaint::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
