<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogApiRequests
{
    public function handle(Request $request, Closure $next)
    {
        // Biarkan permintaan diproses terlebih dahulu
        $response = $next($request);

        // Setelah selesai, jika ini adalah rute API, catat informasinya
        if ($request->is('api/*')) {
            $user = $request->user();
            $logData = [
                'ip' => $request->ip(),
                'method' => $request->method(), // Ini mencatat GET (read), POST, PUT, DELETE
                'url' => $request->fullUrl(),
                'status' => $response->getStatusCode(),
                'user' => $user ? "ID: {$user->getKey()}, Email: {$user->EMAIL}" : 'Guest',
            ];

            // Tulis log ke file harian
            Log::channel('daily')->info('API Call', $logData);
        }

        return $response;
    }
}