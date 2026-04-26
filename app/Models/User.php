<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail, CanResetPassword
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;
    use \Illuminate\Auth\Passwords\CanResetPassword;

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\ResetPasswordNotification($token));
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new \App\Notifications\VerifyEmailNotification());
    }

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
        'deactivated_at',
        'address',
        'id_document_path',
        'id_verification_status',
        'id_verified_at',
        'id_rejection_note',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'      => 'datetime',
            'phone_verified_at'      => 'datetime',
            'password'               => 'hashed',
            'banned'                 => 'boolean',
            'deactivated_at'         => 'datetime',
            'id_verified_at'         => 'datetime',
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
