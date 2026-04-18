<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResolutionFeedback extends Model
{
    use HasFactory;

    protected $table = 'resolution_feedbacks';

    protected $fillable = [
        'complaint_id',
        'consumer_id',
        'resolved',
        'rating',
        'comment',
        'would_deal_again',
    ];

    protected function casts(): array
    {
        return [
            'resolved'         => 'boolean',
            'rating'           => 'integer',
            'would_deal_again' => 'boolean',
        ];
    }

    public function complaint()
    {
        return $this->belongsTo(Complaint::class);
    }

    public function consumer()
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }
}
