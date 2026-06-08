<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('siren_audios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('api_client_id')->constrained('api_clients')->cascadeOnDelete();
            $table->string('file_name', 255);
            $table->string('mime_type', 100)->default('audio/mpeg');
            $table->longText('audio_base64');
            $table->timestamps();

            $table->unique('api_client_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('siren_audios');
    }
};

