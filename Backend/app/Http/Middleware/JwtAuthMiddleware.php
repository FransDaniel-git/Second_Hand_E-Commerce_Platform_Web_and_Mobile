<?php

namespace App\Http\Middleware;

use Closure;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class JwtAuthMiddleware
{
    public function handle($request, Closure $next)
    {
        try {
            // Try pegawai authentication first
            if (auth('pegawai')->check()) {
                $user = auth('pegawai')->user();
                if (!$user) {
                    throw new JWTException('User not found');
                }
                return $next($request);
            }

            // Try pembeli authentication
            if (auth('pembeli')->check()) {
                $user = auth('pembeli')->user();
                if (!$user) {
                    throw new JWTException('User not found');
                }
                return $next($request);
            }

            if (auth('penitip')->check()) {
                $user = auth('penitip')->user();
                if (!$user) {
                    throw new JWTException('User not found');
                }
                return $next($request);
            }

            if (auth('organisasi')->check()) {
                $user = auth('organisasi')->user();
                if (!$user) {
                    throw new JWTException('User not found');
                }
                return $next($request);
            }

            // If no valid authentication found
            return response()->json(['error' => 'Unauthorized'], 401);

        } catch (JWTException $e) {
            return response()->json(['error' => 'Token is invalid or expired'], 401);
        }
    }
}
