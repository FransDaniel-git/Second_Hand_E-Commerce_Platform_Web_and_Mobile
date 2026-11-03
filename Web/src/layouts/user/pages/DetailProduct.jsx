import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { Heart, Send, AlertCircle, Star } from "lucide-react";
import Swal from "sweetalert2";
import RecommendedProducts from "../components/RecommendedProduct";
import Footer from "../components/Footer";
import AuthService from "../../../services/authService";

const API_URL = "http://localhost:8000/api";

const DetailProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [comment, setComment] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [commentError, setCommentError] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [images, setImages] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const productDetailRef = useRef(null);
  const recommendedSectionRef = useRef(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = AuthService.isAuthenticated();
      const userType = AuthService.getUserType();
      console.log("Auth check:", {
        authenticated,
        userType,
        user: AuthService.getCurrentUser(),
      });
      setIsAuthenticated(authenticated);
      setUserType(userType);
    };
    checkAuth();
    window.addEventListener("authChange", checkAuth);
    return () => window.removeEventListener("authChange", checkAuth);
  }, []);

  useEffect(() => {
    const fetchProductAndDiscussions = async () => {
      try {
        setLoading(true);
        const productResponse = await axiosInstance.get(`/products/${id}`);
        const productData = productResponse.data.data;
        setProduct(productData);
        const productImages = productData.photos || [];
        setImages(productImages.map((photo) => photo.url));
        const mainImage =
          productImages.find((photo) => photo.is_utama) || productImages[0];
        setCurrentImage(mainImage ? mainImage.url : "/api/placeholder/60/60");
        const discussionsResponse = await axiosInstance.get(`/diskusi`, {
          params: { kode_produk: id },
        });
        setDiscussions(discussionsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error(
          "Error fetching data:",
          err.response?.data || err.message
        );
        setError(
          "Failed to load product or discussions. Please try again later."
        );
        setLoading(false);
      }
    };
    fetchProductAndDiscussions();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (!productDetailRef.current || !recommendedSectionRef.current) return;
      const detailRect = productDetailRef.current.getBoundingClientRect();
      const recommendedRect =
        recommendedSectionRef.current.getBoundingClientRect();
      if (detailRect.bottom >= recommendedRect.top) {
        productDetailRef.current.style.position = "absolute";
        productDetailRef.current.style.top = "auto";
        productDetailRef.current.style.bottom = "20px";
      } else if (window.scrollY > 10) {
        productDetailRef.current.style.position = "sticky";
        productDetailRef.current.style.top = "52px";
        productDetailRef.current.style.bottom = "auto";
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const changeMainImage = (newSrc) => {
    setCurrentImage(newSrc);
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
    if (commentError) setCommentError(null);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setCommentError("Comment cannot be empty");
      return;
    }
    try {
      setSubmittingComment(true);
      setCommentError(null);

      // Fetch fresh user data from backend
      const profileResponse = await axiosInstance.get("/auth/profile");
      const user = profileResponse.data.user;

      if (!user || !user.id) {
        setCommentError("You need to be logged in as a buyer to comment");
        return;
      }
      if (userType !== "pembeli") {
        setCommentError("Only buyers can post discussions");
        return;
      }

      const idPembeli = parseInt(user.id, 10);
      if (!idPembeli) {
        throw new Error("ID_PEMBELI tidak valid.");
      }

      const now = new Date();
      const formattedDateTime = now
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      const payload = {
        ID_BALASANDISKUSI: null,
        ID_PEGAWAI: null,
        ID_PEMBELI: idPembeli,
        KODE_PRODUK: id,
        PESAN: comment,
        TANGGAL_DIBUAT: formattedDateTime,
      };
      const response = await axiosInstance.post(`/pembeli/diskusi`, payload);
      const newDiscussion = response.data;
      newDiscussion.pembeli = { NAMA: user.nama || "User" };
      setDiscussions([...discussions, newDiscussion]);
      setComment("");
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Komentar berhasil ditambahkan!",
        confirmButtonColor: "#3085d6",
      });
    } catch (err) {
      console.error(
        "Error posting discussion:",
        err.response?.data || err.message
      );
      setCommentError(
        err.response?.data?.error || "Failed to post comment. Please try again."
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const StarRating = ({ rating, size = 20, showText = true }) => {
    const numericRating =
      rating && rating !== "-" && rating !== "null" && rating !== "undefined"
        ? parseFloat(rating)
        : 0;

    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            size={size}
            className="fill-yellow-400 text-yellow-400"
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star size={size} className="text-gray-300" />
            <Star
              size={size}
              className="absolute top-0 left-0 fill-yellow-400 text-yellow-400"
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={size} className="text-gray-300" />
        ))}
        {showText && (
          <span className="ml-2 text-sm text-gray-600">
            {numericRating > 0
              ? `${numericRating.toFixed(1)}`
              : "Belum ada ulasan"}
          </span>
        )}
      </div>
    );
  };

  const getPenitipInfo = (product) => {
    console.log("Product data in getPenitipInfo:", product);
    const penitipName =
      product.penitip?.name ||
      product.penitip_name ||
      product.penitip?.NAMA ||
      null;

    const penitipRating =
      product.penitip?.rating ||
      product.penitip_rating ||
      product.penitip?.RATING ||
      null;

    const penitipSalesCount =
      product.penitip?.sales_count ||
      product.penitip_sales_count ||
      product.penitip?.SALES_COUNT ||
      product.penitip?.JLH_PENJUALAN ||
      product.penitip_jlh_penjualan ||
      0;

    const penitipBadge =
      product.penitip?.badge ||
      product.penitip_badge ||
      product.penitip?.BADGE ||
      0;

    return {
      name: penitipName,
      rating: penitipRating,
      salesCount: penitipSalesCount,
      badge: penitipBadge,
    };
  };

  const addToCart = async () => {
    if (!isAuthenticated) {
      await Swal.fire({
        icon: "warning",
        title: "Belum Login",
        text: "Silakan login sebagai pembeli untuk menambahkan ke keranjang.",
        confirmButtonColor: "#3085d6",
      });
      navigate("/login");
      return;
    }

    if (userType !== "pembeli") {
      await Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Hanya pembeli yang bisa menambahkan ke keranjang.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Fetch fresh user data from backend
    try {
      const profileResponse = await axiosInstance.get("/auth/profile");
      const user = profileResponse.data.user;

      if (!user || !user.id) {
        console.error("User data invalid:", user);
        await Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Data pengguna tidak valid. Silakan login kembali.",
          confirmButtonColor: "#3085d6",
        });
        navigate("/login");
        return;
      }

      const idPembeli = parseInt(user.id, 10);
      if (isNaN(idPembeli)) {
        console.error("ID_PEMBELI is NaN:", user.id);
        await Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "ID pengguna tidak valid. Silakan login kembali.",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      if (isAddingToCart) {
        console.log("Add to cart blocked: already in progress");
        return;
      }

      const result = await Swal.fire({
        title: "Tambah ke Keranjang?",
        text: "Apakah Anda yakin ingin menambahkan produk ini?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonText: "Batal",
        confirmButtonText: "Ya",
      });

      if (!result.isConfirmed) return;

      setIsAddingToCart(true);
      try {
        const payload = {
          ID_PEMBELI: idPembeli,
          KODE_PRODUK: id,
        };
        console.log("Sending payload to add to cart:", payload);
        const response = await axiosInstance.post(
          `/pembeli/cart/add/${id}`,
          payload
        );
        console.log("Add to cart response:", response.data);

        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: response.data.message || "Berhasil ditambahkan ke keranjang!",
          confirmButtonColor: "#3085d6",
        });
        navigate("/cart");
      } catch (error) {
        console.error("Add to cart error:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        await Swal.fire({
          icon: "error",
          title: "Gagal",
          text:
            error.response?.data?.message ||
            "Gagal menambah ke keranjang. Silakan coba lagi.",
          confirmButtonColor: "#3085d6",
        });
      } finally {
        setIsAddingToCart(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat data pengguna. Silakan login kembali.",
        confirmButtonColor: "#3085d6",
      });
      navigate("/login");
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      await Swal.fire({
        icon: "warning",
        title: "Belum Login",
        text: "Silakan login sebagai pembeli untuk melanjutkan pembelian.",
        confirmButtonColor: "#3085d6",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      return;
    }

    if (userType !== "pembeli") {
      await Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Hanya pembeli yang bisa melakukan pembelian.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    navigate(`/checkout?kode_produk=${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-600"></div>
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
          className="mt-4 bg-olive-500 text-white px-6 py-2 rounded-lg hover:bg-stone-700"
        >
          Return to Catalogue
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle size={48} className="text-amber-500 mb-4" />
        <div className="text-center py-4 font-medium text-xl">
          Barang tidak ditemukan atau tidak tersedia.
        </div>
        <Link
          to="/catalogue"
          className="mt-4 bg-olive-500 text-white px-6 py-2 rounded-lg hover:bg-stone-700"
        >
          Temukan Barang
        </Link>
      </div>
    );
  }

  const penitipInfo = getPenitipInfo(product);

  return (
    <div className="mt-28">
      <div className="pl-16 pb-8">
        <a
          href="/catalogue"
          className="underline text-stone-700 text-md hover:text-stone-900"
        >
          Produk &gt; {product.category || "Kategori"} &gt;{" "}
          {product.name || "Produk"}
        </a>
      </div>
      <div className="grid grid-cols-12 mx-16">
        <div className="col-span-7 mr-4">
          <div className="grid grid-cols-12 gap-2">
            <div className="grid grid-rows-3 col-span-3 gap-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="rounded-lg overflow-hidden cursor-pointer hover:shadow-lg justify-center items-center h-full flex"
                  onClick={() => changeMainImage(image)}
                >
                  <img
                    src={image}
                    className="h-full object-fill"
                    alt={`Thumbnail ${index + 1}`}
                    onError={(e) => (e.target.src = "/api/placeholder/60/60")}
                  />
                </div>
              ))}
            </div>
            <div className="rounded-lg col-span-9 pl-3">
              <img
                src={currentImage}
                alt={product.name || "Product Image"}
                className="w-auto h-full object-fill rounded-md"
                onError={(e) => (e.target.src = "/api/placeholder/60/60")}
              />
            </div>
          </div>
          <div className="mt-4 p-4 bg-olive-100 rounded-lg border border-olive-500/50">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              Informasi Penitip
            </h3>
            {penitipInfo.name ? (
              <div>
                <div className="flex items-center mb-2">
                  <p className="text-sm text-gray-600">
                    Penitip:{" "}
                    <span className="font-medium">{penitipInfo.name}</span>
                  </p>
                  {penitipInfo.badge === 1 && (
                    <span
                      className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{
                        background: "linear-gradient(45deg, #FFD700, #FFB700)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      Top Seller
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Barang Terjual:{" "}
                  <span className="font-medium">{penitipInfo.salesCount}</span>
                </p>
                <div className="mb-2">
                  <p className="text-sm text-gray-600 mb-1">Rating Penitip:</p>
                  <StarRating
                    rating={penitipInfo.rating}
                    totalReviews={penitipInfo.salesCount}
                    size={18}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">
                  Informasi penitip tidak tersedia untuk produk ini.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Kemungkinan produk ini belum terkait dengan penitip atau data
                  sedang diperbarui.
                </p>
                <StarRating rating={0} totalReviews={0} size={16} />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-semibold my-6">Diskusi Produk</h2>
          {isAuthenticated && userType === "pembeli" && (
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <img
                  src="/api/placeholder/40/40"
                  alt="User Avatar"
                  className="w-6 h-6 rounded-full"
                />
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={comment}
                    onChange={handleCommentChange}
                    placeholder="Write a comment..."
                    className={`w-full border ${
                      commentError ? "border-red-500" : "border-gray-200"
                    } rounded-2xl px-4 py-2 pr-12 text-md focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent`}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!comment.trim() || submittingComment}
                  className="bg-olive-500 hover:bg-olive-900 text-white px-5 py-2 rounded-full flex items-center gap-2 transition-colors disabled:bg-stone-300"
                >
                  {submittingComment ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Send size={18} />
                  )}
                  <span className="hidden sm:inline text-md">Send</span>
                </button>
              </div>
              {commentError && (
                <div className="mt-2 text-red-500 text-sm flex items-center gap-1 pl-12">
                  <AlertCircle size={16} />
                  <span>{commentError}</span>
                </div>
              )}
            </div>
          )}
          {!isAuthenticated && (
            <div className="text-center p-6 bg-gray-50 rounded-lg mb-8 border border-gray-200">
              <p className="text mb-3">
                Login untuk menambahkan komentar dan berdiskusi
              </p>
              <Link
                to="/login"
                className="inline-block bg-olive-500 text-white px-6 py-2 rounded-full hover:bg-stone-700 transition-colors"
              >
                Login untuk Berdiskusi
              </Link>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <div className="text-gray-500 font-medium">
              <span className="text-gray-900 font-semibold text-lg">
                {discussions.length} Comments
              </span>
            </div>
          </div>
          {discussions.length > 0 ? (
            <div className="space-y-6 ml-4">
              {discussions.map((discussion) => (
                <div
                  key={discussion.ID_DISKUSI}
                  className="border-b border-gray-300 pb-6"
                >
                  <div className="flex gap-3">
                    <img
                      src="src/assets/user.png"
                      alt={
                        discussion.pegawai?.NAMA ||
                        discussion.pembeli?.NAMA ||
                        "User"
                      }
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {discussion.pegawai?.NAMA ||
                            discussion.pembeli?.NAMA ||
                            "User"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(discussion.TANGGAL_DIBUAT).toLocaleString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3 text-lg">
                        {discussion.PESAN}
                      </p>
                      {discussion.balasan &&
                        discussion.balasan.length > 0 &&
                        discussion.balasan
                          .filter((reply) => reply.pegawai)
                          .map((reply) => (
                            <div
                              key={reply.ID_DISKUSI}
                              className="mt-4 pl-4 border-l-2 border-gray-100"
                            >
                              <div className="flex gap-3">
                                <img
                                  src="src/assets/user.png"
                                  alt={reply.pegawai?.NAMA || "User"}
                                  className="w-10 h-10 rounded-full"
                                />
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900 text-lg">
                                      {reply.pegawai?.NAMA || "User"}
                                    </span>
                                    <span className="bg-stone-100 text-stone-800 text-xs px-2 py-0.5 rounded-full">
                                      Official
                                    </span>
                                    <span className="text-gray-500">
                                      {new Date(
                                        reply.TANGGAL_DIBUAT
                                      ).toLocaleString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 mb-2 text-lg">
                                    {reply.PESAN}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-gray-500">
                Belum ada komentar untuk produk ini, jadilah yang pertama!
              </p>
            </div>
          )}
          {discussions.length > 0 && (
            <button className="w-full mt-6 py-3 border border-gray-200 rounded-lg text-stone-600 font-medium hover:bg-gray-50 transition-colors">
              Load More Comments
            </button>
          )}
        </div>
        <div className="col-span-5">
          <div
            ref={productDetailRef}
            className="max-w-3xl w-full pl-4 bg-white top-28 right-16"
            style={{ position: "sticky" }}
          >
            <div className="py-4">
              <div className="flex w-auto">
                <div className="py-2 px-3 mr-2 bg-olive-300 text-olive-500 rounded-2xl">
                  {product.category || "Kategori"}
                </div>
              </div>
              <h1 className="mt-3 text-2xl font-bold">
                {product.name || "Unknown Product"}
              </h1>
              <h1 className="mt-5 text-3xl font-bold text-olive-500">
                Rp.{" "}
                {product.price ? product.price.toLocaleString("id-ID") : "N/A"}
              </h1>
              <p className="mt-5 text-lg">
                Kondisi: {product.condition || "Tidak Diketahui"}
              </p>
              <p className="mt-5 text-lg">
                Berat:{" "}
                {product.weight ? `${product.weight} KG` : "Tidak Diketahui"}
              </p>
              <p className="mt-5 text-lg">
                Garansi:{" "}
                {product.warranty_date
                  ? new Date(product.warranty_date).toLocaleDateString("id-ID")
                  : "Tidak Ada"}
              </p>
              <p className="mt-5 text-lg text-justify">
                Deskripsi:{" "}
                {product.description || "Tidak ada deskripsi tersedia."}
              </p>
              <div className="flex w-full mt-10 text-center">
                <button
                  onClick={addToCart}
                  disabled={isAddingToCart}
                  className={`py-2 px-3 mr-2 border-2 border-olive-500 rounded-lg w-full cursor-pointer ${
                    isAddingToCart ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isAddingToCart ? "Menambahkan..." : "+ Keranjang"}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="py-2 px-3 mr-2 bg-olive-500 text-white rounded-lg w-full cursor-pointer"
                >
                  $ Beli Sekarang
                </button>
              </div>
              {!isAuthenticated && (
                <p className="mt-2 text-sm text-gray-500 italic">
                  * Anda belum login. Silakan login untuk menambahkan ke
                  keranjang dan checkout.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div ref={recommendedSectionRef}>
        <RecommendedProducts />
      </div>
      <Footer />
    </div>
  );
};

export default DetailProduct;
