<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
  public function handle(Request $request, Closure $next)
{
    $key = $request->header('X-API-KEY');
    if (!$key || !\App\Models\ApiClient::where('api_key', $key)->exists()) {
        return response()->json(['error' => 'Unauthorized'], 401);
    }
    return $next($request);
}
}
