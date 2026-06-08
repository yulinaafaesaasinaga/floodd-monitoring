<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_dashboard_layouts', function (Blueprint $table) {
            $table->boolean('layout_locked')->default(false)->after('layout_json');
        });
    }

    public function down(): void
    {
        Schema::table('user_dashboard_layouts', function (Blueprint $table) {
            $table->dropColumn('layout_locked');
        });
    }
};
