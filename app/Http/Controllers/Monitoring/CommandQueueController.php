<?php

namespace App\Http\Controllers\Monitoring;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Command;
use App\Models\Device;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommandQueueController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Monitoring/Commands/Index', [
            'commands' => Command::query()->latest()->paginate(20)->withQueryString(),
            'devices' => Device::query()->orderBy('name')->get(['device_id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'device_id' => ['required', 'string', 'max:50'],
            'command' => ['required', 'string', 'in:start,stop,alert,reset,reboot'],
        ]);

        Command::query()->create([
            'device_id' => $validated['device_id'],
            'command' => $validated['command'],
            'status' => 'pending',
        ]);

        ActivityLog::query()->create([
            'device_id' => $validated['device_id'],
            'action' => 'command_sent',
            'detail' => $validated['command'],
        ]);

        return redirect()->back()->with('success', 'Command ditambahkan ke antrian.');
    }

    public function markExecuted(Command $command): RedirectResponse
    {
        if ($command->status !== 'pending') {
            return redirect()->back()->with('error', 'Command ini sudah bukan status pending.');
        }

        $command->update(['status' => 'executed']);

        ActivityLog::query()->create([
            'device_id' => $command->device_id,
            'action' => 'command_executed',
            'detail' => 'Command ID: '.$command->id,
        ]);

        return redirect()->back()->with('success', 'Command ditandai executed.');
    }

    public function destroy(Command $command): RedirectResponse
    {
        $command->delete();

        return redirect()->back()->with('success', 'Command dihapus.');
    }
}
