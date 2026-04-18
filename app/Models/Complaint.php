<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'consumer_id',
        'company_id',
        'title',
        'description',
        'expected_resolution',
        'category',
        'status',
        'is_public',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_public'  => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    public function consumer()
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function response()
    {
        return $this->hasOne(CompanyResponse::class);
    }

    public function feedback()
    {
        return $this->hasOne(ResolutionFeedback::class);
    }

    public function replies()
    {
        return $this->hasMany(ComplaintReply::class);
    }
}
