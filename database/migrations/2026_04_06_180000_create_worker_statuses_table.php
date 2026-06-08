<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('worker_id');
            $table->string('device_id')->nullable();
            $table->string('status')->default('idle');
            $table->text('message')->nullable();
            $table->timestamp('last_heartbeat_at');
            $table->timestamps();

            $table->unique(['worker_id', 'device_id']);
            $table->index(['device_id', 'last_heartbeat_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_statuses');
    }
};
