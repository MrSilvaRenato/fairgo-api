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
        'reopened_at',
        'moderation_status',
        'moderation_flags',
        'moderation_note',
        'moderation_edited',
        'incident_date',
        'reference_number',
        'amount_involved',
        'contact_attempted',
        'phone',
        'anonymous_hash',
    ];

    protected $hidden = ['phone', 'reference_number', 'amount_involved'];

    protected function casts(): array
    {
        return [
            'is_public'          => 'boolean',
            'expires_at'         => 'datetime',
            'reopened_at'        => 'datetime',
            'moderation_flags'   => 'array',
            'moderation_edited'  => 'boolean',
            'incident_date'      => 'date:Y-m-d',
            'amount_involved'    => 'decimal:2',
            'contact_attempted'  => 'boolean',
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

    public function attachments()
    {
        return $this->hasMany(ComplaintAttachment::class);
    }
}
