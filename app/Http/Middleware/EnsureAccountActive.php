<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class EnsureAccountActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && Auth::user()->status !== 'active') { // Assuming 'active' is the approved status
            // Optional: Logout if you want to force them to re-login when approved, 
            // but keeping them logged in allows them to just refresh.
            // However, for security, let's keep them logged in but restricted.

            // Allow access to the approval notice page to avoid infinite loop
            if ($request->routeIs('approval.notice') || $request->routeIs('logout')) {
                return $next($request);
            }

            return redirect()->route('approval.notice');
        }

        return $next($request);
    }
}
