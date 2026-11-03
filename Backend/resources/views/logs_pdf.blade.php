<!DOCTYPE html>
<html>
<head>
    <title>Monitoring Log Report</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 9px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ccc; padding: 5px; text-align: left; word-break: break-all; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Monitoring Log Report</h1>
    <p><strong>Filter:</strong> {{ $filter }} | <strong>Generated on:</strong> {{ $date }}</p>

    <table>
        <thead>
            <tr>
                <th style="width:18%;">Timestamp</th>
                <th style="width:8%;">Level</th>
                <th>Message</th>
                <th style="width:35%;">Context</th>
            </tr>
        </thead>
        <tbody>
            @forelse($logs as $log)
            <tr>
                <td>{{ $log['timestamp'] }}</td>
                <td>{{ $log['level'] }}</td>
                <td>{{ $log['message'] }}</td>
                <td><pre style="white-space: pre-wrap;">{{ json_encode($log['context'], JSON_PRETTY_PRINT) }}</pre></td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align: center;">No logs found for this period.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>