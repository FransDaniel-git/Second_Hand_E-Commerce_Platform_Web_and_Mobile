import React, { useState, useEffect } from "react";
import axios from "axios";
import { PenitipTransactionReportPreview } from "./pdf/PenitipTransactionPDFGenerator";

const TransaksiPenitip = () => {
  const [report, setReport] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPenitip, setSelectedPenitip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Define months array
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
    year === currentYear ? months.slice(0, currentMonth) : months;

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token tidak ditemukan. Silakan login.");

      const response = await axios.get("/api/owner/laporan-transaksi", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: { year, month },
      });

      if (response.data.success) {
        // Aggregate data by penitip
        const penitipData = response.data.data.sold_items.reduce(
          (acc, item) => {
            const penitip = acc.find((p) => p.id_penitip === item.id_penitip);
            if (penitip) {
              penitip.items.push(item);
              penitip.total_pendapatan += item.total_pendapatan;
              penitip.total_komisi += item.komisi_penitip;
              penitip.total_bonus += item.bonus;
            } else {
              acc.push({
                id_penitip: item.id_penitip,
                nama_penitip: item.nama_penitip,
                items: [item],
                total_pendapatan: item.total_pendapatan,
                total_komisi: item.komisi_penitip,
                total_bonus: item.bonus,
              });
            }
            return acc;
          },
          []
        );

        setReport(penitipData);
      } else {
        throw new Error(response.data.message || "Gagal mengambil laporan");
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      setError(
        "Gagal mengambil data laporan: " + (err.message || "Terjadi kesalahan")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    })
      .format(number)
      .replace(/,00$/, "");
  };

  const getMonthName = (monthNumber) => {
    return new Date(2023, monthNumber - 1, 1).toLocaleString("id-ID", {
      month: "long",
    });
  };

  const filteredReport = report.filter(
    (penitip) =>
      penitip.id_penitip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      penitip.nama_penitip?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDetailModal = (penitip) => {
    setSelectedPenitip(penitip);
    setIsModalOpen(true);
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setYear(newYear);
    // Reset month to latest available if selecting current year and current month is not available
    if (newYear === currentYear && month > currentMonth) {
      setMonth(currentMonth);
    }
  };

  return (
    <div className="mt-4 p-6">
      <h1 className="text-3xl font-bold mb-8">Laporan Transaksi Penitip</h1>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-gray-700 text-sm font-medium mb-1 mr-2">
            Pilih Bulan:
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="p-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-olive-2 focus:outline-none"
          >
            {availableMonths.map((monthName, index) => (
              <option key={index + 1} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-700 text-sm font-medium mb-1 mr-2">
            Pilih Tahun:
          </label>
          <select
            value={year}
            onChange={handleYearChange}
            className="p-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-olive-2 focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Cari ID atau Nama Penitip..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-full sm:w-64"
        />
      </div>

      {loading && <p>Memuat laporan...</p>}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {report && (
        <div className="bg-white shadow p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">
            Laporan Transaksi - {getMonthName(month)} {year}
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-2xl shadow mt-4">
              <thead>
                <tr>
                  <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase">
                    ID Penitip
                  </th>
                  <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase">
                    Nama Penitip
                  </th>
                  <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase text-right">
                    Total Komisi
                  </th>
                  <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase text-right">
                    Total Bonus
                  </th>
                  <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase text-right">
                    Total Pendapatan
                  </th>
                  <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReport.length > 0 ? (
                  <>
                    {filteredReport.map((penitip, index) => (
                      <tr
                        key={penitip.id_penitip + index}
                        className="hover:bg-gray-50"
                      >
                        <td className="pl-6 py-3 whitespace-nowrap font-mono text-gray-900">
                          {penitip.id_penitip}
                        </td>
                        <td className="pl-6 py-3 whitespace-nowrap text-gray-900">
                          {penitip.nama_penitip}
                        </td>
                        <td className="pr-6 py-3 whitespace-nowrap text-right text-gray-900">
                          {formatRupiah(penitip.total_komisi)}
                        </td>
                        <td className="pr-6 py-3 whitespace-nowrap text-right text-gray-900">
                          {formatRupiah(penitip.total_bonus)}
                        </td>
                        <td className="pr-6 py-3 whitespace-nowrap text-right text-gray-900 font-semibold">
                          {formatRupiah(penitip.total_pendapatan)}
                        </td>
                        <td className="pr-6 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => openDetailModal(penitip)}
                            className="bg-olive-500 text-white px-3 py-1 rounded-md hover:bg-olive-700"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-gray-50">
                      <td colSpan="2" className="pl-6 py-3 text-gray-900">
                        TOTAL
                      </td>
                      <td className="pr-6 py-3 text-right text-gray-900">
                        {formatRupiah(
                          report.reduce((sum, p) => sum + p.total_komisi, 0)
                        )}
                      </td>
                      <td className="pr-6 py-3 text-right text-gray-900">
                        {formatRupiah(
                          report.reduce((sum, p) => sum + p.total_bonus, 0)
                        )}
                      </td>
                      <td className="pr-6 py-3 text-right text-gray-900">
                        {formatRupiah(
                          report.reduce((sum, p) => sum + p.total_pendapatan, 0)
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Tidak ada data transaksi untuk periode yang dipilih
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && selectedPenitip && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-3/4 max-h-[80vh] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              Detail Transaksi Penitip: {selectedPenitip.nama_penitip}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase">
                      Kode Produk
                    </th>
                    <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase">
                      Nama Produk
                    </th>
                    <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase">
                      Tanggal Masuk
                    </th>
                    <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase">
                      Tanggal Laku
                    </th>
                    <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase text-right">
                      Harga Jual Bersih
                    </th>
                    <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase text-right">
                      Bonus Terjual Cepat
                    </th>
                    <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase text-right">
                      Pendapatan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedPenitip.items.map((item, index) => (
                    <tr
                      key={item.kode_produk + index}
                      className="hover:bg-gray-50"
                    >
                      <td className="pl-6 py-3 whitespace-nowrap font-mono text-gray-900">
                        {item.kode_produk}
                      </td>
                      <td className="pl-6 py-3 whitespace-nowrap text-gray-900">
                        {item.nama_produk}
                      </td>
                      <td className="pl-6 py-3 whitespace-nowrap text-center text-gray-900">
                        {item.tanggal_penitipan || "-"}
                      </td>
                      <td className="pl-6 py-3 whitespace-nowrap text-center text-gray-900">
                        {item.tanggal_pembayaran
                          ? item.tanggal_pembayaran.split(" ")[0]
                          : "-"}
                      </td>
                      <td className="pr-6 py-3 whitespace-nowrap text-right text-gray-900">
                        {formatRupiah(item.komisi_penitip)}
                      </td>
                      <td className="pr-6 py-3 whitespace-nowrap text-right text-gray-900">
                        {formatRupiah(item.bonus)}
                      </td>
                      <td className="pr-6 py-3 whitespace-nowrap text-right text-gray-900 font-semibold">
                        {formatRupiah(item.total_pendapatan)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-50">
                    <td colSpan="4" className="pl-6 py-3 text-gray-900">
                      TOTAL
                    </td>
                    <td className="pr-6 py-3 text-right text-gray-900">
                      {formatRupiah(selectedPenitip.total_komisi)}
                    </td>
                    <td className="pr-6 py-3 text-right text-gray-900">
                      {formatRupiah(selectedPenitip.total_bonus)}
                    </td>
                    <td className="pr-6 py-3 text-right text-gray-900">
                      {formatRupiah(selectedPenitip.total_pendapatan)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6 space-x-4">
              <PenitipTransactionReportPreview
                penitipData={selectedPenitip}
                month={month}
                year={year}
              />
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransaksiPenitip;
