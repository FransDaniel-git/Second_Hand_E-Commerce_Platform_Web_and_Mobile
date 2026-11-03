<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class ApiLogController extends Controller
{
    public function getLogs(Request $request)
    {
        try {
            $filter = $request->query('filter', 'today');
            Log::debug('Fetching logs with filter: ' . $filter); // Debug filter
            $logs = $this->fetchAndParseLogs($filter);
            Log::debug('Parsed logs count: ' . count($logs)); // Debug jumlah log
            return response()->json($logs);
        } catch (\Exception $e) {
            // Log detail lengkap: message, file, line, dan stack trace
            Log::error('Failed to get logs', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'filter' => $request->query('filter', 'today'),
            ]);
            // Return detail error di response jika APP_DEBUG=true
            return response()->json([
                'error' => 'Gagal memproses file log.',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : 'Debug disabled',
            ], 500);
        }
    }

    public function downloadLogsPdf(Request $request)
    {
        try {
            $filter = $request->query('filter', 'today');
            Log::debug('Generating PDF with filter: ' . $filter); // Debug filter
            $logs = $this->fetchAndParseLogs($filter);
            Log::debug('Logs for PDF count: ' . count($logs)); // Debug jumlah log
            $data = [
                'logs' => $logs,
                'filter' => ucfirst($filter),
                'date' => Carbon::now()->toFormattedDateString(),
            ];
            $pdf = Pdf::loadView('logs_pdf', $data);
            return $pdf->download('monitoring-logs-' . $filter . '-' . date('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            // Log detail lengkap
            Log::error('Failed to generate PDF', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'filter' => $request->query('filter', 'today'),
            ]);
            // Return detail error di response
            return response()->json([
                'error' => 'Gagal membuat laporan PDF.',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : 'Debug disabled',
            ], 500);
        }
    }

    private function fetchAndParseLogs(string $filter): array
    {
        Log::debug('Starting fetchAndParseLogs with filter: ' . $filter); // Debug masuk fungsi
        $logFiles = File::glob(storage_path('logs/laravel-*.log'));
        Log::debug('Found log files: ' . json_encode($logFiles)); // Debug file ditemukan
        $parsedLogs = [];

        $startDate = match ($filter) {
            'today' => Carbon::today(),
            'week' => Carbon::today()->subWeek(),
            'month' => Carbon::today()->subMonth(),
            default => null, // 'all'
        };
        Log::debug('Filter start date: ' . ($startDate ? $startDate->toDateString() : 'all')); // Debug filter date

        foreach (array_reverse($logFiles) as $filePath) {
            if (!preg_match('/laravel-(\d{4}-\d{2}-\d{2})\.log/', $filePath, $matches)) {
                Log::debug('Skipping file, no date match: ' . $filePath);
                continue;
            }
            
            $logDate = Carbon::parse($matches[1]);
            Log::debug('Processing file: ' . $filePath . ', date: ' . $logDate->toDateString());
            if ($startDate && $logDate->lt($startDate)) {
                Log::debug('Skipping file, date too old: ' . $filePath);
                continue;
            }
            
            $lines = File::lines($filePath);
            foreach ($lines as $line) {
                Log::debug('Parsing line: ' . substr($line, 0, 100)); // Debug line, batasi 100 char
                if (preg_match('/^\[(.*?)\] (.*?)\.(.*?):\s(.*?)(?:\s*(\{.*))?$/', $line, $match)) {
                    $contextStr = isset($match[5]) ? $match[5] : '';
                    $context = [];
                    if ($contextStr) {
                        try {
                            $context = json_decode($contextStr, true);
                            Log::debug('Parsed context: ' . json_encode($context)); // Debug context
                        } catch (\JsonException $e) {
                            Log::debug('Invalid JSON in line: ' . $contextStr); // Debug JSON error
                            $context = ['error' => 'Invalid JSON', 'raw' => $contextStr];
                        }
                    }
                    $parsedLogs[] = [
                        'timestamp' => $match[1] ?? 'N/A',
                        'env' => $match[2] ?? 'N/A',
                        'level' => $match[3] ?? 'N/A',
                        'message' => trim($match[4] ?? 'N/A'),
                        'context' => $context ?: [],
                    ];
                } else {
                    Log::debug('Line not matched by regex: ' . substr($line, 0, 100)); // Debug unmatched line
                }
            }
        }
        
        Log::debug('Total parsed logs before sort: ' . count($parsedLogs)); // Debug jumlah sebelum sort
        usort($parsedLogs, fn($a, $b) => strtotime($b['timestamp']) <=> strtotime($a['timestamp']));
        Log::debug('Total parsed logs after sort: ' . count($parsedLogs)); // Debug jumlah setelah sort
        
        return array_slice($parsedLogs, 0, 500);
    }
}