import React, { useState, useEffect } from "react";
import axios from "axios";
import AuthService from "../../../services/authService";

const DaftarBarangTitipan = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("no_nota_penitipan");
  const [sortDirection, setSortDirection] = useState("asc");

  const sortOptions = [
    { value: "no_nota_penitipan", label: "No Nota" },
    { value: "tanggal_penitipan", label: "Tanggal Titip" },
    { value: "nama", label: "Nama Barang" },
    { value: "harga_jual", label: "Harga" },
    { value: "tanggal_kadaluarsa", label: "Kadaluarsa" },
    { value: "status", label: "Status" },
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const response = await axios.get(
          "http://localhost:8000/api/penitip/barang-titipan",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setItems(response.data.data);
          setFilteredItems(response.data.data);
        } else {
          throw new Error("Failed to fetch consignment items.");
        }
      } catch (err) {
        console.error("Error fetching consignment items:", err);
        setError("Gagal mengambil daftar barang titipan. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    let filtered = items.filter(
      (item) =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.no_nota_penitipan
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tanggal_penitipan.includes(searchTerm) ||
        item.tanggal_kadaluarsa.includes(searchTerm)
    );

    filtered = filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy.includes("tanggal")) {
        aValue = new Date(aValue || "1900-01-01");
        bValue = new Date(bValue || "1900-01-01");
      } else if (sortBy === "harga_jual") {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      } else {
        aValue = (aValue || "").toString().toLowerCase();
        bValue = (bValue || "").toString().toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredItems(filtered);
  }, [searchTerm, items, sortBy, sortDirection]);

  const fetchProductDetails = async (kodeProduk) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8000/api/products/${kodeProduk}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const productData = response.data.data;
        setSelectedProduct(productData);
        const images = productData.photos.map((photo) => photo.url);
        setProductImages(images);
        const mainImage =
          productData.photos.find((photo) => photo.is_utama) ||
          productData.photos[0];
        setCurrentImage(mainImage ? mainImage.url : "/api/placeholder/60/60");
        setIsModalOpen(true);
      } else {
        throw new Error("Failed to fetch product details.");
      }
    } catch (err) {
      console.error("Error fetching product details:", err);
      setError("Gagal mengambil detail barang. Silakan coba lagi.");
    }
  };

  const handleViewDetails = (kodeProduk) => {
    fetchProductDetails(kodeProduk);
  };

  const changeMainImage = (newSrc) => {
    setCurrentImage(newSrc);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-4">
      <h1 className="text-3xl font-bold mb-8">Daftar Barang Titipan</h1>

      {/* Search and Sort Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Cari berdasarkan nama barang, no nota, tanggal penitipan, tanggal kadaluarsa, status, atau tanggal konfirmasi"
            value={searchTerm}
            onChange={handleSearch}
            className="p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Urutkan:
            </label>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 bg-white text-sm min-w-[140px]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleSortDirection}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 transition-colors"
            title={`Urutkan ${sortDirection === "asc" ? "Menurun" : "Menaik"}`}
          >
            {sortDirection === "asc" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M9 8.25c-.19 0-.38-.07-.53-.22L6.5 6.06L4.53 8.03c-.29.29-.77.29-1.06 0s-.29-.77 0-1.06l2.5-2.5c.29-.29.77-.29 1.06 0l2.5 2.5c.29.29.29.77 0 1.06c-.15.15-.34.22-.53.22Z"
                />
                <path
                  fill="currentColor"
                  d="M6.5 19.75c-.41 0-.75-.34-.75-.75V5c0-.41.34-.75.75-.75s.75.34.75.75v14c0 .41-.34.75-.75.75ZM20 8.25h-8c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h8c.41 0 .75.34.75.75s-.34.75-.75.75Zm-4 6h-4c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h4c.41 0 .75.34.75.75s-.34.75-.75.75Zm-2 3h-2c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h2c.41 0 .75.34.75.75s-.34.75-.75.75Zm4-6h-6c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h6c.41 0 .75.34.75.75s-.34.75-.75.75Z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M6.5 19.75c-.19 0-.38-.07-.53-.22l-2.5-2.5c-.29-.29-.29-.77 0-1.06s.77-.29 1.06 0l1.97 1.97l1.97-1.97c.29-.29.77-.29 1.06 0s.29.77 0 1.06l-2.5 2.5c-.15.15-.34.22-.53.22Z"
                />
                <path
                  fill="currentColor"
                  d="M6.5 19.75c-.41 0-.75-.34-.75-.75V5c0-.41.34-.75.75-.75s.75.34.75.75v14c0 .41-.34.75-.75.75ZM20 8.25h-8c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h8c.41 0 .75.34.75.75s-.34.75-.75.75Zm-4 6h-4c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h4c.41 0 .75.34.75.75s-.34.75-.75.75Zm-2 3h-2c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h2c.41 0 .75.34.75.75s-.34.75-.75.75Zm4-6h-6c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h6c.41 0 .75.34.75.75s-.34.75-.75.75Z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Memuat...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  No Nota
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Tanggal Titip
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Nama Barang
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Harga Jual
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Kadaluarsa
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-sm text-center text-gray-500"
                  >
                    Tidak ada barang titipan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr
                    key={`item-${item.kode_produk}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="text-xs font-medium text-gray-900">
                        {item.no_nota_penitipan}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="text-xs text-gray-900">
                        {formatDateTime(item.tanggal_penitipan)}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.nama}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">
                        Rp {item.harga_jual.toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="text-xs text-gray-900">
                        {formatDateTime(item.tanggal_kadaluarsa)}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === "Tersedia"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Terjual"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "Kadaluarsa"
                            ? "bg-red-100 text-red-800"
                            : item.status === "Siap Diambil Kembali"
                            ? "bg-yellow-100 text-yellow-800"
                            : item.status === "Didonasikan" ||
                              item.status === "Telah Didonasikan"
                            ? "bg-gray-100 text-gray-800"
                            : item.status === "Dikembalikan"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <button
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs transition-colors"
                        onClick={() => handleViewDetails(item.kode_produk)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Detail Barang</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <img
                      src={currentImage}
                      alt={selectedProduct.name || "Product Image"}
                      className="w-full h-64 object-cover rounded-md"
                      onError={(e) => (e.target.src = "/api/placeholder/60/60")}
                    />
                  </div>
                  {productImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {productImages.map((image, index) => (
                        <div
                          key={index}
                          className="rounded overflow-hidden cursor-pointer border-2 border-transparent hover:border-olive-500"
                          onClick={() => changeMainImage(image)}
                        >
                          <img
                            src={image}
                            className="h-16 w-full object-cover"
                            alt={`Thumbnail ${index + 1}`}
                            onError={(e) =>
                              (e.target.src = "/api/placeholder/60/60")
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-2">
                    <span className="inline-block py-1 px-3 bg-olive-100 text-olive-800 rounded-full text-sm font-medium">
                      {selectedProduct.category || "Kategori"}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold mb-4">
                    {selectedProduct.name || "Unknown Product"}
                  </h1>
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      <span className="font-semibold">Kondisi:</span>{" "}
                      {selectedProduct.condition || "Tidak Diketahui"}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Berat:</span>{" "}
                      {selectedProduct.weight
                        ? `${selectedProduct.weight} KG`
                        : "Tidak Diketahui"}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Garansi:</span>{" "}
                      {selectedProduct.warranty_date
                        ? new Date(
                            selectedProduct.warranty_date
                          ).toLocaleDateString("id-ID")
                        : "Tidak Ada"}
                    </p>
                    <div className="pt-3">
                      <p className="font-semibold text-gray-700">Deskripsi:</p>
                      <p className="text-gray-600 mt-1 text-justify">
                        {selectedProduct.description ||
                          "Tidak ada deskripsi tersedia."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaftarBarangTitipan;
