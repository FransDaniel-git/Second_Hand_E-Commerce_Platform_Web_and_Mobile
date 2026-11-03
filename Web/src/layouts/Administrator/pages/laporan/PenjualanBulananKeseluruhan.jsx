import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  BarController,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  BarElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  BarController
);

import { MonthlySalesReportPreview } from "./pdf/MonthlySalesPDFGenerator";

const PenjualanBulananKeseluruhan = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    fetchSalesData();
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [selectedYear]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // Match AuthService approach
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      console.log("=== DEBUGGING FRONTEND ===");
      console.log("Fetching data for year:", selectedYear);

      const response = await axios.get(
        "/api/owner/penjualan-bulanan-keseluruhan",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { year: selectedYear },
        }
      );

      if (response.data.success) {
        console.log("Success response detected");
        const salesData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        console.log("Final data to set:", salesData);
        setSalesData(salesData);
      } else {
        throw new Error(response.data.message || "Failed to fetch sales data");
      }
    } catch (err) {
      console.error("=== FETCH ERROR ===");
      console.error("Error message:", err.message);
      console.error("Error response:", err.response?.data);

      setError(
        "Gagal mengambil data penjualan: " +
          (err.response?.data?.message || err.message)
      );
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && salesData.length > 0 && chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      const totalBiaya = salesData.map((item) => item.total_biaya || 0);

      chartInstanceRef.current = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels: months,
          datasets: [
            {
              label: "Jumlah Penjualan (Rp)",
              data: totalBiaya,
              backgroundColor: "rgba(119, 120, 74, 0.8)",
              borderColor: "rgba(119, 120, 74, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "top",
              labels: { font: { family: "Inter", size: 14 } },
            },
            title: {
              display: true,
              text: `Laporan Penjualan Bulanan Keseluruhan ${selectedYear}`,
              font: { family: "Inter", size: 18, weight: "bold" },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Jumlah Penjualan (Rp)",
                font: { family: "Inter", size: 14 },
              },
              ticks: {
                callback: (value) => `Rp${value.toLocaleString("id-ID")}`,
              },
            },
            x: {
              title: {
                display: true,
                text: "Bulan",
                font: { family: "Inter", size: 14 },
              },
            },
          },
        },
      });
    }
  }, [salesData, loading]);

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className=" mx-auto p-6 bg-olive-100 min-h-screen font-sans">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Laporan Penjualan Bulanan Keseluruhan
        </h1>
        <h2 className="text-lg text-gray-600">
          Reuse Mart, Jl. Green Eco Park No. 456 Yogyakarta
        </h2>
      </div>

      <div className="mb-6 flex items-center">
        <label className="text-gray-700 text-sm font-medium">
          Pilih Tahun :{" "}
        </label>
        <select
          value={selectedYear}
          onChange={handleYearChange}
          className="p-2 border rounded-md bg-white text-sm focus:ring-2 mx-2 focus:ring-olive-500 focus:outline-none"
        >
          {[2023, 2024, 2025].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-4">
          <span className="text-gray-600 text-lg">Memuat data...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      {!loading && !error && salesData.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          Tidak ada data penjualan untuk tahun {selectedYear}.
        </div>
      )}

      {!loading && !error && salesData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Grafik Penjualan
            </h2>
            <canvas ref={chartRef} className="w-full h-80"></canvas>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Laporan Penjualan
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-olive-500">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Bulan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Jumlah Barang Terjual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Jumlah Penjualan Kotor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.bulan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.total_transaksi}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.total_biaya)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-olive-100 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {salesData.reduce(
                        (sum, item) => sum + item.total_transaksi,
                        0
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(
                        salesData.reduce(
                          (sum, item) => sum + item.total_biaya,
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <MonthlySalesReportPreview
                salesData={salesData}
                selectedYear={selectedYear}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenjualanBulananKeseluruhan;
