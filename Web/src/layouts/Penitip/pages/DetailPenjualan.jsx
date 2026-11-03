import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import axios from "axios";

const DetailPenjualan = ({ transactionId, productId, onBack }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const response = await axios.get(
          "http://localhost:8000/api/penitip/transaksi-penjualan",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to fetch transaction details"
          );
        }

        let selectedTransaction = null;

        if (transactionId === "N/A" && productId) {
          // Find N/A transaction and specific product
          const naTransaction = response.data.data.find(
            (tx) => tx.no_nota === "N/A"
          );
          if (naTransaction) {
            const product = naTransaction.products.find(
              (p) => p.product_id === productId
            );
            if (product) {
              selectedTransaction = {
                no_nota: "N/A",
                status: product.status,
                products: [product],
              };
            }
          }
        } else {
          // Find regular transaction by no_nota
          selectedTransaction = response.data.data.find(
            (tx) => tx.no_nota === transactionId
          );
        }

        if (!selectedTransaction) {
          throw new Error("Transaction or product not found");
        }

        // Map to UI structure
        const mappedTransaction = {
          no_nota: selectedTransaction.no_nota,
          status: selectedTransaction.status,
          products: selectedTransaction.products.map((p) => ({
            name: p.nama_barang,
            price: p.product_price_raw || 0,
            weight: p.weight,
            condition: p.condition,
            qc: p.nama_qc,
            komisi_penitip: p.komisi_penitip,
            komisi_hunter: p.komisi_hunter,
            komisi_reusemart: p.komisi_reusemart,
            bonus: p.bonus,
            image: p.image || "/api/placeholder/60/60", // Use backend-provided image with fallback
          })),
        };

        setTransaction(mappedTransaction);
      } catch (err) {
        console.error("Error fetching transaction details:", err);
        setError(
          err.message || "Gagal mengambil detail penjualan. Silakan coba lagi."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [transactionId, productId]);

  // Determine if rincian pendapatan should be shown
  const showRincianPendapatan = transaction
    ? ["Sudah Diterima", "Sudah Diambil", "Hangus"].includes(transaction.status)
    : false;

  // Calculate totals only if rincian pendapatan should be shown
  const totalHarga = showRincianPendapatan
    ? transaction.products.reduce((sum, product) => sum + product.price, 0)
    : 0;
  const totalKomisiReusemart = showRincianPendapatan
    ? transaction.products.reduce(
        (sum, product) => sum + (product.komisi_reusemart || 0),
        0
      )
    : 0;
  const totalKomisiHunter = showRincianPendapatan
    ? transaction.products.reduce(
        (sum, product) => sum + (product.komisi_hunter || 0),
        0
      )
    : 0;
  const totalKomisiPenitip = showRincianPendapatan
    ? transaction.products.reduce(
        (sum, product) => sum + product.komisi_penitip,
        0
      )
    : 0;
  const totalBonus = showRincianPendapatan
    ? transaction.products.reduce((sum, product) => sum + product.bonus, 0)
    : 0;
  const totalAkhir = showRincianPendapatan
    ? totalHarga -
      totalKomisiReusemart -
      totalKomisiHunter +
      totalKomisiPenitip +
      totalBonus
    : 0;

  // Show error state
  if (error) {
    return (
      <div className="text-center text-red-600">
        <p className="text-lg font-medium">Error:legate {error}</p>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="text-center text-gray-600">
        <p className="text-lg font-medium">Memuat detail penjualan...</p>
      </div>
    );
  }

  // Show not found state
  if (!transaction) {
    return (
      <div className="text-center text-gray-600">
        <p className="text-lg font-medium">Penjualan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Card Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Kembali</span>
        </button>
        <div className="flex items-center space-x-2">
          {transaction.no_nota !== "N/A" && (
            <>
              <span className="text-sm text-gray-600">
                NO. NOTA {transaction.no_nota}
              </span>
              <span className="text-sm font-medium text-gray-600">|</span>
            </>
          )}
          <span
            className={`text-sm font-medium ${
              transaction.status === "Sudah Diterima" ||
              transaction.status === "Sudah Diambil"
                ? "text-green-600"
                : transaction.status === "Didonasikan" ||
                  transaction.status === "Telah Didonasikan" ||
                  transaction.status === "Hangus" ||
                  transaction.status === "Dikembalikan"
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {transaction.status}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-6">
        {/* Detail Barang */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Detail Barang
          </h3>
          {transaction.products.length === 0 ? (
            <p className="text-sm text-gray-600">Tidak ada barang ditemukan.</p>
          ) : (
            transaction.products.map((product, index) => (
              <div
                key={index}
                className="flex items-start justify-between space-x-4 mb-4 last:mb-0"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => (e.target.src = "/api/placeholder/60/60")} // Fallback on image load error
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {product.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Berat:</p>
                        <p className="text-gray-800">{product.weight} KG</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Kondisi:</p>
                        <p className="text-gray-800">{product.condition}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pegawai QC:</p>
                        <p className="text-gray-800">{product.qc}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Harga:</p>
                  <span className="text-sm font-semibold text-gray-800">
                    Rp{product.price.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rincian Pendapatan */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Rincian Pendapatan
          </h3>
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Harga Barang</span>
              <span className="text-gray-800">
                {showRincianPendapatan
                  ? `Rp${totalHarga.toLocaleString("id-ID")}`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Komisi Reusemart</span>
              <span className="text-gray-800">
                {showRincianPendapatan && totalKomisiReusemart
                  ? `Rp${totalKomisiReusemart.toLocaleString("id-ID")}`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Komisi Hunter</span>
              <span className="text-gray-800">
                {showRincianPendapatan && totalKomisiHunter
                  ? `Rp${totalKomisiHunter.toLocaleString("id-ID")}`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Komisi Penitip</span>
              <span className="text-gray-800">
                {showRincianPendapatan && totalKomisiPenitip
                  ? `Rp${totalKomisiPenitip.toLocaleString("id-ID")}`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bonus</span>
              <span className="text-gray-800">
                {showRincianPendapatan && totalBonus
                  ? `Rp${totalBonus.toLocaleString("id-ID")}`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-800">Total Akhir</span>
              <span className="text-gray-800">
                {showRincianPendapatan
                  ? `Rp${totalAkhir.toLocaleString("id-ID")}`
                  : "Rp0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPenjualan;
