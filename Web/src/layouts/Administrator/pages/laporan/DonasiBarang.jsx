import React, { useState, useEffect } from "react";
import axios from "axios";
import { DonationReportPreview } from "./pdf/DonationReportPDFGenerator";

const DonasiBarang = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Generate array of years from 2023 to current year
  const currentYear = new Date().getFullYear();
  const startYear = 2023;
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i
  );

  useEffect(() => {
    fetchReportData();
  }, [selectedYear]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("No authentication token found. Please log in.");

      const response = await axios.get("/api/owner/donasi-barang", {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: selectedYear },
      });

      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch report data");
      }
    } catch (err) {
      setError(
        "Gagal mengambil data laporan: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  return (
    <div className="mx-auto p-6 bg-olive-100 min-h-screen font-sans">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Laporan Donasi Barang
        </h1>
        <h2 className="text-lg text-gray-600">
          ReUse Mart, Jl. Green Eco Park No. 456 Yogyakarta
        </h2>
      </div>

      <div className="mb-6 flex items-center">
        <label className="text-gray-700 text-sm font-medium">
          Pilih Tahun:
        </label>
        <select
          value={selectedYear}
          onChange={handleYearChange}
          className="p-2 border rounded-md bg-white text-sm focus:ring-2 mx-2 focus:ring-olive-500 focus:outline-none"
        >
          {years.map((year) => (
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
      {!loading &&
        !error &&
        (!reportData.data || reportData.data.length === 0) && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            Tidak ada data laporan untuk tahun {selectedYear}.
          </div>
        )}

      {!loading && !error && reportData.data && reportData.data.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Laporan Donasi Barang - Tahun {selectedYear}
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
                    Id Penitip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Nama Penitip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Tanggal Donasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Organisasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Nama Penerima
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.kode_produk}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.nama_produk}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.id_penitip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.nama_penitip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.tanggal_donasi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.organisasi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.nama_penerima}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <DonationReportPreview reportData={reportData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DonasiBarang;
