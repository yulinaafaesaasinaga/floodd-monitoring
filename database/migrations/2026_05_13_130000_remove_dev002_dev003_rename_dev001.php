<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const REMOVE = ['DEV002', 'DEV003'];

    public function up(): void
    {
        foreach (self::REMOVE as $id) {
            DB::table('sensor_data')->where('device_id', $id)->delete();
            DB::table('commands')->where('device_id', $id)->delete();
            DB::table('activity_logs')->where('device_id', $id)->delete();
            DB::table('devices')->where('device_id', $id)->delete();
        }

        DB::table('devices')->where('device_id', 'DEV001')->update([
            'name' => 'Ciledug-Dapa',
            'updated_at' => now(),
        ]);

        $this->clearRemovedDevicesFromUserLayouts();
    }

    public function down(): void
    {
        DB::table('devices')->where('device_id', 'DEV001')->update([
            'name' => 'DEV001',
            'updated_at' => now(),
        ]);
    }

    private function clearRemovedDevicesFromUserLayouts(): void
    {
        if (! Schema::hasTable('user_dashboard_layouts')) {
            return;
        }

        $rows = DB::table('user_dashboard_layouts')->select('id', 'layout_json')->get();
        foreach ($rows as $row) {
            $decoded = $row->layout_json;
            if ($decoded === null || $decoded === '') {
                continue;
            }
            $layout = is_string($decoded) ? json_decode($decoded, true) : $decoded;
            if (! is_array($layout)) {
                continue;
            }
            $changed = false;
            foreach ($layout as $i => $widget) {
                if (! is_array($widget)) {
                    continue;
                }
                $did = $widget['device_id'] ?? null;
                if (in_array($did, self::REMOVE, true)) {
                    $layout[$i]['device_id'] = '';
                    $changed = true;
                }
            }
            if ($changed) {
                DB::table('user_dashboard_layouts')->where('id', $row->id)->update([
                    'layout_json' => json_encode($layout),
                    'updated_at' => now(),
                ]);
            }
        }
    }
};
