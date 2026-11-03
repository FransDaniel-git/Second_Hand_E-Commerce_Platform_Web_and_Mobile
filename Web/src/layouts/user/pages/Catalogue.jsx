import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Smartphone,
  ShoppingBag,
  Home,
  BookOpen,
  Gamepad2,
  Baby,
  Car,
  Tent,
  Briefcase,
  Scissors,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../../services/authService";
import Footer from "../components/Footer";
import RecommendedProducts from "../components/RecommendedProduct";
import Swal from "sweetalert2";
import axiosInstance from "../../../utils/axiosInstance";

// Map category IDs to icons
const categoryIcons = {
  1: <Smartphone size={20} />,
  2: <ShoppingBag size={20} />,
  3: <Home size={20} />,
  4: <BookOpen size={20} />,
  5: <Gamepad2 size={20} />,
  6: <Baby size={20} />,
  7: <Car size={20} />,
  8: <Tent size={20} />,
  9: <Briefcase size={20} />,
  10: <Scissors size={20} />,
};

const API_URL = "http://localhost:8000/api";

export default function Catalogue() {
  const [activePage, setActivePage] = useState(1);
  const [openCategoryId, setOpenCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productsError, setProductsError] = useState(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState({});
  const [cartProductIds, setCartProductIds] = useState([]);
  const productsPerPage = 15;
  const navigate = useNavigate();

  // Fetch categories, subcategories, products, and cart
  useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      try {
        const [categoriesResponse, subcategoriesResponse] = await Promise.all([
          axios.get(`${API_URL}/categories`),
          axios.get(`${API_URL}/subcategories`),
        ]);

        const categoriesData = categoriesResponse.data.data.map((category) => ({
          id: category.ID_KATEGORI,
          name: category.NAMA,
          icon: categoryIcons[category.ID_KATEGORI] || (
            <ShoppingBag size={20} />
          ),
          subcategories: subcategoriesResponse.data.data
            .filter((sub) => sub.ID_KATEGORI === category.ID_KATEGORI)
            .map((sub) => sub.NAMASUB),
        }));

        setCategories(categoriesData);
      } catch (err) {
        console.error("Error fetching categories/subcategories:", err);
        setError("Failed to load categories. Please try again later.");
      }
    };

    const fetchProducts = async () => {
      try {
        const productsResponse = await axios.get(`${API_URL}/products`);
        setProducts(productsResponse.data.data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProductsError("Failed to load products. Please try again later.");
      }
    };

    const fetchCart = async () => {
      const isAuthenticated = AuthService.isAuthenticated();
      const userType = AuthService.getUserType();
      if (isAuthenticated && userType === "pembeli") {
        try {
          const response = await axiosInstance.get(`${API_URL}/pembeli/cart`);
          const cartItems = response.data.data.items || [];
          const productIds = cartItems.map((item) => item.kode_produk);
          setCartProductIds(productIds);
        } catch (err) {
          console.error("Error fetching cart:", err);
        }
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategoriesAndSubcategories(),
        fetchProducts(),
        fetchCart(),
      ]);
      setLoading(false);
    };

    fetchData();

    const handleCartChange = () => {
      fetchCart();
    };
    window.addEventListener("cartChange", handleCartChange);
    return () => window.removeEventListener("cartChange", handleCartChange);
  }, []);

  const toggleCategory = (categoryId) => {
    setOpenCategoryId(openCategoryId === categoryId ? null : categoryId);
  };

  const toggleSubcategorySelection = (subcategory) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcategory)
        ? prev.filter((sub) => sub !== subcategory)
        : [...prev, subcategory]
    );
  };

  const clearAllFilters = () => {
    setSelectedSubcategories([]);
  };

  const handleAddToCart = async (productId, productName, e) => {
    e.stopPropagation();

    const isAuthenticated = AuthService.isAuthenticated();
    const userType = AuthService.getUserType();

    if (!isAuthenticated || userType !== "pembeli") {
      await Swal.fire({
        icon: !isAuthenticated ? "warning" : "error",
        title: !isAuthenticated ? "Belum Login" : "Akses Ditolak",
        text: !isAuthenticated
          ? "Silakan login sebagai pembeli untuk menambahkan ke keranjang."
          : "Hanya pembeli yang bisa menambahkan ke keranjang.",
        confirmButtonColor: "#3085d6",
      });
      navigate("/login");
      return;
    }

    // Refresh data pengguna sebelum add to cart
    try {
      const profileResponse = await axiosInstance.get("/auth/profile");
      const user = profileResponse.data.user;
      localStorage.setItem("user", JSON.stringify(user)); // Perbarui localStorage
      const idPembeli = parseInt(user.id, 10);

      if (!idPembeli) {
        throw new Error("ID_PEMBELI tidak valid.");
      }

      const result = await Swal.fire({
        title: "Tambah ke Keranjang?",
        text: `Apakah Anda yakin ingin menambahkan ${productName} ke keranjang?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonText: "Batal",
        confirmButtonText: "Ya",
      });

      if (!result.isConfirmed) return;

      setIsAddingToCart((prev) => ({ ...prev, [productId]: true }));

      const payload = {
        ID_PEMBELI: idPembeli,
        KODE_PRODUK: productId,
      };
      const response = await axiosInstance.post(
        `/pembeli/cart/add/${productId}`,
        payload
      );

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text:
          response.data.message ||
          `Berhasil menambahkan ${productName} ke keranjang!`,
        confirmButtonColor: "#3085d6",
      });
      window.dispatchEvent(new Event("cartChange"));
    } catch (error) {
      console.error(
        "Add to cart error:",
        error.response?.data || error.message
      );
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text:
          error.response?.data?.message ||
          `Gagal menambah ${productName} ke keranjang.`,
        confirmButtonColor: "#3085d6",
      });
      if (error.response?.status === 401) {
        AuthService.logout();
        navigate("/login", {
          state: { message: "Sesi Anda telah kedaluwarsa." },
        });
      }
    } finally {
      setIsAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/detail-product/${productId}`);
  };

  const filteredProducts = selectedSubcategories.length
    ? products.filter((product) =>
        selectedSubcategories.includes(product.subcategory)
      )
    : products;

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (activePage - 1) * productsPerPage,
    activePage * productsPerPage
  );

  const ProductCard = ({ product }) => {
    const userType = AuthService.getUserType() || "";
    const isAuthenticated = AuthService.isAuthenticated();
    const isPembeli = userType === "pembeli";
    const isInCart = cartProductIds.includes(product.id);

    return (
      <div
        className="bg-white rounded-xl hover:shadow-xl overflow-hidden cursor-pointer hover:-translate-y-1 p-4 transition duration-300"
        onClick={() => handleProductClick(product.id)}
      >
        <div className="flex justify-center">
          <img
            src={product.image || "/api/placeholder/60/60"}
            alt={product.name || "Product"}
            className="h-64 w-full object-cover rounded-lg"
            onError={(e) => (e.target.src = "/api/placeholder/60/60")}
          />
        </div>
        <div className="pt-2">
          <h3 className="text-lg font-semibold">
            {product.name || "Unknown Product"}
          </h3>
          <p className="text-xs text-gray-400">
            {product.subcategory || "Unknown"}
          </p>
          <div className="flex justify-between items-center mt-2">
            <span className="font-bold text-xl text-stone-800">
              Rp {product.price ? product.price.toLocaleString("id-ID") : "N/A"}
            </span>
            {userType !== "penitip" && (
              <div className="relative flex space-x-2">
                <button
                  className={`px-2 py-1 rounded text-sm cursor-pointer w-full font-medium ${
                    isPembeli
                      ? `bg-olive-500 text-white hover:bg-olive-600 ${
                          isAddingToCart[product.id] || isInCart
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`
                      : "bg-olive-500 text-white hover:bg-stone-700"
                  }`}
                  onClick={(e) => handleAddToCart(product.id, product.name, e)}
                  disabled={
                    isAddingToCart[product.id] ||
                    isInCart ||
                    (!isPembeli && isAuthenticated)
                  }
                  title={
                    !isAuthenticated
                      ? "Login untuk menambahkan ke keranjang"
                      : isInCart
                      ? "Produk sudah di keranjang"
                      : isPembeli
                      ? "Tambahkan ke Keranjang"
                      : "Hanya pembeli yang bisa menambahkan ke keranjang"
                  }
                >
                  {isAddingToCart[product.id]
                    ? "Menambahkan..."
                    : isInCart
                    ? "Sudah di Keranjang"
                    : "+ Keranjang"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AppliedFilters = ({ selectedSubcategories, clearAllFilters }) => {
    if (selectedSubcategories.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-3xl font-medium text-olive-500 mb-4">
            Applied Filters
          </h3>
          <button
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={clearAllFilters}
          >
            Clear All
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedSubcategories.map((subcategory, index) => (
            <div
              key={index}
              className="bg-gray-100 text-sm px-2 py-1 rounded flex items-center"
            >
              {subcategory}
              <button
                className="ml-2 text-gray-500 hover:text-gray-700"
                onClick={() => toggleSubcategorySelection(subcategory)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="">
      <div className="relative h-96 w-full bg-[url('/src/assets/hero-bg.png')] bg-cover bg-no-repeat bg-center overflow-hidden">
        <div className="absolute inset-0 flex-row items-center bg-gradient-to-t from-olive-900/90 to-olive-500/40">
          <div>
            <h1 className="mt-60 text-9xl justify-center text-center font-bold text-white">
              Katalog Produk
            </h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col mx-16 -mt-12 z-10 relative bg-white rounded-2xl p-5">
        <div className="flex gap-9">
          <div className="w-64 flex-shrink-0">
            <AppliedFilters
              selectedSubcategories={selectedSubcategories}
              clearAllFilters={clearAllFilters}
            />
            <h2 className="font-medium mb-4 text-3xl text-olive-500">
              Category
            </h2>
            {loading ? (
              <div className="flex justify-center py-4">
                <svg
                  className="animate-spin h-5 w-5 text-gray-600"
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
              <ul className="space-y-5">
                {categories.map((category) => (
                  <li key={category.id} className="text-sm">
                    <div
                      className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-gray-600">
                          {category.icon}
                        </span>
                        <span className="font-medium mr-2">
                          {category.name}
                        </span>
                      </div>
                      {openCategoryId === category.id ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </div>

                    {openCategoryId === category.id && (
                      <ul className="pl-4 mt-1 mb-2 space-y-1">
                        {category.subcategories.map((subcat, idx) => (
                          <li key={idx} className="flex items-center py-1">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={selectedSubcategories.includes(subcat)}
                              onChange={() =>
                                toggleSubcategorySelection(subcat)
                              }
                            />
                            <span className="text-gray-700">{subcat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex-1">
            {productsError && (
              <div className="text-red-500 py-4">{productsError}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 mb-8">
              {paginatedProducts.length ? (
                paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-5 text-center py-4">
                  No products found for selected filters.
                </div>
              )}
            </div>

            <div className="flex justify-between items-center space-x-2 mt-14">
              <button
                className="flex flex-row ml-2 disabled:opacity-50"
                onClick={() => setActivePage(activePage - 1)}
                disabled={activePage === 1}
              >
                <ChevronLeft size={24} />
                <p>Previous</p>
              </button>
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`w-8 h-8 flex items-center justify-center rounded ${
                        activePage === page
                          ? "bg-olive-900 text-white"
                          : "text-olive-500 hover:bg-olive-900 hover:text-white"
                      }`}
                      onClick={() => setActivePage(page)}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
              <button
                className="flex flex-row mr-4 disabled:opacity-50"
                onClick={() => setActivePage(activePage + 1)}
                disabled={activePage === totalPages}
              >
                <p>Next</p>
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <RecommendedProducts />

      <header className="relative h-80 bg-[url('/src/assets/kami.png')] bg-cover bg-no-repeat bg-center overflow-hidden pb-5 p-8 mx-16 rounded-2xl">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-olive-900 via-olive-500/80 to-olive-500/20 z-10" />

        {/* Content */}
        <div className="relative z-20 h-full flex items-center justify-between px-8">
          {/* Left side: CTA */}
          <div className="w-full flex flex-col justify-start">
            <div className=" text-start lg:flex-auto lg:py-20">
              <h2 className="text-3xl text-white sm:text-4xl">
                Ingin menjual barang seperti penitip lainnya?
              </h2>

              <p className="mt-5 text-lg md:text-xl text-pretty text-gray-100">
                Yuk Daftar sebagai Penitip, dan jual barang seperti penitip
                lain!
              </p>
              <div className="mt-5 flex items-center justify-start gap-x-6">
                <a
                  href="/about"
                  className="rounded-md bg-olive-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Daftar sebagai Penitip
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>
      <Footer />
    </div>
  );
}
