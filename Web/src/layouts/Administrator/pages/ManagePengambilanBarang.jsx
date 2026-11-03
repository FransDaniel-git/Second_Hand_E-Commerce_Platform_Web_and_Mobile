import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

const ManagePengambilanBarang = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [sortBy, setSortBy] = useState("tanggal_konfirmasi");
  const [statusFilter, setStatusFilter] = useState("Siap Diambil Kembali");

  const sortOptions = [
    { value: "tanggal_konfirmasi", label: "Tanggal Konfirmasi" },
    { value: "kode_barang", label: "Kode Barang" },
    { value: "nama_penitip", label: "Nama Penitip" },
    { value: "nama", label: "Nama Barang" },
    { value: "harga_jual", label: "Harga Jual" },
    { value: "tanggal_kadaluarsa", label: "Tanggal Kadaluarsa" },
  ];

  const statusOptions = [
    { value: "Siap Diambil Kembali", label: "Siap Diambil" },
    { value: "Dikembalikan", label: "Dikembalikan" },
    { value: "Semua", label: "Semua Status" },
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8000/api/gudang/barang-titipan",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setItems(response.data.data);
        setError(null);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch barang titipan"
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Gagal mengambil barang titipan."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetails = async (kodeBarang) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `http://localhost:8000/api/products/${kodeBarang}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const productData = response.data.data;
      setSelectedProduct({
        ...productData,
        expiry_date: productData.expiry_date || null,
        status: productData.status || "Unknown",
        extension_date: productData.extension_date || null,
      });
      const images = productData.photos.map((photo) => photo.url);
      setProductImages(images);
      const mainImage =
        productData.photos.find((photo) => photo.is_utama) ||
        productData.photos[0];
      setCurrentImage(mainImage ? mainImage.url : "/api/placeholder/60/60");
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error(`Failed to fetch product details: ${error.message}`);
    }
  };

  const handleConfirmRetrieval = async (item) => {
    const result = await Swal.fire({
      title: "Konfirmasi Pengambilan Barang",
      text: `Apakah Anda yakin bahwa ${item.nama_penitip} telah mengambil kembali barang ${item.nama} (${item.kode_barang})?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Konfirmasi",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:8000/api/gudang/barang-titipan/${item.kode_barang}/confirm-retrieval`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Pengambilan barang berhasil dikonfirmasi!");
        await fetchItems(); // Refresh the table
      } else {
        throw new Error(
          response.data.message || "Gagal mengkonfirmasi pengambilan"
        );
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(`Gagal mengkonfirmasi pengambilan: ${errorMessage}`);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleSortChange = (e) => setSortBy(e.target.value);

  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);

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

  const filteredItems = items
    .filter((item) => {
      if (statusFilter === "Semua") return true;
      return item.status_barang === statusFilter;
    })
    .filter(
      (item) =>
        item.kode_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.no_nota_penitipan || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.nama_penitip || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.nama || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.status_barang || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "harga_jual") {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      } else if (sortBy.includes("tanggal")) {
        aValue = new Date(aValue || "1900-01-01");
        bValue = new Date(bValue || "1900-01-01");
      } else {
        aValue = (aValue || "").toString().toLowerCase();
        bValue = (bValue || "").toString().toLowerCase();
      }

      return aValue < bValue ? -1 : 1;
    });

  const calculateRemainingDays = (expiryDate, status) => {
    if (!expiryDate || expiryDate === "-" || status === "Terjual") return "-";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) return "Kadaluarsa";
    return `${diffDays} hari`;
  };

  const isWarrantyActive = (warrantyDate) => {
    if (!warrantyDate) return false;
    const currentDate = new Date();
    const warranty = new Date(warrantyDate);
    return currentDate <= warranty;
  };

  const changeMainImage = (newSrc) => {
    setCurrentImage(newSrc);
  };

  return (
    <div className="min-h-screen mx-4 mt-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Manage Pengambilan Barang Titipan
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>
      )}

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Cari barang (kode, nota, penitip, nama, status)..."
            value={searchTerm}
            onChange={handleSearch}
            className="p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 text-sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Filter:
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 bg-white text-sm min-w-[140px]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
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
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Kode Barang
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Nota Penitipan
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Penitip
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Nama Barang
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Harga
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Kadaluarsa
                </th>
                <th className="px-3 py-3 bg-olive-500 text-xs font-medium text-white uppercase tracking-wider text-center">
                  Konfirmasi
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
                    colSpan="9"
                    className="px-6 py-4 text-sm text-center text-gray-500"
                  >
                    Tidak ada barang yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.kode_barang} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="text-xs font-medium text-gray-900">
                        {item.kode_barang}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="text-xs text-gray-900">
                        {item.no_nota_penitipan || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.nama_penitip || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.nama}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {typeof item.harga_jual === "number"
                          ? `Rp ${item.harga_jual.toLocaleString("id-ID")}`
                          : item.harga_jual || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="text-xs text-gray-900">
                        {formatDate(item.tanggal_kadaluarsa)}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="text-xs text-gray-900">
                        {formatDate(item.tanggal_konfirmasi)}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status_barang === "Siap Diambil Kembali"
                            ? "bg-yellow-100 text-yellow-800"
                            : item.status_barang === "Dikembalikan"
                            ? "bg-green-100 text-green-800"
                            : item.status_barang === "Kadaluarsa"
                            ? "bg-red-100 text-red-800"
                            : item.status_barang === "Didonasikan"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.status_barang}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="flex flex-col gap-2">
                        <button
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs transition-colors"
                          onClick={() => fetchProductDetails(item.kode_barang)}
                        >
                          Detail
                        </button>
                        {item.status_barang === "Siap Diambil Kembali" && (
                          <button
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs transition-colors"
                            onClick={() => handleConfirmRetrieval(item)}
                          >
                            Konfirmasi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail */}
      {isDetailModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDetailModalOpen(false);
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
                      <span className="font-semibold">Harga:</span>{" "}
                      {selectedProduct.price
                        ? `Rp ${selectedProduct.price.toLocaleString("id-ID")}`
                        : "N/A"}
                    </p>
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
                      {selectedProduct.warranty_date ? (
                        <>
                          {formatDate(selectedProduct.warranty_date)}
                          {isWarrantyActive(selectedProduct.warranty_date) && (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Aktif
                            </span>
                          )}
                        </>
                      ) : (
                        "Tidak Ada"
                      )}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Tanggal Kadaluarsa:</span>{" "}
                      {selectedProduct.expiry_date
                        ? formatDate(selectedProduct.expiry_date)
                        : "-"}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Status:</span>{" "}
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          selectedProduct.status === "Siap Diambil Kembali"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedProduct.status === "Dikembalikan"
                            ? "bg-green-100 text-green-800"
                            : selectedProduct.status === "Kadaluarsa"
                            ? "bg-red-100 text-red-800"
                            : selectedProduct.status === "Didonasikan"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedProduct.status || "Unknown"}
                      </span>
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
                  onClick={() => setIsDetailModalOpen(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default ManagePengambilanBarang;
