<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyScore extends Model
{
    use HasFactory;

    public $timestamps = false;

    /**
     * Minimum number of complaints recorded in the scoring window before
     * a numerical score and badge are shown publicly.
     * Below this threshold the company is shown as "Not enough data".
     */
    public const MIN_FOR_RATING = 10;

    protected $appends = ['badge', 'is_rated', 'complaints_needed'];

    protected $fillable = [
        'company_id',
        'response_rate',
        'resolution_rate',
        'avg_response_hours',
        'satisfaction_score',
        'total_complaints',
        'score',
        'last_calculated_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'last_calculated_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /** True once the company has enough complaints in the window to be rated. */
    public function getIsRatedAttribute(): bool
    {
        return $this->total_complaints >= self::MIN_FOR_RATING;
    }

    /** How many more complaints are needed before a score is shown. */
    public function getComplaintsNeededAttribute(): int
    {
        return max(0, self::MIN_FOR_RATING - $this->total_complaints);
    }

    public function getBadgeAttribute(): string
    {
        // No complaints at all
        if ($this->total_complaints < 1) return 'not_rated';

        // Below the minimum threshold — show raw stats but no score badge
        if ($this->total_complaints < self::MIN_FOR_RATING) return 'not_rated';

        if ($this->score >= 80) return 'excellent';
        if ($this->score >= 60) return 'good';
        if ($this->score >= 40) return 'regular';
        return 'poor';
    }
}
