<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComplaintReply extends Model
{
    protected $fillable = ['complaint_id', 'user_id', 'author_type', 'content', 'consumer_read_at', 'company_read_at'];

    // Bump the parent complaint's updated_at whenever a reply is added
    protected $touches = ['complaint'];

    protected function casts(): array
    {
        return [
            'consumer_read_at' => 'datetime',
            'company_read_at'  => 'datetime',
        ];
    }

    public function complaint()
    {
        return $this->belongsTo(Complaint::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
