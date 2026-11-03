import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../../services/authService";
import Swal from "sweetalert2"; //
import axiosInstance from "../../../utils/axiosInstance"; //

const API_URL = "http://localhost:8000/api";

export default function RecommendedProducts() {
  const sliderRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState({}); //
  const navigate = useNavigate();

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Menggunakan axiosInstance untuk konsistensi, meskipun fetch juga bisa
        const response = await axiosInstance.get(`/products`); // Menggunakan axiosInstance

        setProducts(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(
          "Failed to load recommended products. Please try again later."
        );
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const scrollLeft = () => {
    sliderRef.current.scrollBy({ left: -500, behavior: "smooth" });
  };

  const scrollRight = () => {
    sliderRef.current.scrollBy({ left: 500, behavior: "smooth" });
  };

  const handleProductClick = (productId) => {
    navigate(`/detail-product/${productId}`);
  };

  // Handle Add to Cart click - Diadaptasi dari Catalogue.jsx
  const handleAddToCart = async (productId, productName, e) => {
    e.stopPropagation(); // Mencegah navigasi ke halaman detail

    const isAuthenticated = AuthService.isAuthenticated(); //
    const userType = AuthService.getUserType(); //

    if (!isAuthenticated) {
      await Swal.fire({
        icon: "warning",
        title: "Belum Login",
        text: "Silakan login sebagai pembeli untuk menambahkan ke keranjang.",
        confirmButtonColor: "#3085d6",
      });
      navigate("/login", {
        state: { message: "Login terlebih dahulu sebagai pembeli" }, //
      });
      return;
    }

    if (userType !== "pembeli") {
      //
      await Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Hanya pembeli yang bisa menambahkan ke keranjang.", //
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (isAddingToCart[productId]) {
      //
      console.log(
        "Add to cart blocked: already in progress for product",
        productId
      );
      return;
    }

    const result = await Swal.fire({
      title: "Tambah ke Keranjang?", //
      text: `Apakah Anda yakin ingin menambahkan ${productName} ke keranjang?`, //
      icon: "question", //
      showCancelButton: true, //
      confirmButtonColor: "#3085d6", //
      cancelButtonText: "Batal", //
      confirmButtonText: "Ya", //
    });

    if (!result.isConfirmed) return; //

    setIsAddingToCart((prev) => ({ ...prev, [productId]: true })); //
    try {
      const user = AuthService.getCurrentUser(); //
      const payload = {
        id_pembeli: user?.id, //
        KODE_PRODUK: productId, //
      };
      // Pastikan endpoint dan payload sesuai dengan yang ada di Catalogue.jsx
      const response = await axiosInstance.post(
        `/pembeli/cart/add/${productId}`,
        payload
      ); //

      await Swal.fire({
        icon: "success", //
        title: "Berhasil", //
        text:
          response.data.message ||
          `Berhasil menambahkan ${productName} ke keranjang!`, //
        confirmButtonColor: "#3085d6", //
      });
      navigate("/cart"); //
    } catch (error) {
      console.error("Add to cart error:", {
        //
        status: error.response?.status, //
        data: error.response?.data, //
        message: error.message, //
      });
      await Swal.fire({
        icon: "error", //
        title: "Gagal", //
        text:
          error.response?.data?.message ||
          `Gagal menambah ${productName} ke keranjang. Silakan coba lagi.`, //
        confirmButtonColor: "#3085d6", //
      });
    } finally {
      setIsAddingToCart((prev) => ({ ...prev, [productId]: false })); //
    }
  };

  const ProductCard = ({ product }) => {
    const userType = AuthService.getUserType() || ""; //
    const isAuthenticated = AuthService.isAuthenticated(); //
    const showAddToCartButton = userType !== "penitip"; // Tombol tidak muncul untuk penitip
    const isPembeli = userType === "pembeli"; //

    return (
      <div
        className="bg-white rounded-xl hover:shadow-xl overflow-hidden cursor-pointer transition duration-300 hover:-translate-y-1 w-96 flex flex-col"
        onClick={() => handleProductClick(product.KODE_PRODUK || product.id)} // Menggunakan KODE_PRODUK jika ada, atau id
      >
        <div className="h-68 overflow-hidden rounded-lg px-4 pt-4">
          <img
            src={product.gambar || product.image || "/api/placeholder/240/180"}
            alt={product.NAMA || product.name || "Product"}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => (e.target.src = "/api/placeholder/240/180")}
          />
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold line-clamp-1">
            {product.NAMA || product.name || "Unknown Product"} {/* */}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            {product.NAMASUB || product.subcategory || "Unknown"}{" "}
            {/* Menggunakan product.NAMASUB jika ada, atau product.subcategory */}
          </p>
          <div className="mt-auto">
            <span className="font-bold text-xl text-stone-800 block mb-2">
              Rp{" "}
              {product.HARGA
                ? product.HARGA.toLocaleString("id-ID")
                : product.price
                ? product.price.toLocaleString("id-ID")
                : "N/A"}{" "}
              {/* Menggunakan product.HARGA jika ada, atau product.price */}
            </span>
            {showAddToCartButton && ( //
              <button
                className={`w-full py-2 rounded-lg text-sm font-medium cursor-pointer ${
                  isPembeli
                    ? `bg-olive-500 text-white hover:bg-olive-600 ${
                        //
                        isAddingToCart[product.KODE_PRODUK || product.id]
                          ? "opacity-50 cursor-not-allowed"
                          : "" //
                      }`
                    : "bg-olive-500 text-white hover:bg-stone-700" //
                }`}
                onClick={(e) =>
                  handleAddToCart(
                    product.KODE_PRODUK || product.id,
                    product.NAMA || product.name,
                    e
                  )
                } //
                disabled={
                  isAddingToCart[product.KODE_PRODUK || product.id] ||
                  (!isPembeli && isAuthenticated)
                } // Tombol disable jika bukan pembeli tapi sudah login, atau sedang proses add to cart
                title={
                  !isAuthenticated
                    ? "Login untuk menambahkan ke keranjang"
                    : isPembeli
                    ? "Tambahkan ke Keranjang" //
                    : "Hanya pembeli yang bisa menambahkan ke keranjang"
                }
              >
                {isAddingToCart[product.KODE_PRODUK || product.id]
                  ? "Menambahkan..."
                  : "Tambahkan ke Keranjang"}{" "}
                {/* */}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="my-12 mx-8 md:mx-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-olive-500">
          Barang Bekas Rekomendasi Kami
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={scrollLeft}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={scrollRight}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <svg
            className="animate-spin h-8 w-8 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
      ) : (
        <div
          ref={sliderRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        >
          <div className="flex space-x-5 w-max">
            {products.slice(0, 10).map(
              (
                product // Menggunakan product.KODE_PRODUK atau product.id sebagai key
              ) => (
                <div
                  key={product.KODE_PRODUK || product.id}
                  className="flex-shrink-0"
                >
                  <ProductCard product={product} />
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
