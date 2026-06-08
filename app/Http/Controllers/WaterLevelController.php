<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Data dummy berbasis waktu (gelombang sinus) — tidak membaca database.
 */
class WaterLevelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(self::buildIndexPayload());
    }

    public function history(Request $request, string $id): JsonResponse
    {
        $limit = min(max((int) $request->query('limit', 60), 5), 200);

        $now = microtime(true);
        $rows = [];
        for ($i = $limit - 1; $i >= 0; $i -= 1) {
            $t = $now - $i * 8;
            $value = self::dummyValueForDeviceAt($id, $t);
            $alert = SensorController::alertForWaterLevel($value);
            $created = Carbon::createFromTimestamp($t)->timezone(config('app.timezone'));
            $rows[] = [
                'id' => 100000 + $i,
                'device_id' => $id,
                'water_level' => round($value, 2),
                'alert_level' => $alert,
                'created_at' => $created->toIso8601String(),
            ];
        }

        return response()->json([
            'device_id' => $id,
            'history' => $rows,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function buildIndexPayload(): array
    {
        $normalMax = SensorController::TH_NORMAL_MAX_CM;
        $siagaMax = SensorController::TH_SIAGA_MAX_CM;
        $t = microtime(true);

        $defs = [
            ['id' => 'dummy-sungai-a', 'label' => 'Sensor Sungai A'],
            ['id' => 'dummy-sungai-b', 'label' => 'Sensor Sungai B'],
            ['id' => 'dummy-rawa', 'label' => 'Sensor Rawa'],
        ];

        $levels = [];
        foreach ($defs as $def) {
            $value = self::dummyValueForDeviceAt($def['id'], $t);
            $alert = SensorController::alertForWaterLevel($value);
            $levels[] = [
                'id' => $def['id'],
                'sensorId' => $def['id'],
                'label' => $def['label'],
                'value' => round($value, 2),
                'unit' => 'cm',
                'status' => self::statusLabelFromAlert($alert),
                'alert_level' => $alert,
                'updated_at' => now()->toIso8601String(),
            ];
        }

        return [
            'levels' => $levels,
            'thresholds_cm' => [
                'normal_max' => $normalMax,
                'siaga_max' => $siagaMax,
            ],
            'updated_at' => now()->toIso8601String(),
        ];
    }

    private static function dummyValueForDeviceAt(string $deviceId, float $unixTime): float
    {
        $hash = crc32($deviceId);
        $phase = ($hash % 1000) / 1000 * 6.28;
        $speed = 0.35 + ($hash % 5) * 0.04;

        $v = 5.5
            + sin($unixTime * $speed + $phase) * 3.2
            + sin($unixTime * $speed * 0.55 + $phase * 2) * 2.1
            + sin($unixTime * 0.12 + $phase) * 1.4;

        return max(0.0, min(50.0, $v));
    }

    private static function statusLabelFromAlert(string $alert): string
    {
        return match ($alert) {
            'danger' => 'BAHAYA',
            'warning' => 'SIAGA',
            default => 'NORMAL',
        };
    }
}
