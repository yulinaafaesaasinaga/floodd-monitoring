<?php

use App\Http\Controllers\CommandController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\WaterLevelController;
use Illuminate\Support\Facades\Route;

Route::middleware('apikey')->group(function () {
    Route::post('/ingest', [SensorController::class, 'ingest']);
    Route::get('/sensors', [SensorController::class, 'index']);

    Route::post('/command/send', [CommandController::class, 'send']);
    Route::get('/command/get', [CommandController::class, 'get']);
    Route::post('/command/done', [CommandController::class, 'done']);

    Route::get('/dashboard/data', [DashboardController::class, 'data']);
    Route::get('/dashboard/log', [DashboardController::class, 'log']);
});

Route::get('/water-levels', [WaterLevelController::class, 'index']);
Route::get('/water-levels/{id}/history', [WaterLevelController::class, 'history']);
