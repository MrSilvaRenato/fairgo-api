<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'phone_verified_at',
        'banned',
        'reputation_score',
        'reputation_flag',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'  => 'datetime',
            'phone_verified_at'  => 'datetime',
            'password'           => 'hashed',
            'banned'             => 'boolean',
        ];
    }

    public function isPhoneVerified(): bool
    {
        return $this->phone_verified_at !== null;
    }

    public function company()
    {
        return $this->hasOne(Company::class);
    }

    public function complaints()
    {
        return $this->hasMany(Complaint::class, 'consumer_id');
    }

    public function resolutionFeedbacks()
    {
        return $this->hasMany(ResolutionFeedback::class, 'consumer_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isCompanyAdmin(): bool
    {
        return $this->role === 'company_admin';
    }

    public function isConsumer(): bool
    {
        return $this->role === 'consumer';
    }
}
