<?php

use App\Http\Controllers\CommandController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Monitoring\CommandQueueController;
use App\Http\Controllers\Monitoring\DeviceController;
use App\Http\Controllers\Monitoring\SensorDataController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserDashboardLayoutController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::get('/landing/chart-data', [DashboardController::class, 'landingChart'])->name('landing.chart-data');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/riwayat', [DashboardController::class, 'riwayat'])->name('dashboard.riwayat');
    Route::post('/dashboard/riwayat/clear-data', [DashboardController::class, 'clearHistoryData'])->name('dashboard.riwayat.clear-data');
    Route::get('/dashboard/download', [DashboardController::class, 'download'])->name('dashboard.download');
    Route::get('/dashboard/download/excel', [DashboardController::class, 'downloadExcel'])->name('dashboard.download.excel');
    Route::get('/dashboard/kalender', [DashboardController::class, 'kalender'])->name('dashboard.kalender');
    Route::get('/dashboard/kalender/data', [DashboardController::class, 'kalenderData'])->name('dashboard.kalender.data');
    Route::get('/dashboard/dataset', [DashboardController::class, 'dataset'])->name('dashboard.dataset');
    Route::get('/dashboard/iot-connectivity', [DashboardController::class, 'iotConnectivity'])->name('dashboard.iot-connectivity');
    Route::get('/dashboard/firmware-api-host', [DashboardController::class, 'firmwareApiHost'])->name('dashboard.firmware-api-host');
    Route::post('/dashboard/commands/send', [CommandController::class, 'send'])->name('dashboard.commands.send');

    Route::get('/dashboard/user-layout', [UserDashboardLayoutController::class, 'show'])->name('dashboard.user-layout.show');
    Route::post('/dashboard/user-layout', [UserDashboardLayoutController::class, 'store'])->name('dashboard.user-layout.store');
    Route::delete('/dashboard/user-layout', [UserDashboardLayoutController::class, 'destroy'])->name('dashboard.user-layout.destroy');

    Route::middleware('role:admin')->prefix('monitoring')->name('monitoring.')->group(function () {
        Route::resource('devices', DeviceController::class)->except(['show']);
        Route::get('sensor-data', [SensorDataController::class, 'index'])->name('sensor-data.index');
        Route::delete('sensor-data/{id}', [SensorDataController::class, 'destroy'])->name('sensor-data.destroy');
        Route::get('commands', [CommandQueueController::class, 'index'])->name('commands.index');
        Route::post('commands', [CommandQueueController::class, 'store'])->name('commands.store');
        Route::post('commands/{command}/executed', [CommandQueueController::class, 'markExecuted'])->name('commands.executed');
        Route::delete('commands/{command}', [CommandQueueController::class, 'destroy'])->name('commands.destroy');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
