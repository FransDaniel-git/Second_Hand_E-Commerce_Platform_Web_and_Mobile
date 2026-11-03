import React, { useState, useEffect } from "react";
import axios from "axios";
import AuthService from "../../../services/authService";
import DetailPembelian from "./DetailPembelian";
import { useNavigate } from "react-router-dom";

const HistoryPembelian = ({ initialTransactionId }) => {
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [ratingError, setRatingError] = useState(null);
  const [ratingSuccess, setRatingSuccess] = useState(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(
    initialTransactionId || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const response = await axios.get(
          "http://localhost:8000/api/pembeli/transaksi",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          const groupedByNota = response.data.data.reduce((acc, tx) => {
            const existing = acc.find((t) => t.no_nota === tx.no_nota);
            if (existing) {
              existing.products.push(...tx.products);
            } else {
              acc.push({
                no_nota: tx.no_nota,
                status: tx.status,
                products: tx.products,
                total_akhir: tx.total_akhir,
                tanggal_transaksi: tx.tanggal_transaksi,
              });
            }
            return acc;
          }, []);

          let mappedTransactions = groupedByNota.map((tx) => {
            const itemsByPenitip = tx.products.reduce((acc, product) => {
              const penitip = product.nama_penitip || "Unknown";
              const imageUrl = product.image || "/api/placeholder/60/60";

              const existingPenitip = acc.find(
                (item) => item.shopName === penitip
              );
              if (existingPenitip) {
                existingPenitip.products.push({
                  id: product.product_id,
                  name: product.nama_barang,
                  price: product.harga_barang,
                  price_raw: product.product_price_raw || 0,
                  penitip: penitip,
                  image: imageUrl,
                  has_rating: product.has_rating || false,
                });
              } else {
                acc.push({
                  shopName: penitip,
                  products: [
                    {
                      id: product.product_id,
                      name: product.nama_barang,
                      price: product.harga_barang,
                      price_raw: product.product_price_raw || 0,
                      penitip: penitip,
                      image: imageUrl,
                      has_rating: product.has_rating || false,
                    },
                  ],
                });
              }
              return acc;
            }, []);

            return {
              id: tx.no_nota,
              date: tx.tanggal_transaksi,
              status: tx.status,
              items: itemsByPenitip,
              totalAmount: tx.total_akhir,
            };
          });

          console.log(
            "Mapped transactions before rating fetch:",
            mappedTransactions
          );

          mappedTransactions = await fetchRatingStatus(
            mappedTransactions,
            token
          );

          console.log(
            "Final transactions after rating fetch:",
            mappedTransactions
          );
          setTransactions(mappedTransactions);
        } else {
          throw new Error(
            response.data.message || "Failed to fetch transactions"
          );
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(
          err.response?.data?.message ||
            "Gagal mengambil riwayat transaksi. Silakan coba lagi."
        );
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRatingStatus = async (transactions, token) => {
      try {
        const completedStatuses = ["Sudah Diambil", "Sudah Diterima"];
        const updatedTransactions = JSON.parse(JSON.stringify(transactions));

        for (const tx of updatedTransactions) {
          if (completedStatuses.includes(tx.status)) {
            console.log(
              `Checking ratings for transaction ${tx.id} with status: ${tx.status}`
            );

            for (const item of tx.items) {
              for (const product of item.products) {
                try {
                  console.log(
                    `Fetching rating for product ${product.id}: ${product.name}`
                  );

                  const ratingResponse = await axios.get(
                    `http://localhost:8000/api/pembeli/rating/${product.id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );

                  if (ratingResponse.data.success) {
                    product.has_rating = ratingResponse.data.data.has_rating;
                    console.log(
                      `Product ${product.id} rating status:`,
                      product.has_rating
                    );
                  } else {
                    console.log(`No rating data for product ${product.id}`);
                  }
                } catch (ratingErr) {
                  console.log(
                    `Could not fetch rating for product ${product.id}:`,
                    ratingErr.message
                  );
                  product.has_rating = false;
                }
              }
            }
          } else {
            console.log(
              `Skipping rating fetch for transaction ${tx.id} with status: ${tx.status}`
            );
          }
        }

        return updatedTransactions;
      } catch (err) {
        console.error("Error fetching rating status:", err);
        return transactions;
      }
    };

    fetchTransactions();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
  };

  const handleCardBodyClick = (transactionId) => {
    navigate(`/transaksi/${transactionId}`);
  };

  const openRatingModal = (product, shopName) => {
    console.log("Opening rating modal for:", product.name, "Shop:", shopName);
    setSelectedProduct({ ...product, shopName });
    setRating(0);
    setRatingError(null);
    setRatingSuccess(null);
    setIsRatingModalOpen(true);
  };

  const handleRatingChange = (rating) => {
    setRating(rating);
    setRatingError(null);
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      setRatingError("Silakan pilih rating (1-5 bintang).");
      return;
    }

    setIsRatingLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8000/api/pembeli/rating",
        { product_id: selectedProduct.id, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setRatingSuccess("Rating berhasil disimpan!");

        setTransactions((prevTransactions) =>
          prevTransactions.map((tx) => ({
            ...tx,
            items: tx.items.map((item) => ({
              ...item,
              products: item.products.map((p) =>
                p.id === selectedProduct.id ? { ...p, has_rating: true } : p
              ),
            })),
          }))
        );

        setTimeout(() => {
          setIsRatingModalOpen(false);
          setSelectedProduct(null);
          setRating(0);
          setRatingSuccess(null);
          setIsRatingLoading(false);
        }, 1500);
      } else {
        throw new Error(response.data.message || "Failed to submit rating");
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
      setRatingError(
        err.response?.data?.message ||
          "Gagal menyimpan rating. Silakan coba lagi."
      );
      setIsRatingLoading(false);
    }
  };

  const handleImageError = (e, productName) => {
    console.error(
      `Failed to load image for product: ${productName}, URL: ${e.target.src}`
    );
    e.target.src = "/api/placeholder/60/60";
  };

  const shouldShowRatingButton = (transactionStatus, productHasRating) => {
    const completedStatuses = ["Sudah Diambil", "Sudah Diterima"];
    const result =
      completedStatuses.includes(transactionStatus) && !productHasRating;
    console.log(
      `shouldShowRatingButton: status=${transactionStatus}, hasRating=${productHasRating}, result=${result}`
    );
    return result;
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.date && tx.date.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.items.some((item) =>
        item.products.some(
          (product) =>
            product.penitip.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    const matchesStatus =
      filterStatus === "Semua" ? true : tx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusFilters = [
    "Semua",
    "Menunggu Pembayaran",
    "Menunggu Verifikasi",
    "Sedang Dikemas",
    "Siap Dikirim",
    "Sedang Dikirim",
    "Siap Diambil",
    "Sudah Diambil",
    "Sudah Diterima",
    "Dibatalkan",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      {selectedTransactionId ? (
        <DetailPembelian
          transactionId={selectedTransactionId}
          onBack={handleBackToHistory}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Riwayat Pembelian
            </h2>
          </div>

          {isLoading && (
            <p className="text-center text-gray-500">
              Memuat riwayat transaksi...
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
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-6">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-gray-500">
                    Tidak ada transaksi yang ditemukan.
                  </p>
                ) : (
                  filteredTransactions.map((tx) => (
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
                              : tx.status === "Dibatalkan"
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
                        {tx.items.map((item, shopIndex) => (
                          <div key={shopIndex} className="mb-6 last:mb-0">
                            <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-gray-100">
                              <span className="text-sm font-semibold text-gray-700">
                                {item.shopName}
                              </span>
                            </div>
                            <div className="space-y-4">
                              {item.products.map((product, productIndex) => (
                                <div
                                  key={productIndex}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 last:border-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-start space-x-4">
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-16 h-16 object-cover rounded"
                                      onError={(e) =>
                                        handleImageError(e, product.name)
                                      }
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-800">
                                        {product.name}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        Status: {tx.status}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 min-w-fit">
                                    <div className="text-right">
                                      <p className="text-sm text-gray-500">
                                        Harga:
                                      </p>
                                      <span className="text-sm font-semibold text-gray-800">
                                        {product.price}
                                      </span>
                                    </div>

                                    {shouldShowRatingButton(
                                      tx.status,
                                      product.has_rating
                                    ) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log(
                                            "Rating button clicked for product:",
                                            product.name,
                                            "Status:",
                                            tx.status,
                                            "Has rating:",
                                            product.has_rating
                                          );
                                          openRatingModal(
                                            product,
                                            item.shopName
                                          );
                                        }}
                                        className="bg-olive-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-olive-900 transition-colors duration-200 font-medium shadow-sm border-0"
                                        style={{
                                          display: "block",
                                          minWidth: "100px",
                                        }}
                                      >
                                        Beri Nilai
                                      </button>
                                    )}

                                    {!shouldShowRatingButton(
                                      tx.status,
                                      product.has_rating
                                    ) && (
                                      <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                        {product.has_rating
                                          ? "Sudah dirating"
                                          : ![
                                              "Sudah Diambil",
                                              "Sudah Diterima",
                                            ].includes(tx.status)
                                          ? `Status: ${tx.status}`
                                          : "Unknown reason"}
                                      </div>
                                    )}

                                    {product.has_rating && (
                                      <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                        ✓ Sudah diberi rating
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end items-center p-4 border-t border-gray-200 bg-gray-50">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Total Pesanan:{" "}
                            <span className="font-semibold text-gray-800">
                              {tx.totalAmount}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Tanggal Transaksi: {tx.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {isRatingModalOpen && selectedProduct && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsRatingModalOpen(false)}
              ></div>
              <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 mx-4">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Beri Nilai Produk
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => handleImageError(e, selectedProduct.name)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {selectedProduct.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Penjual: {selectedProduct.shopName}
                      </p>
                      <div className="flex space-x-1 mt-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRatingChange(star)}
                            className={`text-3xl transition-colors duration-200 ${
                              rating >= star
                                ? "text-yellow-400 hover:text-yellow-500"
                                : "text-gray-300 hover:text-yellow-300"
                            }`}
                            title={`${star} bintang`}
                            disabled={isRatingLoading}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          Rating yang dipilih: {rating} bintang
                        </p>
                      )}
                    </div>
                  </div>
                  {ratingError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{ratingError}</p>
                    </div>
                  )}
                  {ratingSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-600">{ratingSuccess}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    onClick={() => setIsRatingModalOpen(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                    disabled={isRatingLoading}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleRatingSubmit}
                    disabled={rating === 0 || ratingSuccess || isRatingLoading}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                      rating === 0 || ratingSuccess || isRatingLoading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-olive-500 text-white hover:bg-olive-900"
                    }`}
                  >
                    {isRatingLoading ? "Mengirim..." : "Kirim Rating"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPembelian;
