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
          selectedTransaction = response.data.data.find(
            (tx) => tx.no_nota === transactionId
          );
        }

        if (!selectedTransaction) {
          throw new Error("Transaction or product not found");
        }

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
            image: p.image || "/api/placeholder/60/60",
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

  const showRincianPendapatan = transaction
    ? ["sudah diterima", "sudah diambil", "hangus"].includes(
        transaction.status.toLowerCase()
      )
    : false;

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

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        <p className="text-lg font-medium">Memuat detail penjualan...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6 text-center text-gray-600">
        <p className="text-lg font-medium">Penjualan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
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
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                transaction.status === "sudah diterima" ||
                transaction.status === "sudah diambil"
                  ? "bg-green-100 text-green-700"
                  : transaction.status === "didonasikan" ||
                    transaction.status === "telah didonasikan"
                  ? "bg-red-100 text-red-700"
                  : transaction.status === "hangus"
                  ? "bg-gray-100 text-gray-700"
                  : transaction.status === "dikembalikan"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {transaction.status}
            </span>
          </div>
        </div>

        {/* Detail Barang Table */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Detail Barang
          </h3>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {["Nama Barang", "Harga", "Berat", "Kondisi", "Pegawai QC"].map(
                    (header, index) => (
                      <th
                        key={`header-${index}`}
                        className="px-4 py-3 bg-olive-500 text-sm font-medium text-white uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transaction.products.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-sm text-center text-gray-500"
                    >
                      Tidak ada barang ditemukan.
                    </td>
                  </tr>
                ) : (
                  transaction.products.map((product, index) => (
                    <tr key={`product-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        Rp {product.price.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {product.weight}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {product.condition}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {product.qc}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rincian Pendapatan */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Rincian Pendapatan
          </h3>
          <div className="bg-olive-100 p-4 rounded-lg space-y-2">
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