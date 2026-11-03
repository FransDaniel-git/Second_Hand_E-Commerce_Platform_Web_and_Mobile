import React, { useEffect, useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";

const ManageHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [qcEmployee, setQcEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [buyerError, setBuyerError] = useState(null);
  const [qcError, setQcError] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "pembeli";
    setUserRole(role);
  }, []);

  useEffect(() => {
    if (userRole) fetchTransactions();
  }, [userRole]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const endpoint =
        userRole === "penitip" ? "/penitip/transaksi" : "/pembeli/transaksi";
      const response = await axiosInstance.get(endpoint);
      const completedTransactions = response.data.filter(
        (transaksi) => transaksi.STATUS === "selesai"
      );
      setTransactions(completedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setLoadError("Gagal memuat data transaksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDetailClick = async (transaksi) => {
    setSelectedTransaction(transaksi);
    setDetailLoading(true);
    setBuyerError(null);
    setQcError(null);

    try {
      const [buyerRes, qcRes] = await Promise.all([
        axiosInstance.get(`/pembeli/${transaksi.ID_PEMBELI}`).catch((error) => {
          console.error("Buyer fetch error:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            url: `/pembeli/${transaksi.ID_PEMBELI}`,
            id: transaksi.ID_PEMBELI,
          });
          if (error.response?.status === 404) {
            setBuyerError(`Pembeli dengan ID ${transaksi.ID_PEMBELI} tidak ditemukan`);
          } else {
            setBuyerError(`Gagal memuat data pembeli: ${error.message} (Status: ${error.response?.status || 'N/A'})`);
          }
          return { data: null };
        }),
        axiosInstance.get(`/pegawais/${transaksi.ID_PEGAWAI_GUDANG}`).catch((error) => {
          console.error("QC employee fetch error:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            url: `/pegawais/${transaksi.ID_PEGAWAI_GUDANG}`,
            id: transaksi.ID_PEGAWAI_GUDANG,
          });
          if (error.response?.status === 404) {
            setQcError(`Pegawai QC dengan ID ${transaksi.ID_PEGAWAI_GUDANG} tidak ditemukan`);
          } else {
            setQcError(`Gagal memuat data pegawai QC: ${error.message} (Status: ${error.response?.status || 'N/A'})`);
          }
          return { data: null };
        }),
      ]);

      // Validate and set buyer data
      if (buyerRes.data) {
        if (buyerRes.data.EMAIL && buyerRes.data.NAMA) {
          setBuyerDetails(buyerRes.data);
        } else {
          console.error("Buyer data missing expected fields:", buyerRes.data);
          setBuyerError("Data pembeli tidak memiliki field EMAIL atau NAMA");
        }
      }

      // Validate and set QC employee data
      if (qcRes.data) {
        if (qcRes.data.NAMA && qcRes.data.ID_PEGAWAI) {
          setQcEmployee(qcRes.data);
        } else {
          console.error("QC employee data missing expected fields:", qcRes.data);
          setQcError("Data pegawai QC tidak memiliki field NAMA atau ID_PEGAWAI");
        }
      }

      setIsModalOpen(true);
    } catch (error) {
      console.error("Unexpected error in handleDetailClick:", error);
      setBuyerDetails(null);
      setQcEmployee(null);
      setIsModalOpen(true); // Still open modal to show error
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    setBuyerDetails(null);
    setQcEmployee(null);
    setBuyerError(null);
    setQcError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Riwayat Transaksi Selesai
      </h2>

      {loading ? (
        <p className="text-gray-500">Memuat data transaksi...</p>
      ) : loadError ? (
        <p className="text-red-500">{loadError}</p>
      ) : transactions.length === 0 ? (
        <p className="text-gray-500">Tidak ada transaksi selesai ditemukan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-2 text-left text-sm font-medium">
                  No. Nota
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium">
                  Tanggal Pesanan
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium">
                  Total Biaya
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium">Ongkir</th>
                <th className="px-4 py-2 text-left text-sm font-medium">
                  Total Akhir
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium">
                  Alamat
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium">
                  Pengiriman
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaksi) => (
                <tr key={transaksi.ID_PENJUALAN} className="border-b">
                  <td className="px-4 py-2">{transaksi.NO_NOTA_PENJUALAN}</td>
                  <td className="px-4 py-2">
                    {new Date(transaksi.TANGGAL_PESANAN).toLocaleDateString(
                      "id-ID"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    Rp {transaksi.TOTAL_BIAYA?.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2">
                    Rp {transaksi.ONGKIR?.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2">
                    Rp {transaksi.TOTAL_AKHIR?.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2">{transaksi.ALAMAT_PENGIRIMAN}</td>
                  <td className="px-4 py-2">{transaksi.METODE_PENGIRIMAN}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDetailClick(transaksi)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 focus:outline-none"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 relative">
            {detailLoading ? (
              <p className="text-center text-gray-600">
                Memuat detail transaksi...
              </p>
            ) : (
              <>
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-xl font-semibold">ReUse Mart</h3>
                  <p>Jl. Green Eco Park No. 456 Yogyakarta</p>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>No Nota:</strong> {selectedTransaction.NO_NOTA_PENJUALAN}</p>
                  <p><strong>Tanggal Pesan:</strong> {new Date(selectedTransaction.TANGGAL_PESANAN).toLocaleDateString("id-ID")} {new Date(selectedTransaction.TANGGAL_PESANAN).toLocaleTimeString("id-ID")}</p>
                  <p><strong>Lunas Pada:</strong> {new Date(selectedTransaction.TANGGAL_PEMBAYARAN).toLocaleDateString("id-ID")}</p>
                  <p><strong>Tanggal Ambil:</strong> {new Date().toLocaleDateString("id-ID")}</p>
                  <div className="border-t pt-2">
                    <p><strong>Pembeli:</strong> {buyerDetails ? `${buyerDetails.EMAIL} / ${buyerDetails.NAMA}` : buyerError || "Tidak ditemukan"}</p>
                    <p><strong>Alamat:</strong> {selectedTransaction.ALAMAT_PENGIRIMAN}</p>
                    <p><strong>Pengiriman:</strong> {selectedTransaction.METODE_PENGIRIMAN}</p>
                  </div>
                  <div className="border-t pt-2">
                    <p><strong>Kompor Tanam 3 Tungku:</strong> Rp {selectedTransaction.TOTAL_BIAYA?.toLocaleString("id-ID")}</p>
                    <p><strong>Hair Dryer Ion:</strong> Rp {selectedTransaction.ONGKIR?.toLocaleString("id-ID")}</p>
                    <p><strong>Total:</strong> Rp {selectedTransaction.TOTAL_AKHIR?.toLocaleString("id-ID")}</p>
                    <p><strong>Ongkos Kirim:</strong> Rp 0</p>
                    <p><strong>Total:</strong> Rp {selectedTransaction.TOTAL_AKHIR?.toLocaleString("id-ID")}</p>
                    <p><strong>Potongan 200 poin:</strong> -Rp {selectedTransaction.POIN_TERPAKAI?.toLocaleString("id-ID")}</p>
                    <p><strong>Total:</strong> Rp {selectedTransaction.TOTAL_AKHIR?.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="border-t pt-2">
                    <p><strong>Poin dari pesanan ini:</strong> 297</p>
                    <p><strong>Total poin customer:</strong> 300</p>
                  </div>
                  <div className="border-t pt-2">
                    <p><strong>QC oleh:</strong> {qcEmployee ? `${qcEmployee.NAMA} (P${qcEmployee.ID_PEGAWAI})` : qcError || "Tidak ditemukan"}</p>
                    <p><strong>Diambil oleh:</strong> _____________</p>
                    <p><strong>Tanggal:</strong> _____________</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Tutup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHistory;