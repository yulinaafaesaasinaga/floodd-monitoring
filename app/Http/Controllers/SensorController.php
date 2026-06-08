<?php

namespace App\Http\Controllers;

use App\Events\SensorDataReceived;
use App\Models\ActivityLog;
use App\Models\Device;
use App\Models\SensorData;
use Illuminate\Http\Request;

class SensorController extends Controller
{
    /**
     * Ultrasonik: tinggi air (cm). Sesuai firmware ESP32:
     * NORMAL ≤ 4 cm, SIAGA ≤ 8 cm, AWAS > 8 cm (relay/pompa aktif di AWAS).
     */
    public const TH_NORMAL_MAX_CM = 4;

    public const TH_SIAGA_MAX_CM = 8;

    public static function alertForWaterLevel(float $waterLevelCm): string
    {
        if ($waterLevelCm <= self::TH_NORMAL_MAX_CM) {
            return 'normal';
        }
        if ($waterLevelCm <= self::TH_SIAGA_MAX_CM) {
            return 'warning';
        }

        return 'danger';
    }

    public static function statusLabelForWaterLevel(float $waterLevelCm): string
    {
        if ($waterLevelCm <= self::TH_NORMAL_MAX_CM) {
            return 'NORMAL';
        }
        if ($waterLevelCm <= self::TH_SIAGA_MAX_CM) {
            return 'SIAGA';
        }

        return 'AWAS';
    }

    public function ingest(Request $request)
    {
        $data = $request->validate([
            'device_id' => 'required|string|max:64',
            'water_level' => 'required|numeric|min:0|max:50',
            'rainfall' => 'sometimes|nullable|numeric|min:0',
            'relay_on' => 'sometimes|nullable|boolean',
            'status' => 'sometimes|nullable|string|max:32',
            'device_name' => 'sometimes|nullable|string|max:120',
            'location' => 'sometimes|nullable|string|max:120',
        ]);

        $water = (float) $data['water_level'];
        $alert = self::alertForWaterLevel($water);
        $label = $data['status'] ?? self::statusLabelForWaterLevel($water);

        $relayOn = array_key_exists('relay_on', $data) && $data['relay_on'] !== null
            ? (bool) $data['relay_on']
            : ($alert === 'danger');

        $rainfall = array_key_exists('rainfall', $data) && $data['rainfall'] !== null
            ? (float) $data['rainfall']
            : 0.0;

        SensorData::create([
            'device_id' => $data['device_id'],
            'water_level' => $water,
            'rainfall' => $rainfall,
            'alert_level' => $alert,
            'relay_on' => $relayOn,
        ]);

        $existing = Device::query()->where('device_id', $data['device_id'])->first();
        $name = filled($data['device_name'] ?? null)
            ? trim((string) $data['device_name'])
            : ($existing?->name ?: $data['device_id']);
        $location = filled($data['location'] ?? null)
            ? trim((string) $data['location'])
            : ($existing?->location ?: 'ESP32');

        Device::updateOrCreate(
            ['device_id' => $data['device_id']],
            [
                'status' => 'online',
                'name' => $name,
                'location' => $location,
            ],
        );

        ActivityLog::create([
            'device_id' => $data['device_id'],
            'action' => 'data_received',
            'detail' => sprintf(
                'Air %.2f cm · %s · relay %s · ingest',
                $water,
                $label,
                $relayOn ? 'ON' : 'OFF',
            ),
        ]);

        broadcast(new SensorDataReceived([
            'device_id' => $data['device_id'],
            'water_level' => $water,
            'alert_level' => $alert,
            'relay_on' => $relayOn,
        ]));

        return response()->json([
            'message' => 'Data saved',
            'alert_level' => $alert,
            'status' => $label,
            'relay_on' => $relayOn,
        ]);
    }

    public function index()
    {
        return response()->json(SensorData::latest()->take(50)->get());
    }
}
