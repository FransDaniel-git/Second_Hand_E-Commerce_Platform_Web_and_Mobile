import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { Download, RefreshCw } from "lucide-react";

const MonitoringLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState("today");
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const res = await axiosInstance.get(`/admin/monitoring-logs?filter=${filter}`);
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
      setLoadError(err.response?.data?.error || "Failed to load logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const response = await axiosInstance.get(
        `/admin/monitoring-logs/download?filter=${filter}`,
        { responseType: 'blob' } // Penting: minta data sebagai file blob
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `monitoring-logs-${filter}-${new Date().toISOString().slice(0,10)}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Download failed:", error);
      alert("Gagal men-download PDF. Pastikan Anda login dan memiliki hak akses.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR': case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'INFO': case 'NOTICE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filters = ["today", "week", "month", "all"];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">System Monitoring Logs</h1>

      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-700">Filter by:</span>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded-md transition ${
                filter === f
                  ? "bg-olive-500 text-white font-bold shadow-sm"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
            <button
                onClick={fetchLogs}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-600 flex items-center disabled:bg-gray-300"
            >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="bg-green-600 text-white px-4 py-2 text-sm rounded-md hover:bg-green-700 flex items-center disabled:bg-gray-400"
            >
              <Download size={16} className="mr-2" />
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {loadError}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-olive-500"></div>
          <p className="ml-4 text-gray-600">Loading logs...</p>
        </div>
      ) : (
        <div className="overflow-hidden sm:rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{log.timestamp}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{log.message}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                      {log.context && Object.keys(log.context).length > 0 ? (
                        <pre className="whitespace-pre-wrap break-all bg-gray-100 p-2 rounded">{JSON.stringify(log.context, null, 2)}</pre>
                      ) : (
                        <span className="text-gray-400">No context</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="text-center py-10 text-gray-500">No logs found for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MonitoringLogs;