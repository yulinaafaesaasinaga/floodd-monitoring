<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  public function up()
{
    // Tabel devices
    Schema::create('devices', function (Blueprint $table) {
        $table->id();
        $table->string('device_id')->unique();
        $table->string('name');
        $table->string('location');
        $table->enum('status', ['online', 'offline'])->default('offline');
        $table->timestamps();
    });

    // Tabel sensor_data
    Schema::create('sensor_data', function (Blueprint $table) {
        $table->id();
        $table->string('device_id');
        $table->float('water_level');   // cm
        $table->float('rainfall');      // mm/h
        $table->enum('alert_level', ['normal', 'warning', 'danger'])->default('normal');
        $table->timestamps();
    });

    // Tabel commands
    Schema::create('commands', function (Blueprint $table) {
        $table->id();
        $table->string('device_id');
        $table->string('command');      // start, stop, alert
        $table->enum('status', ['pending', 'executed'])->default('pending');
        $table->timestamps();
    });

    // Tabel activity_log
    Schema::create('activity_logs', function (Blueprint $table) {
        $table->id();
        $table->string('device_id')->nullable();
        $table->string('action');
        $table->text('detail')->nullable();
        $table->timestamps();
    });

    // Tabel api_clients (API Key)
    Schema::create('api_clients', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('api_key')->unique();
        $table->timestamps();
    });
}
};