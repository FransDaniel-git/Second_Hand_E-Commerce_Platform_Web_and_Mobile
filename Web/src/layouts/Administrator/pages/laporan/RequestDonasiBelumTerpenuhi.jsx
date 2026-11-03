import React, { useState, useEffect } from "react";
import axios from "axios";
import { UnfulfilledDonationRequestReportPreview } from "./pdf/UnfulfilledDonationRequestPDFGenerator";

const RequestDonasiBelumTerpenuhi = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("No authentication token found. Please log in.");

      const response = await axios.get(
        "/api/owner/request-donasi-belum-terpenuhi",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setReportData(response.data.data.data);
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

  return (
    <div className="mx-auto p-6 bg-olive-100 min-h-screen font-sans">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Laporan Request Donasi
        </h1>
        <h2 className="text-lg text-gray-600">
          ReUse Mart, Jl. Green Eco Park No. 456 Yogyakarta
        </h2>
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
      {!loading && !error && (!reportData || reportData.length === 0) && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          Tidak ada data laporan.
        </div>
      )}

      {!loading && !error && reportData && reportData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-olive-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    ID Organisasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Nama Organisasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Alamat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Request
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.id_organisasi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.nama_organisasi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.alamat}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.request}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <UnfulfilledDonationRequestReportPreview reportData={reportData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDonasiBelumTerpenuhi;
