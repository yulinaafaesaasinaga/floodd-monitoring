<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * @param  array<int, string>  $roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $role = (string) ($user->role ?? '');
        $allowed = collect($roles)->map(fn ($r) => (string) $r)->contains($role);

        if (! $allowed) {
            if ($request->expectsJson()) {
                abort(403);
            }

            return redirect()
                ->route('dashboard')
                ->with('error', 'Anda tidak punya akses ke halaman tersebut.');
        }

        return $next($request);
    }
}
