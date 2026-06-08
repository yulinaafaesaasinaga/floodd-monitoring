<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Broadcast sinkron ke Reverb agar dashboard update tanpa queue worker.
 */
class SensorDataReceived implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public array $data) {}

    public function broadcastOn(): Channel
    {
        return new Channel('sensor-channel');
    }

    public function broadcastAs(): string
    {
        return 'sensor.updated';
    }
}
