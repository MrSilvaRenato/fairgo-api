<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ComplaintAttachment extends Model
{
    protected $fillable = [
        'complaint_id',
        'original_name',
        'stored_name',
        'mime_type',
        'size',
        'path',
    ];

    protected $appends = ['url'];

    public function complaint()
    {
        return $this->belongsTo(Complaint::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }

    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }
}
