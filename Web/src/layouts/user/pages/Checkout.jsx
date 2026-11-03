import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import Swal from "sweetalert2";
import AuthService from "../../../services/authService";
import { AlertCircle, X } from "lucide-react";
import Footer from "../components/Footer";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [shippingMethod, setShippingMethod] = useState("dikirim");
  const [usePoints, setUsePoints] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(100);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [pointsError, setPointsError] = useState("");

  const searchParams = new URLSearchParams(location.search);
  const kodeProduk = searchParams.get("kode_produk");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (
          !AuthService.isAuthenticated() ||
          AuthService.getUserType() !== "pembeli"
        ) {
          setError("Silakan login sebagai pembeli untuk melanjutkan checkout.");
          navigate("/pembeli/login", {
            state: { message: "Silakan login sebagai pembeli" },
          });
          return;
        }

        if (kodeProduk) {
          sessionStorage.removeItem("selectedCartItems");
          try {
            const productResponse = await axiosInstance.get(
              `/products/${kodeProduk}`
            );
            console.log("Product Response:", productResponse.data);
            const product = productResponse.data.data;
            if (!product) {
              setError("Produk tidak ditemukan.");
              return;
            }
            const imageUrl =
              product.photos?.find((photo) => photo.is_utama)?.url ||
              product.photos?.[0]?.url ||
              "/api/placeholder/60/80";
            const item = {
              id: product.id || kodeProduk,
              quantity: 1,
              image: imageUrl,
              name: product.name || "Unknown Product",
              price: product.price || 0,
            };
            console.log("Setting selected item:", item);
            setSelectedItems([item]);
          } catch (err) {
            console.error("Error fetching product:", err.response?.data || err);
            setError("Gagal memuat produk. Silakan coba lagi.");
            return;
          }
        } else {
          const selectedCartItems = JSON.parse(
            sessionStorage.getItem("selectedCartItems")
          );
          if (selectedCartItems && selectedCartItems.length > 0) {
            setSelectedItems(selectedCartItems);
          } else {
            setError("Tidak ada produk yang dipilih untuk checkout.");
            return;
          }
        }

        const [addressesResponse, userDataResponse] = await Promise.all([
          axiosInstance.get("/pembeli/alamat").catch((err) => ({ data: [] })),
          axiosInstance
            .get("/auth/profile")
            .catch((err) => ({ data: { user: { poin: 0 } } })),
        ]);

        setAddresses(addressesResponse.data);
        const primaryAddress = addressesResponse.data.find(
          (addr) => addr?.ALAMAT_UTAMA === 1
        );
        // Set primary address for both shipping methods
        setSelectedAddress(primaryAddress || null);
        const points = userDataResponse.data.user?.poin || 0;
        setUserPoints(points);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Gagal memuat data. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [kodeProduk, navigate]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    closeModal();
  };

  const handlePointsChange = (e) => {
    if (!usePoints) return;
    const value = parseInt(e.target.value) || 0;

    const totalWithShipping = itemTotal + shippingCost;
    const maxPoints = Math.min(
      userPoints,
      Math.floor(totalWithShipping / 100) * 100
    );

    let calculatedDiscount = (value / 100) * 10000;

    if (value < 100) {
      setPointsError("Poin minimal adalah 100.");
      setPointsToUse(100);
      setPointsDiscount(10000);
    } else if (value % 100 !== 0) {
      const roundedValue = Math.floor(value / 100) * 100;
      calculatedDiscount = (roundedValue / 100) * 10000;
      if (calculatedDiscount > totalWithShipping) {
        const maxAllowedPoints = Math.floor(totalWithShipping / 100) * 100;
        setPointsError(
          `Poin maksimum adalah ${maxAllowedPoints} agar potongan tidak melebihi total harga.`
        );
        setPointsToUse(maxAllowedPoints);
        setPointsDiscount((maxAllowedPoints / 100) * 10000);
      } else {
        setPointsError(
          `Poin harus dalam kelipatan 100. Dibulatkan ke ${roundedValue}.`
        );
        setPointsToUse(roundedValue);
        setPointsDiscount(calculatedDiscount);
      }
    } else if (calculatedDiscount > totalWithShipping) {
      const maxAllowedPoints = Math.floor(totalWithShipping / 100);
      setPointsError(
        `Poin maksimum adalah ${maxAllowedPoints} agar potongan tidak melebihi total harga.`
      );
      setPointsToUse(maxAllowedPoints);
      setPointsDiscount((maxAllowedPoints / 100) * 10000);
    } else if (value > maxPoints) {
      setPointsError(`Poin maksimum adalah ${maxPoints}.`);
      setPointsToUse(maxPoints);
      setPointsDiscount((maxPoints / 100) * 10000);
    } else {
      setPointsError("");
      setPointsToUse(value);
      setPointsDiscount(calculatedDiscount);
    }
  };

  const handleCheckout = async () => {
    setIsConfirmModalOpen(true);
  };

  const confirmCheckout = async () => {
    setIsConfirmModalOpen(false);
    if (shippingMethod === "dikirim" && !selectedAddress?.ID_ALAMAT) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Pilih alamat untuk pengiriman.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    if (selectedItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Tidak ada produk untuk checkout.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    if (usePoints && pointsError) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: pointsError,
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        alamat_id: selectedAddress?.ID_ALAMAT || null, // Allow null for "diambil sendiri"
        products: selectedItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity || 1,
        })),
        shipping_method:
          shippingMethod === "diambil sendiri" ? "diambil sendiri" : "dikirim",
        use_points: usePoints,
        points_to_use: usePoints ? pointsToUse : null,
      };

      const response = await axiosInstance.post("/pembeli/transaksi", payload);

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text:
          response.data.message || "Transaksi berhasil! Menunggu Pembayaran.",
        confirmButtonColor: "#3085d6",
      });

      console.log(
        "Navigating to:",
        `/transaksi/${response.data.data.NO_NOTA_PENJUALAN}`
      );
      navigate(`/transaksi/${response.data.data.NO_NOTA_PENJUALAN}`, {
        state: { fromCheckout: true },
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: error.response?.data?.message || "Gagal menyelesaikan transaksi.",
        confirmButtonColor: "#3085d6",
      });
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const itemTotal = selectedItems.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );
  const shippingCost =
    shippingMethod === "dikirim" && itemTotal < 1500000 ? 100000 : 0;
  const totalAmount =
    itemTotal + shippingCost - (usePoints ? pointsDiscount : 0);
  const basePoints = Math.floor(itemTotal / 10000);
  const pointsEarned =
    itemTotal > 500000 ? Math.ceil(basePoints * 1.2) : basePoints;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <div className="text-red-500 text-center py-4 font-medium text-xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-28 font-sans">
      <h1 className="text-7xl font-bold mb-8 mx-16 tracking-wide">CHECKOUT</h1>

      <div className="flex flex-col lg:flex-row gap-8 -mt-12 z-10 mx-16 bg-white">
        {/* Main Content */}
        <div className="flex-1 mr-5 bg-white">
          {/* Shipping Method */}
          <div className="border-t border-gray-200 py-8">
            <h2 className="text-2xl font-medium text-olive-900 uppercase mb-6">
              Metode Pengiriman
            </h2>
            <div className="flex gap-8 pl-5">
              <label className="flex items-center gap-3 text-lg">
                <input
                  type="radio"
                  name="shippingMethod"
                  value="dikirim"
                  checked={shippingMethod === "dikirim"}
                  onChange={() => setShippingMethod("dikirim")}
                  className="h-5 w-5 text-olive-500 focus:ring-olive-500"
                />
                Diantar Kurir
              </label>
              <label className="flex items-center gap-3 text-lg">
                <input
                  type="radio"
                  name="shippingMethod"
                  value="diambil sendiri"
                  checked={shippingMethod === "diambil sendiri"}
                  onChange={() => setShippingMethod("diambil sendiri")}
                  className="h-5 w-5 text-olive-500 focus:ring-olive-500"
                />
                Ambil Sendiri
              </label>
            </div>
          </div>

          {/* Shipping Address - Only for "dikirim" */}
          {shippingMethod === "dikirim" && (
            <div className="border-t border-gray-200 py-5">
              <h2 className="text-2xl font-medium text-olive-900 uppercase">
                Alamat Pengiriman
              </h2>
              {selectedAddress ? (
                <div className="bg-olive-50 p-5 rounded-lg">
                  <p className="text-olive-500 text-lg leading-relaxed">
                    {selectedAddress.JALAN}, {selectedAddress.KECAMATAN},{" "}
                    {selectedAddress.KELURAHAN}, {selectedAddress.KOTA},{" "}
                    {selectedAddress.KODE_POS}
                  </p>
                  <button
                    onClick={openModal}
                    className="text-olive-600 hover:text-olive-800 font-medium mt-4 underline"
                  >
                    Ganti Alamat
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-500 text-lg">
                    Tidak ada alamat yang dipilih.
                  </p>
                  <button
                    onClick={openModal}
                    className="text-olive-600 hover:text-olive-800 font-medium mt-4 underline"
                  >
                    Pilih Alamat
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Product Details */}
          <div className="border-t border-gray-200 py-5">
            <h2 className="text-2xl font-medium text-olive-900 uppercase mb-5">
              Detail Produk
            </h2>
            {selectedItems.length > 0 ? (
              <div className="space-y-6">
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-6">
                    <img
                      src={item.image || "/api/placeholder/60/80"}
                      alt={item.name || "Produk"}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => (e.target.src = "/api/placeholder/60/80")}
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-medium text-olive-900 uppercase">
                        {item.name || "N/A"}
                      </h4>
                      <p className="text-olive-500 text-lg font-medium mt-2">
                        Rp {(item.price || 0).toLocaleString("id-ID")}
                      </p>
                      {item.quantity && (
                        <p className="text-gray-500 mt-1">
                          Jumlah: {item.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-lg">
                Tidak ada produk yang dipilih.
              </p>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="w-full lg:w-96 sticky top-20 h-fit">
          <div className="bg-olive-100 p-6 rounded-lg">
            <h2 className="text-lg font-bold mb-4">RINGKASAN PEMBAYARAN</h2>

            {/* Points Section */}
            {userPoints >= 100 ? (
              <div className="bg-olive-50 rounded-lg mb-4">
                <label className="flex items-center gap-3 text-lg">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={() => {
                      setUsePoints(!usePoints);
                      if (!usePoints) {
                        setPointsToUse(100);
                        setPointsDiscount(10000);
                        setPointsError("");
                      } else {
                        setPointsToUse(0);
                        setPointsDiscount(0);
                        setPointsError("");
                      }
                    }}
                    className="h-5 w-5 text-olive-500 focus:ring-olive-500"
                  />
                  Gunakan Poin (Anda memiliki {userPoints} poin)
                </label>
                {usePoints && (
                  <div className="mt-4">
                    <input
                      type="number"
                      value={pointsToUse}
                      onChange={handlePointsChange}
                      min="100"
                      step="100"
                      max={Math.min(
                        userPoints,
                        Math.floor((itemTotal + shippingCost) / 100) * 100
                      )}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-olive-500 focus:border-olive-500 text-lg"
                      placeholder="Masukkan poin (kelipatan 100)"
                    />
                    {pointsError && (
                      <p className="text-red-500 text-sm mt-2">{pointsError}</p>
                    )}
                    <p className="text-olive-600 font-medium mt-2">
                      Potongan: Rp {pointsDiscount.toLocaleString("id-ID")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-500 text-lg">
                  Anda memiliki {userPoints} poin. Minimal 100 poin untuk
                  diskon.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">HARGA BARANG</span>
                <span>Rp {itemTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ONGKOS KIRIM</span>
                <span>Rp {shippingCost.toLocaleString("id-ID")}</span>
              </div>
              {usePoints && pointsDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="text-gray-600">POTONGAN POIN</span>
                  <span>- Rp {pointsDiscount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-4 mt-4">
                <span>TOTAL</span>
                <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-olive-600">
                <span className="text-olive-500 font-semibold">
                  POIN DIDAPAT
                </span>
                <span className="text-olive-500 font-semibold">
                  {pointsEarned}
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-olive-500 text-white py-3 mt-6 rounded-lg uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              disabled={loading || selectedItems.length === 0}
            >
              {loading ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      </div>

      {/* Address Modal - Only for "dikirim" */}
      {isModalOpen && shippingMethod === "dikirim" && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-olive-500">
              <h3 className="text-2xl font-semibold text-gray-700">
                Pilih Alamat Pengiriman
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {addresses.length > 0 ? (
                addresses.map((address) => (
                  <label
                    key={address?.ID_ALAMAT || Math.random()}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-olive-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={
                        selectedAddress?.ID_ALAMAT === address?.ID_ALAMAT
                      }
                      onChange={() => handleAddressSelect(address)}
                      className="mt-1 h-5 w-5 text-olive-500 focus:ring-olive-500"
                    />
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed">
                        {address?.JALAN || "N/A"}, {address?.KECAMATAN || "N/A"}
                        , {address?.KELURAHAN || "N/A"},{" "}
                        {address?.KOTA || "N/A"}, {address?.KODE_POS || "N/A"}
                      </p>
                      {address?.ALAMAT_UTAMA === 1 && (
                        <span className="inline-block bg-olive-500 text-white text-xs px-2 py-1 rounded mt-2">
                          Alamat Utama
                        </span>
                      )}
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Tidak ada alamat tersimpan.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsConfirmModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">
                Konfirmasi Pembayaran
              </h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin melanjutkan pembayaran sebesar{" "}
                <span className="font-semibold">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
                ?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmCheckout}
                  className="bg-olive-500 text-white px-6 py-2 rounded-lg hover:bg-olive-600 transition-colors"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Checkout;
