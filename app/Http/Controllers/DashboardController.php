<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Command;
use App\Models\Device;
use App\Models\SensorData;
use App\Models\UserDashboardLayout;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $layoutRow = UserDashboardLayout::query()
            ->where('user_id', $request->user()->id)
            ->where('layout_name', 'default')
            ->first(['layout_json', 'layout_locked']);

        return Inertia::render('Dashboard', [
            'dashboard' => $this->buildDashboardPayload($request),
            'userLayout' => $layoutRow?->layout_json,
            'layoutLocked' => (bool) ($layoutRow?->layout_locked ?? false),
        ]);
    }

    public function riwayat(Request $request): Response
    {
        $layoutRow = UserDashboardLayout::query()
            ->where('user_id', $request->user()->id)
            ->where('layout_name', 'riwayat')
            ->first(['layout_json', 'layout_locked']);

        return Inertia::render('DashboardRiwayat', [
            'dashboard' => $this->buildDashboardPayload($request),
            'userLayout' => $layoutRow?->layout_json,
            'layoutLocked' => (bool) ($layoutRow?->layout_locked ?? false),
        ]);
    }

    /**
     * Same JSON shape as GET /api/dashboard/data (for polling from Inertia, session auth).
     */
    public function dataset(Request $request): JsonResponse
    {
        return response()->json($this->buildDashboardPayload($request));
    }

    /**
     * Ringkas untuk indikator sidebar: telemetri hidup dalam jendela timeout (sama logika dashboard).
     */
    public function iotConnectivity(Request $request): JsonResponse
    {
        $onlineTimeoutSeconds = min(max((int) $request->query('online_timeout', 12), 5), 600);
        $onlineThreshold = now()->subSeconds($onlineTimeoutSeconds);
        $liveTelemetry = SensorData::query()
            ->where('created_at', '>=', $onlineThreshold)
            ->exists();

        return response()->json([
            'live' => $liveTelemetry,
            'last_ingest_at' => SensorData::query()->max('created_at'),
        ]);
    }

    /**
     * Baca `const char *API_HOST = "..."` dari `client/Flood_Monitoring_System.ino` (repo root),
     * untuk default host di dashboard (sama sumber dengan firmware upload).
     */
    public function firmwareApiHost(Request $request): JsonResponse
    {
        $resolved = realpath(base_path('../client/Flood_Monitoring_System.ino'));
        $repoRoot = realpath(base_path('..'));

        if ($resolved === false || $repoRoot === false || ! str_starts_with($resolved, $repoRoot)) {
            return response()->json([
                'origin' => null,
                'error' => 'File client/Flood_Monitoring_System.ino tidak ditemukan.',
            ], 404);
        }

        $src = @file_get_contents($resolved);
        if ($src === false || $src === '') {
            return response()->json([
                'origin' => null,
                'error' => 'Gagal membaca file firmware.',
            ], 500);
        }

        if (! preg_match('/\bconst\s+char\s*\*\s*API_HOST\s*=\s*"([^"]+)"\s*;/', $src, $m)) {
            return response()->json([
                'origin' => null,
                'error' => 'Baris API_HOST tidak ditemukan di file .ino.',
            ], 422);
        }

        $raw = trim($m[1]);
        if ($raw === '') {
            return response()->json(['origin' => null, 'error' => 'API_HOST kosong.'], 422);
        }

        if (! preg_match('#^https?://#i', $raw)) {
            $raw = 'http://'.$raw;
        }

        $parts = parse_url($raw);
        if (empty($parts['scheme']) || empty($parts['host'])) {
            return response()->json([
                'origin' => null,
                'error' => 'Nilai API_HOST bukan URL yang valid.',
            ], 422);
        }

        $origin = $parts['scheme'].'://'.$parts['host'];
        if (! empty($parts['port'])) {
            $origin .= ':'.$parts['port'];
        }

        return response()->json([
            'origin' => $origin,
            'path' => 'client/Flood_Monitoring_System.ino',
        ]);
    }

    /**
     * Kosongkan tabel riwayat pembacaan sensor, antrian perintah, dan log aktivitas.
     */
    public function clearHistoryData(Request $request): JsonResponse
    {
        DB::transaction(function () {
            SensorData::query()->delete();
            Command::query()->delete();
            ActivityLog::query()->delete();
        });

        return response()->json([
            'message' => 'Riwayat sensor, antrian perintah, dan log aktivitas telah dikosongkan.',
            'dashboard' => $this->buildDashboardPayload($request),
        ]);
    }

    public function download(Request $request): Response
    {
        return Inertia::render('Download', [
            'devices' => Device::query()->orderBy('device_id')->get(['device_id', 'name'])->all(),
            'defaultDate' => now()->format('Y-m-d'),
        ]);
    }

    /**
     * Ekspor pembacaan sensor satu hari ke .xlsx (PhpSpreadsheet) atau .csv fallback bila paket belum terpasang.
     */
    public function downloadExcel(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'device_id' => ['nullable', 'string', 'max:64'],
        ]);

        $day = Carbon::createFromFormat('Y-m-d', $validated['date'])->startOfDay();
        $dayEnd = $day->copy()->endOfDay();

        $deviceNames = Device::query()->pluck('name', 'device_id');

        $query = SensorData::query()
            ->whereBetween('created_at', [$day, $dayEnd])
            ->orderBy('created_at');

        if (! empty($validated['device_id'])) {
            $query->where('device_id', $validated['device_id']);
        }

        $rows = $query->get(['device_id', 'water_level', 'alert_level', 'created_at']);

        $fileBase = 'ketinggian-air_'.$validated['date'];
        if (! empty($validated['device_id'])) {
            $fileBase .= '_'.$validated['device_id'];
        }

        if (class_exists(Spreadsheet::class)) {
            return $this->streamSensorDayAsSpreadsheet($rows, $deviceNames, $fileBase);
        }

        return $this->streamSensorDayAsCsv($rows, $deviceNames, $fileBase);
    }

    /**
     * @param  Collection<int, SensorData>  $rows
     * @param  Collection<string, string>  $deviceNames
     */
    private function streamSensorDayAsSpreadsheet(
        Collection $rows,
        Collection $deviceNames,
        string $fileBase,
    ): StreamedResponse {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Ketinggian');

        $sheet->fromArray([
            ['Nama perangkat', 'Ketinggian air (cm)', 'Waktu', 'Level'],
        ], null, 'A1');

        $r = 2;
        foreach ($rows as $row) {
            $name = $deviceNames[$row->device_id] ?? $row->device_id;
            $sheet->setCellValue("A{$r}", $name);
            $sheet->setCellValue("B{$r}", $row->water_level);
            $sheet->setCellValue(
                "C{$r}",
                $row->created_at instanceof Carbon
                    ? $row->created_at->timezone(config('app.timezone'))->format('d/m/Y H:i:s')
                    : (string) $row->created_at,
            );
            $sheet->setCellValue("D{$r}", $this->alertLevelLabelForExport((string) $row->alert_level));
            $r++;
        }

        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = $fileBase.'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * @param  Collection<int, SensorData>  $rows
     * @param  Collection<string, string>  $deviceNames
     */
    private function streamSensorDayAsCsv(
        Collection $rows,
        Collection $deviceNames,
        string $fileBase,
    ): StreamedResponse {
        $filename = $fileBase.'.csv';

        return response()->streamDownload(function () use ($rows, $deviceNames) {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Nama perangkat', 'Ketinggian air (cm)', 'Waktu', 'Level'], ';');
            foreach ($rows as $row) {
                $name = $deviceNames[$row->device_id] ?? $row->device_id;
                $time = $row->created_at instanceof Carbon
                    ? $row->created_at->timezone(config('app.timezone'))->format('d/m/Y H:i:s')
                    : (string) $row->created_at;
                fputcsv($out, [
                    $name,
                    (string) $row->water_level,
                    $time,
                    $this->alertLevelLabelForExport((string) $row->alert_level),
                ], ';');
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function kalender(): Response
    {
        return Inertia::render('Kalender');
    }

    public function kalenderData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $year = (int) $validated['year'];
        $month = (int) $validated['month'];
        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();

        $readings = SensorData::query()
            ->whereBetween('created_at', [$start, $end])
            ->get(['created_at', 'alert_level']);

        $countsByDay = [];
        foreach ($readings as $reading) {
            $dayKey = $reading->created_at->format('Y-m-d');
            if (! isset($countsByDay[$dayKey])) {
                $countsByDay[$dayKey] = ['normal' => 0, 'warning' => 0, 'danger' => 0];
            }
            $lvl = in_array($reading->alert_level, ['normal', 'warning', 'danger'], true)
                ? $reading->alert_level
                : 'normal';
            $countsByDay[$dayKey][$lvl]++;
        }

        $days = [];
        for ($cursor = $start->copy(); $cursor->lte($end); $cursor->addDay()) {
            $key = $cursor->format('Y-m-d');
            $counts = $countsByDay[$key] ?? ['normal' => 0, 'warning' => 0, 'danger' => 0];
            $days[$key] = $this->dominantAlertForDay($counts);
        }

        return response()->json([
            'year' => $year,
            'month' => $month,
            'days' => $days,
        ]);
    }

    /**
     * @param  array{normal?: int, warning?: int, danger?: int}  $counts
     */
    private function dominantAlertForDay(array $counts): ?string
    {
        $n = (int) ($counts['normal'] ?? 0);
        $w = (int) ($counts['warning'] ?? 0);
        $d = (int) ($counts['danger'] ?? 0);
        if ($n + $w + $d === 0) {
            return null;
        }

        $max = max($n, $w, $d);
        $atMax = [];
        if ($n === $max) {
            $atMax[] = 'normal';
        }
        if ($w === $max) {
            $atMax[] = 'warning';
        }
        if ($d === $max) {
            $atMax[] = 'danger';
        }

        if (in_array('danger', $atMax, true)) {
            return 'danger';
        }
        if (in_array('warning', $atMax, true)) {
            return 'warning';
        }

        return null;
    }

    private function alertLevelLabelForExport(string $level): string
    {
        return match ($level) {
            'danger' => 'AWAS',
            'warning' => 'SIAGA',
            default => 'AMAN',
        };
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildDashboardPayload(Request $request): array
    {
        $chartLimit = min(max((int) $request->query('chart_limit', 40), 5), 120);
        $onlineTimeoutSeconds = min(max((int) $request->query('online_timeout', 12), 5), 600);

        $chartDevicesRaw = $request->query('chart_devices');
        $chartDeviceSingle = $request->query('chart_device');

        $chartDevices = [];
        if ($chartDevicesRaw !== null && $chartDevicesRaw !== '') {
            $chartDevices = array_values(array_filter(array_map('trim', explode(',', (string) $chartDevicesRaw))));
        } elseif ($chartDeviceSingle !== null && $chartDeviceSingle !== '') {
            $chartDevices = [(string) $chartDeviceSingle];
        } else {
            $first = Device::orderBy('device_id')->value('device_id');
            $chartDevices = $first ? [$first] : [];
        }

        $chartReadingsByDevice = [];
        foreach ($chartDevices as $devId) {
            $readings = SensorData::where('device_id', $devId)
                ->latest()
                ->take($chartLimit)
                ->get()
                ->sortBy('created_at')
                ->values();

            $chartReadingsByDevice[$devId] = $readings;
        }

        $chartDevice = $chartDevices[0] ?? null;
        $chartReadings = $chartDevice ? ($chartReadingsByDevice[$chartDevice] ?? collect()) : collect();

        $devices = Device::orderBy('device_id')->get();
        $lastSeenByDevice = SensorData::selectRaw('device_id, MAX(created_at) as last_seen_at')
            ->groupBy('device_id')
            ->pluck('last_seen_at', 'device_id');

        $onlineThreshold = now()->subSeconds($onlineTimeoutSeconds);
        $devices = $devices->map(function ($device) use ($lastSeenByDevice, $onlineThreshold) {
            $lastSeenAt = $lastSeenByDevice[$device->device_id] ?? null;
            $lastCommandRow = Command::where('device_id', $device->device_id)
                ->where('status', 'executed')
                ->latest('id')
                ->first(['command', 'created_at']);
            $lastCommand = $lastCommandRow?->command;
            $lastCommandAt = $lastCommandRow?->created_at;

            $hasRecentTelemetry = $lastSeenAt !== null
                && Carbon::parse($lastSeenAt)->gte($onlineThreshold);
            $computedStatus = $hasRecentTelemetry ? 'online' : 'offline';

            if ($lastCommand === 'start') {
                $computedStatus = 'online';
            } elseif (in_array($lastCommand, ['stop', 'reset'], true)) {
                if ($lastSeenAt !== null && $lastCommandAt !== null) {
                    $seenAfterStop = Carbon::parse($lastSeenAt)->gt(Carbon::parse($lastCommandAt));
                    $computedStatus = ($seenAfterStop && $hasRecentTelemetry) ? 'online' : 'offline';
                } else {
                    $computedStatus = 'offline';
                }
            }

            $device->status = $computedStatus;
            $device->last_seen_at = $lastSeenAt;

            return $device;
        })->values();

        $chartReadingsByDeviceArray = [];
        foreach ($chartReadingsByDevice as $devId => $readings) {
            $chartReadingsByDeviceArray[$devId] = $readings->values()->all();
        }

        $lastIngestAt = SensorData::query()->max('created_at');
        $liveTelemetry = SensorData::query()
            ->where('created_at', '>=', $onlineThreshold)
            ->exists();

        return [
            'devices' => $devices->all(),
            'latest_data' => SensorData::latest()->take(100)->get()->all(),
            'chart_readings' => $chartReadings->values()->all(),
            'chart_device' => $chartDevice,
            'chart_readings_by_device' => $chartReadingsByDeviceArray,
            'commands' => Command::latest()->take(10)->get()->all(),
            'activity_log' => ActivityLog::latest()->take(30)->get()->all(),
            'online_timeout' => $onlineTimeoutSeconds,
            'thresholds_cm' => [
                'normal_max' => SensorController::TH_NORMAL_MAX_CM,
                'siaga_max' => SensorController::TH_SIAGA_MAX_CM,
            ],
            'iot_connectivity' => [
                'live' => $liveTelemetry,
                'last_ingest_at' => $lastIngestAt,
                'readings_last_hour' => SensorData::query()
                    ->where('created_at', '>=', now()->subHour())
                    ->count(),
            ],
            'stats' => [
                'devices_total' => $devices->count(),
                'sensor_readings_total' => SensorData::count(),
                'danger_awas_last_hour' => SensorData::query()
                    ->where('alert_level', 'danger')
                    ->where('created_at', '>=', now()->subHour())
                    ->count(),
                'warning_siaga_last_hour' => SensorData::query()
                    ->where('alert_level', 'warning')
                    ->where('created_at', '>=', now()->subHour())
                    ->count(),
            ],
        ];
    }

    public function data(Request $request): JsonResponse
    {
        return response()->json($this->buildDashboardPayload($request));
    }

    /**
     * Dataset ringkas untuk grafik hero landing (publik): sama sumber data chart dashboard.
     */
    public function landingChart(Request $request): JsonResponse
    {
        $payload = $this->buildDashboardPayload($request);

        return response()->json([
            'chart_readings' => $payload['chart_readings'],
            'chart_device' => $payload['chart_device'],
        ]);
    }

    public function log()
    {
        return response()->json(ActivityLog::latest()->take(30)->get());
    }
}
