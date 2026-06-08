<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDashboardLayout extends Model
{
    protected $fillable = [
        'user_id',
        'layout_name',
        'layout_json',
        'layout_locked',
    ];

    protected $casts = [
        'layout_json' => 'array',
        'layout_locked' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
