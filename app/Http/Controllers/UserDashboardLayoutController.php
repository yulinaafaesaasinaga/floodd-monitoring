<?php

namespace App\Http\Controllers;

use App\Models\UserDashboardLayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserDashboardLayoutController extends Controller
{
    private const LAYOUT_NAMES = ['default', 'riwayat'];

    private function normalizedLayoutName(?string $name): string
    {
        $name = $name ?? 'default';

        return in_array($name, self::LAYOUT_NAMES, true) ? $name : 'default';
    }

    public function show(Request $request): JsonResponse
    {
        $name = $this->normalizedLayoutName($request->query('layout_name'));

        $layout = UserDashboardLayout::query()
            ->where('user_id', $request->user()->id)
            ->where('layout_name', $name)
            ->first();

        return response()->json([
            'layout' => $layout?->layout_json,
            'layout_locked' => (bool) ($layout?->layout_locked ?? false),
            'layout_name' => $name,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'layout' => ['nullable', 'array'],
            'layout_locked' => ['sometimes', 'boolean'],
            'layout_name' => ['sometimes', 'string', 'max:64'],
        ]);

        $name = $this->normalizedLayoutName($request->input('layout_name'));

        $existing = UserDashboardLayout::query()
            ->where('user_id', $request->user()->id)
            ->where('layout_name', $name)
            ->first();

        $layout = $request->has('layout')
            ? $request->input('layout')
            : $existing?->layout_json;

        $layoutLocked = $request->has('layout_locked')
            ? $request->boolean('layout_locked')
            : (bool) ($existing?->layout_locked ?? false);

        UserDashboardLayout::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'layout_name' => $name,
            ],
            [
                'layout_json' => $layout,
                'layout_locked' => $layoutLocked,
            ],
        );

        return response()->json(['message' => 'Layout disimpan.']);
    }

    public function destroy(Request $request): JsonResponse
    {
        $name = $this->normalizedLayoutName($request->query('layout_name'));

        UserDashboardLayout::query()
            ->where('user_id', $request->user()->id)
            ->where('layout_name', $name)
            ->delete();

        return response()->json(['message' => 'Layout direset.']);
    }
}
