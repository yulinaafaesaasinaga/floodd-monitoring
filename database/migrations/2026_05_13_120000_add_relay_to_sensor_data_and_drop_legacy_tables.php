<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sensor_data', function (Blueprint $table) {
            $table->boolean('relay_on')->nullable()->after('alert_level');
        });

        Schema::dropIfExists('siren_audios');
        Schema::dropIfExists('dashboard_layouts');
        Schema::dropIfExists('worker_statuses');
    }

    public function down(): void
    {
        Schema::table('sensor_data', function (Blueprint $table) {
            $table->dropColumn('relay_on');
        });
    }
};
