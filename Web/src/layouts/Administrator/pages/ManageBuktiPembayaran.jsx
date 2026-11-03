import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const STORAGE_BASE_URL = "http://localhost:8000";

// Helper function to normalize payment proof URL
const normalizePaymentProofUrl = (path) => {
  if (!path) return null;
  // If path already starts with http, return as is
  if (path.startsWith("http")) return path;
  // If path doesn't start with 'storage/', add it
  const normalizedPath = path.startsWith("storage/") ? path : `storage/${path}`;
  return `${STORAGE_BASE_URL}/${normalizedPath}`;
};

const VerifikasiPembayaran = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [sortOrder, setSortOrder] = useState("unverified"); // Default to unverified

  useEffect(() => {
    fetchTransactions();
  }, [sortOrder]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8000/api/cs/verifikasi-pembayaran",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { sort: sortOrder }, // Pass sort parameter
        }
      );
      if (response.data.success) {
        // Map transactions and add base URL to bukti_pembayaran
        const mappedTransactions = response.data.data.map((tx) => ({
          ...tx,
          bukti_pembayaran: normalizePaymentProofUrl(tx.bukti_pembayaran),
        }));
        setTransactions(mappedTransactions);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch transactions"
        );
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Gagal mengambil daftar transaksi. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const handleVerify = async (noNota, action) => {
    const actionText = action === "accept" ? "menerima" : "menolak";
    const confirm = await Swal.fire({
      title: "Konfirmasi",
      text: `Apakah Anda yakin ingin ${actionText} bukti pembayaran ini?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
    });

    if (confirm.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          `http://localhost:8000/api/cs/verifikasi-pembayaran/${noNota}`,
          { action },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          await fetchTransactions();
          Swal.fire(
            "Sukses",
            "Status transaksi berhasil diperbarui.",
            "success"
          );
        } else {
          throw new Error(
            response.data.message || "Failed to update transaction status"
          );
        }
      } catch (err) {
        console.error("Error updating transaction status:", err);
        Swal.fire(
          "Error",
          "Gagal memperbarui status transaksi. Silakan coba lagi.",
          "error"
        );
      }
    }
  };

  return (
    <div className=" mx-auto px-4 py-8 relative lg:p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Verifikasi Pembayaran
      </h2>

      {/* Sort Toggle */}
      <div className="mb-4">
        <label htmlFor="sortOrder" className="mr-2 text-gray-600">
          Urutkan berdasarkan:{" "}
        </label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="unverified">Belum Diverifikasi</option>
          <option value="verified">Sudah Diverifikasi</option>
          <option value="all">Semua</option>
          <option value="oldest">Terlama</option>
        </select>
      </div>

      {isLoading && (
        <p className="text-center text-gray-500">Memuat daftar transaksi...</p>
      )}
      {error && <p className="text-center text-red-600 mb-4">{error}</p>}

      {!isLoading && !error && (
        <div className="space-y-6">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500">
              Tidak ada transaksi yang menunggu verifikasi.
            </p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.no_nota}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                  <span className="text-sm font-semibold text-gray-800">
                    No. Nota: {tx.no_nota}
                  </span>
                  <span className="text-sm font-medium text-yellow-600">
                    {tx.status}
                  </span>
                </div>
                <div className="p-4">
                  {tx.products.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 mb-4"
                    >
                      <img
                        src={product.image}
                        alt={product.nama_barang}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {product.nama_barang}
                        </p>
                        <p className="text-sm text-gray-500">
                          {product.harga_barang}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-sm text-gray-600">
                        Total Pesanan: {tx.total_akhir}
                      </p>
                      <p className="text-sm text-gray-600">
                        Tanggal Transaksi: {tx.tanggal_transaksi}
                      </p>
                      <p className="text-sm text-gray-600">
                        Nama Pembeli: {tx.nama_pembeli}
                      </p>
                      <p className="text-sm text-gray-600">
                        Email: {tx.email_pembeli}
                      </p>
                      <p className="text-sm text-gray-600">
                        Alamat: {tx.alamat}
                      </p>
                      <p className="text-sm text-gray-600">
                        Metode Pengiriman: {tx.metode_pengiriman}
                      </p>
                    </div>
                    {tx.bukti_pembayaran && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">
                          Bukti Pembayaran:
                        </p>
                        <img
                          src={tx.bukti_pembayaran}
                          alt="Bukti Pembayaran"
                          className="w-32 h-32 object-cover rounded cursor-pointer mt-2"
                          onClick={() => openModal(tx.bukti_pembayaran)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end items-center p-4 border-t border-gray-200 bg-gray-50">
                  {tx.status === "Menunggu Verifikasi" && (
                    <>
                      <button
                        onClick={() => handleVerify(tx.no_nota, "accept")}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-green-600"
                      >
                        Terima
                      </button>
                      <button
                        onClick={() => handleVerify(tx.no_nota, "reject")}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                      >
                        Tolak
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-3xl">
            <img
              src={selectedImage}
              alt="Zoomed Bukti Pembayaran"
              className="max-w-full max-h-[80vh] object-contain"
            />
            <button
              onClick={closeModal}
              className="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifikasiPembayaran;
