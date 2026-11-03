import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import axiosInstance, { STORAGE_BASE_URL } from "/src/utils/axiosInstance";
import Swal from "sweetalert2";
import { useLocation } from "react-router-dom";

const DetailPembelian = ({ transactionId, onBack }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const location = useLocation();
  const timerRef = useRef(null);

  // Helper function to normalize payment proof URL
  const normalizePaymentProofUrl = (path) => {
    if (!path) return null;
    // If path already starts with http, return as is
    if (path.startsWith("http")) return path;
    // If path doesn't start with 'storage/', add it
    const normalizedPath = path.startsWith("storage/")
      ? path
      : `storage/${path}`;
    return `${STORAGE_BASE_URL}/${normalizedPath}`;
  };

  const paymentAccounts = [
    {
      bank: "BCA",
      accountNumber: "1234567890",
      accountHolder: "PT ReuseMart Indonesia",
    },
    {
      bank: "Mandiri",
      accountNumber: "0987654321",
      accountHolder: "PT ReuseMart Indonesia",
    },
    {
      bank: "BNI",
      accountNumber: "1122334455",
      accountHolder: "PT ReuseMart Indonesia",
    },
  ];

  useEffect(() => {
    console.log("Received transactionId:", transactionId);
    const fetchTransaction = async () => {
      try {
        if (!transactionId) {
          throw new Error("Invalid transaction ID");
        }

        const response = await axiosInstance.get(
          `/pembeli/transaksi/${encodeURIComponent(transactionId)}`
        );
        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to fetch transaction"
          );
        }

        const tx = response.data.data;
        if (!tx) {
          throw new Error(`Transaction not found: ${transactionId}`);
        }

        const mappedTransaction = {
          id: tx.no_nota,
          invoiceNumber: tx.no_nota,
          shopName: tx.products
            .map((p) => p.nama_penitip)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(" & "),
          date: tx.tanggal_transaksi,
          status: tx.status,
          metodePengiriman: tx.metode_pengiriman,
          delivery:
            tx.metode_pengiriman === "diambil sendiri"
              ? "- (diambil sendiri)"
              : tx.nama_kurir,
          products: tx.products.map((p) => ({
            name: p.nama_barang,
            price: parseInt(p.harga_barang.replace(/[^0-9]/g, "")),
            image: p.image || "/api/placeholder/60/60",
            penitip: p.nama_penitip,
            qcEmployee: p.nama_qc,
            productId: p.product_id,
          })),
          shippingAddress: {
            buyerName: tx.nama_pembeli,
            email: tx.email_pembeli,
            address: tx.alamat,
          },
          shippingCost: parseInt(tx.ongkir.replace(/[^0-9]/g, "")),
          pointsUsed: tx.poin_digunakan,
          pointsEarned: tx.poin_diperoleh,
          buktiPembayaran: normalizePaymentProofUrl(tx.bukti_pembayaran),
        };

        setTransaction(mappedTransaction);

        if (
          location.state?.fromCheckout &&
          !mappedTransaction.buktiPembayaran &&
          tx.tanggal_transaksi
        ) {
          const orderTime = new Date(tx.tanggal_transaksi);
          const currentTime = new Date();
          const elapsedSeconds = Math.floor((currentTime - orderTime) / 1000);
          const remaining = Math.max(60 - elapsedSeconds, 0);

          console.log(
            "Timer calculation: orderTime=",
            orderTime,
            "currentTime=",
            currentTime,
            "elapsedSeconds=",
            elapsedSeconds,
            "remaining=",
            remaining
          );

          setSecondsRemaining(remaining);
          if (remaining > 0 && mappedTransaction.status !== "Dibatalkan") {
            setIsTimerActive(true);
          } else if (
            remaining <= 0 &&
            mappedTransaction.status !== "Dibatalkan"
          ) {
            handleTimeout();
          }
        } else if (
          location.state?.fromCheckout &&
          !mappedTransaction.buktiPembayaran
        ) {
          setIsTimerActive(true);
        }
      } catch (err) {
        setError(err.message || "Gagal mengambil detail transaksi.");
        console.error("Fetch transaction error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId, location.state]);

  useEffect(() => {
    console.log(
      "Timer useEffect: isTimerActive=",
      isTimerActive,
      "secondsRemaining=",
      secondsRemaining
    );
    if (isTimerActive && secondsRemaining > 0) {
      if (!timerRef.current) {
        console.log("Starting timer");
        timerRef.current = setInterval(() => {
          setSecondsRemaining((prev) => {
            console.log("Timer tick: secondsRemaining=", prev);
            if (prev <= 1) {
              console.log("Timer expired, calling handleTimeout");
              clearInterval(timerRef.current);
              timerRef.current = null;
              handleTimeout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (timerRef.current) {
        console.log("Cleaning up timer");
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerActive, secondsRemaining]);

  const handleTimeout = async () => {
    console.log("handleTimeout called");
    if (!transaction || transaction.buktiPembayaran) {
      console.log(
        "handleTimeout blocked: transaction=",
        !!transaction,
        "buktiPembayaran=",
        !!transaction?.buktiPembayaran
      );
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/pembeli/transaksi/${transactionId}/cancel`
      );
      if (response.data.success) {
        setTransaction((prev) => ({
          ...prev,
          status: "Dibatalkan",
          buktiPembayaran: null,
        }));
        setIsTimerActive(false);
        Swal.fire({
          icon: "error",
          title: "Transaksi Dibatalkan",
          text: `Waktu untuk mengunggah bukti pembayaran telah habis. ${
            transaction.pointsUsed > 0
              ? `${transaction.pointsUsed} poin telah dikembalikan ke akun Anda.`
              : ""
          }`,
          confirmButtonColor: "#3085d6",
        });
      } else {
        throw new Error(
          response.data.message || "Gagal membatalkan transaksi."
        );
      }
    } catch (error) {
      console.error("Cancel transaction error:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text:
          error.response?.data?.message ||
          "Gagal membatalkan transaksi. Silakan coba lagi.",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPaymentProof(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Harap unggah file gambar (jpg, png, dll).",
        confirmButtonColor: "#3085d6",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Ukuran file tidak boleh melebihi 2MB.",
        confirmButtonColor: "#3085d6",
      });
      e.target.value = "";
      return;
    }

    console.log("Selected file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    setPaymentProof(file);
  };

  const handleUpload = async () => {
    if (!transaction) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Transaksi tidak ditemukan. Silakan muat ulang halaman.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (!paymentProof) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Harap pilih file bukti pembayaran terlebih dahulu.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const formData = new FormData();
    formData.append("BUKTI_PEMBAYARAN", paymentProof);
    formData.append("STATUS", "Menunggu Verifikasi");
    formData.append(
      "TANGGAL_PEMBAYARAN",
      new Date().toISOString().split("T")[0]
    );

    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      setUploading(true);
      console.log(
        "Sending POST request to:",
        `/pembeli/transaksi/${transactionId}`
      );

      const response = await axiosInstance.post(
        `/pembeli/transaksi/${transactionId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      console.log("Upload response:", response.data);

      if (response.data.success) {
        // Update transaction state with new data
        setTransaction((prev) => ({
          ...prev,
          status: response.data.data.status,
          buktiPembayaran: normalizePaymentProofUrl(
            response.data.data.bukti_pembayaran
          ),
          tanggalPembayaran: response.data.data.tanggal_pembayaran,
        }));
        setIsTimerActive(false);
        setPaymentProof(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";

        // Show success modal
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Bukti pembayaran berhasil diunggah. Menunggu verifikasi.",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        });
      } else {
        throw new Error(
          response.data.message || "Failed to upload payment proof"
        );
      }
    } catch (error) {
      console.error("Upload error full details:", error);

      let errorMessage = "Gagal mengunggah bukti pembayaran.";

      if (error.response) {
        console.log("Error response status:", error.response.status);
        console.log("Error response data:", error.response.data);

        if (error.response.status === 403) {
          errorMessage =
            error.response.data.message ||
            "Transaksi tidak dalam status Menunggu Pembayaran atau bukti sudah diunggah.";
        } else if (error.response.status === 422) {
          const validationErrors = error.response.data.errors;
          if (validationErrors?.BUKTI_PEMBAYARAN) {
            errorMessage = validationErrors.BUKTI_PEMBAYARAN[0];
          } else {
            errorMessage =
              error.response.data.message ||
              "Validasi gagal: Periksa input Anda.";
          }
        } else if (error.response.status === 404) {
          errorMessage = `Transaksi dengan nomor ${transactionId} tidak ditemukan di server atau tidak terkait dengan akun Anda.`;
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage =
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      } else {
        errorMessage = error.message || errorMessage;
      }

      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: errorMessage,
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageError = (e, productName) => {
    console.error(
      `Failed to load image for product: ${productName}, URL: ${e.target.src}`
    );
    e.target.src = "/api/placeholder/60/60";
  };

  const discount = transaction ? transaction.pointsUsed * 100 : 0;
  const subtotal = transaction
    ? transaction.products.reduce((sum, product) => sum + product.price, 0)
    : 0;
  const totalAmount = transaction
    ? subtotal + transaction.shippingCost - discount
    : 0;

  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="text-center text-red-600">
        <p className="text-lg font-medium">Error: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-600">
        <p className="text-lg font-medium">Memuat detail transaksi...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center text-gray-600">
        <p className="text-lg font-medium">Transaksi tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Kembali</span>
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            NO.NOTA {transaction.invoiceNumber}
          </span>
          <span className="text-sm font-medium text-gray-600">|</span>
          <span
            className={`text-sm font-medium ${
              transaction.status === "Sudah Diterima" ||
              transaction.status === "Sudah Diambil"
                ? "text-green-600"
                : transaction.status === "Dibatalkan"
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {transaction.status}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Alamat Pengiriman
          </h3>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-800">
              {transaction.shippingAddress.buyerName}
            </p>
            <p className="text-sm text-gray-600">
              {transaction.shippingAddress.email}
            </p>
            <p className="text-sm text-gray-600">
              {transaction.shippingAddress.address}
            </p>
            <p className="text-sm text-gray-600">
              Delivery: {transaction.delivery}
            </p>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Detail Produk
          </h3>
          {transaction.products.length === 0 ? (
            <p className="text-sm text-gray-600">Tidak ada produk ditemukan.</p>
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
                    onError={(e) => handleImageError(e, product.name)}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {product.name}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Nama Penitip:</p>
                        <p className="text-gray-800">{product.penitip}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pegawai QC:</p>
                        <p className="text-gray-800">{product.qcEmployee}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Harga Produk:</p>
                  <span className="text-sm font-semibold text-gray-800">
                    Rp{product.price.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {transaction.status === "Menunggu Pembayaran" &&
          !transaction.buktiPembayaran && (
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Unggah Bukti Pembayaran
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Informasi Pembayaran
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Silakan transfer ke salah satu rekening berikut:
                  </p>
                  {paymentAccounts.map((account, index) => (
                    <div key={index} className="text-sm text-gray-600 mb-2">
                      <p>
                        <strong>{account.bank}</strong>
                      </p>
                      <p>No. Rekening: {account.accountNumber}</p>
                      <p>Atas Nama: {account.accountHolder}</p>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">
                    Pastikan Anda mentransfer sesuai dengan total akhir: Rp
                    {totalAmount.toLocaleString("id-ID")}
                  </p>
                  {isTimerActive && (
                    <p className="text-sm text-red-600 font-semibold mt-2">
                      Sisa waktu: {formatTimer(secondsRemaining)}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full p-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format yang didukung: JPG, PNG, GIF. Maksimal 2MB.
                  </p>
                </div>
                {paymentProof && (
                  <div className="text-sm text-gray-600">
                    File dipilih: {paymentProof.name} (
                    {(paymentProof.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                <div className="flex space-x-4">
                  <button
                    onClick={handleUpload}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={uploading || !paymentProof}
                  >
                    {uploading ? "Mengunggah..." : "Unggah Bukti"}
                  </button>
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cara Pembayaran
                  </button>
                </div>
              </div>
            </div>
          )}

        {transaction.status === "Dibatalkan" && (
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Status Transaksi
            </h3>
            <p className="text-sm text-red-600">
              Transaksi ini telah dibatalkan karena bukti pembayaran tidak
              diunggah dalam waktu 1 menit.
            </p>
          </div>
        )}

        {transaction.buktiPembayaran && (
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Bukti Pembayaran
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Bukti pembayaran telah diunggah dan sedang menunggu verifikasi.
            </p>
            <img
              src={transaction.buktiPembayaran}
              alt="Bukti Pembayaran"
              className="w-48 h-48 object-cover rounded"
              onError={(e) => {
                console.error(`Failed to load payment proof: ${e.target.src}`);
                e.target.style.display = "none";
                const parent = e.target.parentElement;
                if (parent && !parent.querySelector(".error-message")) {
                  const errorDiv = document.createElement("div");
                  errorDiv.className = "error-message text-red-500 text-sm";
                  errorDiv.textContent = "Gagal memuat gambar bukti pembayaran";
                  parent.appendChild(errorDiv);
                }
              }}
            />
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Rincian Pembayaran
          </h3>
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Harga Barang</span>
              <span className="text-gray-800">
                Rp{subtotal.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ongkos Kirim</span>
              <span className="text-gray-800">
                Rp{transaction.shippingCost.toLocaleString("id-ID")}
              </span>
            </div>
            {transaction.pointsUsed > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Poin Digunakan</span>
                  <span className="text-gray-800">
                    {transaction.pointsUsed} poin
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Potongan Harga</span>
                  <span className="text-green-600">
                    -Rp{discount.toLocaleString("id-ID")}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Poin Diperoleh</span>
              <span className="text-gray-800">
                {transaction.pointsEarned} poin
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-800">Total Akhir</span>
              <span className="text-gray-800">
                Rp{totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsPaymentModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Cara Pembayaran
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Silakan pilih metode pembayaran yang sesuai dan ikuti
                langkah-langkah berikut. Pastikan Anda mentransfer ke rekening
                yang tertera di informasi pembayaran.
              </p>

              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="text-sm font-semibold text-gray-800 cursor-pointer">
                  Transfer Bank via ATM
                </summary>
                <div className="text-sm text-gray-600 mt-2">
                  <p>
                    Untuk pembayaran melalui ATM (BCA, Mandiri, BNI, BRI, CIMB
                    Niaga, dll.):
                  </p>
                  <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li>Masukkan kartu ATM dan PIN Anda.</li>
                    <li>Pilih menu "Transaksi Lain" atau "Transfer".</li>
                    <li>
                      Pilih "Transfer ke Rekening Bank Lain" jika bank tujuan
                      berbeda.
                    </li>
                    <li>
                      Masukkan kode bank tujuan (misal: BCA - 014, Mandiri -
                      008, BNI - 009, BRI - 002).
                    </li>
                    <li>
                      Masukkan nomor rekening tujuan (lihat informasi
                      pembayaran).
                    </li>
                    <li>
                      Masukkan jumlah transfer sesuai total akhir: Rp
                      {totalAmount.toLocaleString("id-ID")}.
                    </li>
                    <li>
                      Konfirmasi transaksi dan simpan struk sebagai bukti.
                    </li>
                    <li>Foto struk dan unggah sebagai bukti pembayaran.</li>
                  </ol>
                </div>
              </details>

              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="text-sm font-semibold text-gray-800 cursor-pointer">
                  Mobile Banking
                </summary>
                <div className="text-sm text-gray-600 mt-2">
                  <p>
                    Untuk pembayaran melalui aplikasi mobile banking (BCA
                    Mobile, Livin' by Mandiri, BNI Mobile, BRImo, OCTO Mobile,
                    dll.):
                  </p>
                  <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li>Buka aplikasi mobile banking Anda dan login.</li>
                    <li>Pilih menu "Transfer" atau "Pembayaran".</li>
                    <li>
                      Pilih "Transfer Antar Bank" jika bank tujuan berbeda.
                    </li>
                    <li>
                      Masukkan kode bank dan nomor rekening tujuan (lihat
                      informasi pembayaran).
                    </li>
                    <li>
                      Masukkan jumlah transfer: Rp
                      {totalAmount.toLocaleString("id-ID")}.
                    </li>
                    <li>
                      Tambahkan catatan (opsional, misal: "Pembayaran Nota{" "}
                      {transaction.invoiceNumber}").
                    </li>
                    <li>Konfirmasi dengan PIN atau biometrik.</li>
                    <li>
                      Simpan bukti transaksi (screenshot) dan unggah sebagai
                      bukti pembayaran.
                    </li>
                  </ol>
                </div>
              </details>

              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="text-sm font-semibold text-gray-800 cursor-pointer">
                  Internet Banking
                </summary>
                <div className="text-sm text-gray-600 mt-2">
                  <p>
                    Untuk pembayaran melalui internet banking (KlikBCA, Mandiri
                    Online, BNI Internet Banking, dll.):
                  </p>
                  <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li>Login ke situs internet banking bank Anda.</li>
                    <li>Pilih menu "Transfer Dana" atau "Pembayaran".</li>
                    <li>Pilih "Transfer ke Bank Lain" jika diperlukan.</li>
                    <li>Masukkan kode bank dan nomor rekening tujuan.</li>
                    <li>
                      Masukkan jumlah transfer: Rp
                      {totalAmount.toLocaleString("id-ID")}.
                    </li>
                    <li>Konfirmasi transaksi sesuai prosedur bank Anda.</li>
                    <li>
                      Simpan bukti transaksi (PDF atau screenshot) dan unggah.
                    </li>
                  </ol>
                </div>
              </details>

              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="text-sm font-semibold text-gray-800 cursor-pointer">
                  Dompet Digital
                </summary>
                <div className="text-sm text-gray-600 mt-2">
                  <p>
                    Untuk pembayaran melalui dompet digital (GoPay, OVO, DANA,
                    ShopeePay, LinkAja):
                  </p>
                  <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li>Buka aplikasi dompet digital Anda.</li>
                    <li>Pastikan saldo cukup atau top-up terlebih dahulu.</li>
                    <li>Pilih menu "Transfer" atau "Kirim Uang".</li>
                    <li>Pilih "Ke Rekening Bank".</li>
                    <li>
                      Masukkan nama bank, nomor rekening, dan jumlah transfer
                      (lihat informasi pembayaran).
                    </li>
                    <li>Konfirmasi transaksi dengan PIN atau biometrik.</li>
                    <li>
                      Simpan bukti transaksi dan unggah sebagai bukti
                      pembayaran.
                    </li>
                  </ol>
                  <p className="mt-2">
                    <strong>Catatan:</strong> Beberapa dompet digital mungkin
                    mengenakan biaya transfer antar bank.
                  </p>
                </div>
              </details>

              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="text-sm font-semibold text-gray-800 cursor-pointer">
                  Virtual Account
                </summary>
                <div className="text-sm text-gray-600 mt-2">
                  <p>
                    Untuk pembayaran melalui Virtual Account (tersedia untuk
                    BCA, Mandiri, BNI, BRI, dll.):
                  </p>
                  <ol className="list-decimal ml-5 mt-2 space-y-1">
                    <li>
                      Kontak layanan pelanggan untuk mendapatkan nomor Virtual
                      Account.
                    </li>
                    <li>
                      Buka aplikasi mobile banking, ATM, atau internet banking
                      Anda.
                    </li>
                    <li>Pilih menu "Pembayaran" atau "Transfer".</li>
                    <li>Pilih "Virtual Account" sebagai metode pembayaran.</li>
                    <li>Masukkan nomor Virtual Account yang diberikan.</li>
                    <li>
                      Konfirmasi jumlah pembayaran: Rp
                      {totalAmount.toLocaleString("id-ID")}.
                    </li>
                    <li>Simpan bukti transaksi dan unggah.</li>
                  </ol>
                </div>
              </details>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
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

export default DetailPembelian;
