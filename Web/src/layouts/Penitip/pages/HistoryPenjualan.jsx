import React, { useState, useEffect } from "react";
import axios from "axios";
import DetailPenjualan from "./DetailPenjualan";

const HistoryPenjualan = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
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

        if (response.data.success) {
          const mappedTransactions = response.data.data.map((tx) => ({
            id: tx.no_nota,
            date: tx.tanggal_transaksi,
            status: tx.status,
            items: tx.products.map((product) => ({
              id: product.product_id,
              name: product.nama_barang,
              price: product.harga_barang,
              price_raw: product.product_price_raw || 0, // Raw price for calculations
              weight: product.weight,
              condition: product.condition,
              penitip: product.nama_penitip,
              qc: product.nama_qc,
              status: product.status,
              komisi_penitip: product.komisi_penitip,
              komisi_hunter: product.komisi_hunter,
              komisi_reusemart: product.komisi_reusemart,
              bonus: product.bonus,
              subtotal: product.subtotal,
              image: product.image || "/api/placeholder/60/60", // Ensure image fallback
            })),
            alamat: tx.alamat,
            nama_kurir: tx.nama_kurir,
            metode_pengiriman: tx.metode_pengiriman,
            total_pendapatan: tx.total_pendapatan,
          }));

          console.log("Fetched Transactions:", mappedTransactions);
          setTransactions(mappedTransactions);
        } else {
          throw new Error(
            response.data.message || "Failed to fetch sales transactions"
          );
        }
      } catch (err) {
        console.error("Error fetching sales transactions:", err);
        setError(
          err.response?.data?.message ||
            "Gagal mengambil riwayat penjualan. Silakan coba lagi."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
  };

  const handleCardBodyClick = (transactionId, productId = null) => {
    console.log(
      `Navigating to transaction details for ID: ${transactionId}, Product ID: ${productId}`
    );
    setSelectedTransaction({ transactionId, productId });
  };

  const handleBackToHistory = () => {
    setSelectedTransaction(null);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.items.some(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.qc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.status.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.date && tx.date.includes(searchQuery));

    let matchesStatus = false;

    if (filterStatus === "Semua") {
      matchesStatus = true;
    } else if (tx.status === "N/A") {
      matchesStatus = tx.items.some(
        (product) => product.status.toLowerCase() === filterStatus.toLowerCase()
      );
    } else {
      matchesStatus = tx.status.toLowerCase() === filterStatus.toLowerCase();
    }

    return matchesSearch && matchesStatus;
  });

  const statusFilters = [
    "Semua",
    "Menunggu Pembayaran",
    "Sedang Dikemas",
    "Sedang Dikirim",
    "Siap Diambil",
    "Sudah Diterima",
    "Sudah Diambil",
    "Didonasikan",
    "Telah Didonasikan",
    "Hangus",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {selectedTransaction ? (
        <DetailPenjualan
          transactionId={selectedTransaction.transactionId}
          productId={selectedTransaction.productId}
          onBack={handleBackToHistory}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Riwayat Penjualan
            </h2>
          </div>

          {isLoading && (
            <p className="text-center text-gray-500">
              Memuat riwayat penjualan...
            </p>
          )}
          {error && <p className="text-center text-red-600 mb-4">{error}</p>}

          {!isLoading && !error && (
            <>
              <div className="flex space-x-2 overflow-x-auto mb-4">
                {statusFilters.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleFilterChange(status)}
                    className={`text-sm font-medium px-4 py-2 rounded-lg border whitespace-nowrap transition ${
                      filterStatus === status
                        ? "bg-olive-500 text-white border-olive-500"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Cari transaksi penjualan..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-6">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-gray-500">
                    Tidak ada transaksi penjualan yang ditemukan.
                  </p>
                ) : (
                  filteredTransactions.map((tx) =>
                    tx.status === "N/A" ? (
                      tx.items
                        .filter(
                          (product) =>
                            filterStatus === "Semua" ||
                            product.status.toLowerCase() ===
                              filterStatus.toLowerCase()
                        )
                        .map((product, productIndex) => (
                          <div
                            key={`${tx.id}-${product.id}-${productIndex}`}
                            className="bg-white rounded-lg shadow-sm border border-gray-200"
                          >
                            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`text-sm font-medium ${
                                    product.status === "Didonasikan" ||
                                    product.status === "Telah Didonasikan"
                                      ? "text-red-600"
                                      : product.status === "Hangus"
                                      ? "text-gray-600"
                                      : "text-yellow-600"
                                  }`}
                                >
                                  Status Barang: {product.status}
                                </span>
                              </div>
                            </div>

                            <div
                              className="p-4 cursor-pointer hover:bg-gray-50 transition"
                              onClick={() =>
                                handleCardBodyClick(tx.id, product.id)
                              }
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 last:border-0">
                                <div className="flex items-start space-x-4">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {product.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      QC: {product.qc}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500">
                                      Harga:
                                    </p>
                                    <span className="text-sm font-semibold text-gray-800">
                                      {product.price}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end items-center p-4 border-t border-gray-200 bg-gray-50">
                              <div className="text-right">
                                <p className="text-sm text-gray-600">
                                  Total Pendapatan:{" "}
                                  <span className="font-semibold text-gray-800">
                                    {tx.total_pendapatan}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div
                        key={tx.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200"
                      >
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-gray-800">
                              No. Nota: {tx.id}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              tx.status === "Sudah Diterima" ||
                              tx.status === "Sudah Diambil"
                                ? "text-green-600"
                                : tx.status === "Didonasikan" ||
                                  tx.status === "Telah Didonasikan"
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>

                        <div
                          className="p-4 cursor-pointer hover:bg-gray-50 transition"
                          onClick={() => handleCardBodyClick(tx.id)}
                        >
                          <div className="space-y-4">
                            {tx.items.map((product, productIndex) => (
                              <div
                                key={productIndex}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 last:border-0"
                              >
                                <div className="flex items-start space-x-4">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {product.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      QC: {product.qc}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Status Barang: {product.status}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500">
                                      Harga:
                                    </p>
                                    <span className="text-sm font-semibold text-gray-800">
                                      {product.price}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end items-center p-4 border-t border-gray-200 bg-gray-50">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Total Pendapatan:{" "}
                              <span className="font-semibold text-gray-800">
                                {tx.total_pendapatan}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Tanggal Transaksi: {tx.date || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPenjualan;
