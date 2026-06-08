<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_dashboard_layouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('layout_name')->default('default');
            $table->json('layout_json')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'layout_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_dashboard_layouts');
    }
};
