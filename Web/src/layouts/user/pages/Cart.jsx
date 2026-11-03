import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import AuthService from "../../../services/authService";
import { AlertCircle, Trash2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import Footer from "../components/Footer";

const API_URL = "http://localhost:8000/api";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      if (
        !AuthService.isAuthenticated() ||
        AuthService.getUserType() !== "pembeli"
      ) {
        setError("Anda harus login sebagai pembeli untuk mengakses keranjang.");
        navigate("/login");
        return false;
      }
      return true;
    };

    const fetchCart = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`${API_URL}/pembeli/cart`);
        setCart(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error(
          "Error fetching cart:",
          err.response?.data || err.message
        );
        if (err.response?.status === 401) {
          setError("Sesi login telah habis. Silakan login kembali.");
          navigate("/login");
        } else {
          setError(
            err.response?.data?.message ||
              "Gagal memuat keranjang. Silakan coba lagi nanti."
          );
        }
        setLoading(false);
      }
    };

    if (checkAuth()) {
      fetchCart();
    }
  }, [navigate]);

  const handleCheckboxChange = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleRemoveItem = async (itemId, itemName) => {
    const result = await Swal.fire({
      title: "Hapus dari Keranjang?",
      text: `Apakah Anda ingin menghapus produk ${itemName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonText: "Batal",
      confirmButtonText: "Ya, Hapus",
    });

    if (!result.isConfirmed) return;

    try {
      await axiosInstance.delete(`${API_URL}/pembeli/cart/remove/${itemId}`);
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
      toast.success(`Produk ${itemName} berhasil dihapus dari keranjang!`, {
        position: "top-right",
        autoClose: 3000,
      });
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      window.dispatchEvent(new Event("cartChange"));
    } catch (err) {
      toast.error(`Gagal menghapus produk ${itemName} dari keranjang.`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error("Pilih setidaknya satu item untuk melanjutkan.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    const selectedCartItems = cart.items
      .filter((item) => selectedItems.includes(item.id))
      .map((item) => ({
        id: item.kode_produk,
        name: item.name,
        price: item.price,
        condition: item.kondisi,
        garansi: item.garansi,
        image: item.image,
      }));
    sessionStorage.setItem(
      "selectedCartItems",
      JSON.stringify(selectedCartItems)
    );
    navigate("/checkout");
  };

  const calculateTotal = () => {
    return cart.items
      .filter((item) => selectedItems.includes(item.id))
      .reduce((total, item) => total + item.price, 0);
  };

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
        <Link
          to="/catalogue"
          className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
        >
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <div className=" mt-28 font-sans">
      <h1 className="text-7xl font-bold mb-8 mx-16 tracking-wide">
        WISHLIST
      </h1>

      {cart && cart.items.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-8 -mt-12 z-10 mx-16 bg-white">
          {/* Cart Items */}
          <div className="flex-1 mr-5 bg-white">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center border-t border-gray-200 py-6"
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleCheckboxChange(item.id)}
                  className="h-5 w-5 text-olive-500 focus:ring-olive-500 mr-4 "
                />
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-60 h-60 object-cover rounded-lg mr-6"
                  onError={(e) => (e.target.src = "/images/placeholder.jpg")}
                />
                <div className="flex-1 items-start">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col justify-evenly h-full gap-3">
                      <h2 className="text-3xl font-medium text-olive-900 uppercase">
                        {item.name}
                      </h2>
                      <p className="text-olive-500 text-2xl font-medium">
                        Rp. {item.price.toLocaleString("id-ID")}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Kondisi : {item.condition}  
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Berat : {item.weight} kg 
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Garansi : {item.guarantee ? item.guarantee : "Tidak ada"}  
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id, item.name)}
                      className="text-gray-500 hover:text-red-500 ml-4"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
                
              </div>
            ))}
          </div>

          {/* Summary Section */}
          <div className="w-full lg:w-96 sticky top-20 h-fit">
            <div className="bg-olive-100 p-6 rounded-lg">
              <h2 className="text-lg font-bold mb-4">SUMMARY</h2>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">BARANG TERPILIH</span>
                <span>{selectedItems.length}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">SUBTOTAL</span>
                <span>Rp.{calculateTotal().toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-4 mt-4">
                <span>TOTAL</span>
                <span>Rp.{calculateTotal().toLocaleString("id-ID")}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-olive-500 text-white py-3 mt-6 rounded-lg uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                disabled={selectedItems.length === 0}
              >
                Lanjut ke Pembayaran
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 lg:max-w-7xl mx-auto">
          <p className="text-gray-500 text-lg">
            Wishlist kamu masih kosong. Mulai berbelanja sekarang!
          </p>
          <Link
            to="/catalogue"
            className="mt-4 inline-block bg-olive-500 text-white px-6 py-2 rounded uppercase tracking-wide hover:bg-gray-800"
          >
            Telusuri Barang
          </Link>
        </div>
      )}

      <ToastContainer />
      <Footer />
    </div>

  );
};

export default Cart;