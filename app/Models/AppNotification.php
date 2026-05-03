<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model
{
    protected $table = 'app_notifications';

    protected $fillable = ['user_id', 'type', 'title', 'body', 'url', 'data'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'data'    => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Fire-and-forget helper. Silently skips if user_id is null.
     */
    public static function notify(int $userId, string $type, string $title, ?string $body = null, ?string $url = null): void
    {
        try {
            static::create([
                'user_id' => $userId,
                'type'    => $type,
                'title'   => $title,
                'body'    => $body,
                'url'     => $url,
            ]);
        } catch (\Throwable) {}
    }
}
