<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Command;
use App\Models\ActivityLog;

class CommandController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'device_id' => 'required|string',
            'command' => 'required|string',
        ]);

        $cmd = Command::create([
            'device_id' => $request->device_id,
            'command'   => $request->command,
            'status'    => 'pending',
        ]);

        ActivityLog::create([
            'device_id' => $request->device_id,
            'action'    => 'command_sent',
            'detail'    => $request->command
        ]);

        return response()->json([
            'message' => 'Command queued',
            'id' => $cmd->id,
        ]);
    }

    public function get(Request $request)
    {
        $cmd = Command::where('device_id', $request->device_id)
                      ->where('status', 'pending')
                      ->first();
        return response()->json($cmd);
    }

    public function done(Request $request)
    {
        Command::where('id', $request->id)->update(['status' => 'executed']);

        ActivityLog::create([
            'device_id' => $request->device_id,
            'action'    => 'command_executed',
            'detail'    => 'Command ID: ' . $request->id
        ]);

        return response()->json(['message' => 'Command updated']);
    }

}