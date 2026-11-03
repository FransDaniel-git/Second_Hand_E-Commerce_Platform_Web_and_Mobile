import React, { useState, useEffect } from "react";
import axios from "axios";
import { MonthlyCommissionReportPreview } from "./pdf/MonthlyCommissionPDFGenerator";

const KomisiBulananPerProduk = () => {
  const [commissionData, setCommissionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  // Generate array of years from 2023 to current year
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const startYear = 2023;
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i
  );

  // Filter months based on selected year
  const availableMonths =
    selectedYear === currentYear ? months.slice(0, currentMonth) : months;

  useEffect(() => {
    fetchCommissionData();
  }, [selectedYear, selectedMonth]);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("No authentication token found. Please log in.");

      const response = await axios.get("/api/owner/komisi-bulanan", {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: selectedYear, month: selectedMonth },
      });

      if (response.data.success) {
        setCommissionData(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch commission data"
        );
      }
    } catch (err) {
      setError(
        "Gagal mengambil data komisi: " +
          (err.response?.data?.message || err.message)
      );
      setCommissionData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
    // Reset month to latest available if selecting current year and current month is not available
    if (newYear === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  };

  const handleMonthChange = (e) => setSelectedMonth(parseInt(e.target.value));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="mx-auto p-6 bg-olive-100 min-h-screen font-sans">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Laporan Komisi Bulanan
        </h1>
        <h2 className="text-lg text-gray-600">
          Reuse Mart, Jl. Green Eco Park No. 456 Yogyakarta
        </h2>
      </div>

      <div className="mb-6 flex items-center space-x-4">
        <div>
          <label className="text-gray-700 text-sm font-medium">
            Pilih Bulan:{" "}
          </label>
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="p-2 border rounded-md bg-white text-sm focus:ring-2 focus:ring-olive-500 focus:outline-none"
          >
            {availableMonths.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-700 text-sm font-medium">
            Pilih Tahun:{" "}
          </label>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="p-2 border rounded-md bg-white text-sm focus:ring-2 focus:ring-olive-500 focus:outline-none"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
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
      {!loading &&
        !error &&
        (!commissionData.data || commissionData.data.length === 0) && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            Tidak ada data komisi untuk {months[selectedMonth - 1]}{" "}
            {selectedYear}.
          </div>
        )}

      {!loading &&
        !error &&
        commissionData.data &&
        commissionData.data.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Laporan Komisi Bulanan - {commissionData.bulan}{" "}
              {commissionData.tahun}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-olive-500">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Kode Produk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Nama Produk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Harga Jual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Tanggal Masuk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Tanggal Laku
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Komisi Penitip
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Komisi Hunter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Komisi ReuseMart
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Bonus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissionData.data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.kode_produk}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.nama_produk}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.harga_jual)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.tanggal_masuk}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.tanggal_laku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.komisi_penitip)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.komisi_hunter)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.komisi_reusemart)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.bonus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-olive-100 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(commissionData.totals.komisi_penitip)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(commissionData.totals.komisi_hunter)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(commissionData.totals.komisi_reusemart)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(commissionData.totals.bonus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(commissionData.totals.subtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <MonthlyCommissionReportPreview
                commissionData={commissionData}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </div>
          </div>
        )}
    </div>
  );
};

export default KomisiBulananPerProduk;
