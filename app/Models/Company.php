<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'abn',
        'industry',
        'description',
        'website',
        'logo_url',
        'logo',
        'claimed',
        'verified_badge',
        'not_recommended',
        'abn_verified',
    ];

    protected function casts(): array
    {
        return [
            'claimed'         => 'boolean',
            'verified_badge'  => 'boolean',
            'not_recommended' => 'boolean',
            'abn_verified'    => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function complaints()
    {
        return $this->hasMany(Complaint::class);
    }

    public function responses()
    {
        return $this->hasMany(CompanyResponse::class);
    }

    public function score()
    {
        return $this->hasOne(CompanyScore::class);
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class);
    }
}
