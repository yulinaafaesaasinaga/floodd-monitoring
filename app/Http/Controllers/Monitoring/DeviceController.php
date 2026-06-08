<?php

namespace App\Http\Controllers\Monitoring;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Monitoring/Devices/Index', [
            'devices' => Device::query()->orderBy('device_id')->paginate(15)->withQueryString(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Monitoring/Devices/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'device_id' => ['required', 'string', 'max:50', 'unique:devices,device_id'],
            'name' => ['required', 'string', 'max:100'],
            'location' => ['required', 'string', 'max:200'],
            'status' => ['required', 'in:online,offline'],
        ]);

        Device::query()->create($validated);

        return redirect()->route('monitoring.devices.index')->with('success', 'Perangkat dibuat.');
    }

    public function edit(Device $device): Response
    {
        return Inertia::render('Monitoring/Devices/Edit', [
            'device' => $device,
        ]);
    }

    public function update(Request $request, Device $device): RedirectResponse
    {
        $validated = $request->validate([
            'device_id' => ['required', 'string', 'max:50', 'unique:devices,device_id,'.$device->id],
            'name' => ['required', 'string', 'max:100'],
            'location' => ['required', 'string', 'max:200'],
            'status' => ['required', 'in:online,offline'],
        ]);

        $device->update($validated);

        return redirect()->route('monitoring.devices.index')->with('success', 'Perangkat diperbarui.');
    }

    public function destroy(Device $device): RedirectResponse
    {
        $device->delete();

        return redirect()->route('monitoring.devices.index')->with('success', 'Perangkat dihapus.');
    }
}
