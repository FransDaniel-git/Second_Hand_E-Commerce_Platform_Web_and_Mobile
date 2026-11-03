import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import axios from "axios";
import { generateReceiptPDF } from "./ReceiptPDFGenerator";

const ManageOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("NOMOR_NOTA");
  const [sortDirection, setSortDirection] = useState("asc");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    session: "",
    courier: "",
  });
  const [courierSearch, setCourierSearch] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [productImages, setProductImages] = useState([]);

  const sessions = {
    dikirim: [
      { value: "09:00", label: "09:00 - Sesi Pagi" },
      { value: "13:00", label: "13:00 - Sesi Siang" },
      { value: "17:00", label: "17:00 - Sesi Sore" },
    ],
    "Diambil Sendiri": [
      { value: "09:00", label: "09:00 - Sesi Pagi" },
      { value: "12:00", label: "12:00 - Sesi Siang" },
      { value: "15:00", label: "15:00 - Sesi Sore" },
      { value: "18:00", label: "18:00 - Sesi Malam" },
    ],
  };

  const statusTabs = [
    { value: "all", label: "Semua" },
    { value: "Sedang Dikemas", label: "Sedang Dikemas" },
    { value: "Siap Dikirim", label: "Siap Dikirim" },
    { value: "Siap Diambil", label: "Siap Diambil" },
    { value: "Sedang Dikirim", label: "Sedang Dikirim" },
    { value: "Sudah Diterima", label: "Sudah Diterima" },
    { value: "Sudah Diambil", label: "Sudah Diambil" },
  ];

  const sortOptions = [
    { value: "NOMOR_NOTA", label: "Nomor Nota" },
    { value: "NAMA_PEMBELI", label: "Nama Pembeli" },
    { value: "WAKTU_TRANSAKSI", label: "Tanggal Transaksi" },
    { value: "TOTAL_AKHIR", label: "Total Harga" },
    { value: "METODE_PENGIRIMAN", label: "Metode Pengiriman" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token:", token);
    fetchOrders();
    fetchCouriers();
  }, []);

  useEffect(() => {
    let filtered = orders.filter(
      (order) =>
        order.NOMOR_NOTA.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.NAMA_PEMBELI.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.STATUS.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.METODE_PENGIRIMAN.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ||
        new Date(order.WAKTU_TRANSAKSI)
          .toISOString()
          .split("T")[0]
          .includes(searchTerm) ||
        order.ITEMS.some(
          (item) =>
            item.NAMA_BARANG.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.NAMA_PENITIP.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.STATUS.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (methodFilter !== "all") {
      filtered = filtered.filter(
        (order) =>
          order.METODE_PENGIRIMAN.toLowerCase() === methodFilter.toLowerCase()
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(
        (order) =>
          new Date(order.WAKTU_TRANSAKSI).toISOString().split("T")[0] ===
          dateFilter
      );
    }

    filtered = filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "WAKTU_TRANSAKSI") {
        aValue = new Date(aValue || "1900-01-01");
        bValue = new Date(bValue || "1900-01-01");
      } else if (sortBy === "TOTAL_AKHIR") {
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

    setFilteredOrders(filtered);
  }, [
    orders,
    searchTerm,
    statusFilter,
    methodFilter,
    dateFilter,
    sortBy,
    sortDirection,
  ]);

  const [filteredOrders, setFilteredOrders] = useState([]);

  const fetchOrders = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    console.log("Fetching orders with token:", token);
    axios
      .get("http://localhost:8000/api/gudang/transaksi-penjualan", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.data)) {
          const mappedOrders = response.data.data
            .filter(
              (transaction) =>
                ![
                  "Menunggu Pembayaran",
                  "Menunggu Verifikasi",
                  "Dibatalkan",
                  "Hangus",
                ].includes(transaction.status)
            )
            .map((transaction) => ({
              NOMOR_NOTA: transaction.no_nota,
              NAMA_PEMBELI: transaction.nama_pembeli,
              EMAIL_PEMBELI: transaction.email_pembeli,
              ITEMS: transaction.products.map((product) => ({
                KODE_BARANG: product.product_id,
                NAMA_BARANG: product.nama_barang,
                NAMA_PENITIP: product.nama_penitip,
                NAMA_QC: product.nama_qc,
                ID_PEGAWAI_QC: product.id_pegawai_qc,
                JUMLAH: 1,
                HARGA: product.harga_raw,
              })),
              TOTAL_BIAYA: transaction.total_biaya,
              ONGKIR: transaction.ongkir,
              POIN_TERPAKAI: transaction.poin_digunakan,
              TOTAL_AKHIR: transaction.total_akhir,
              POIN_DIPEROLEH: transaction.poin_diperoleh,
              TOTAL_POIN_PEMBELI: transaction.total_poin_pembeli,
              STATUS: transaction.status,
              WAKTU_TRANSAKSI: transaction.tanggal_transaksi,
              TANGGAL_PEMBAYARAN: transaction.tanggal_pembayaran,
              METODE_PENGIRIMAN: transaction.metode_pengiriman,
              ALAMAT_PENGIRIMAN: transaction.alamat,
              NAMA_KURIR: transaction.nama_kurir,
              ID_PEGAWAI_KURIR: transaction.id_pegawai_kurir,
              SCHEDULE_DETAILS: transaction.schedule_details,
              ID_PENJUALAN: transaction.id_penjualan,
            }));
          console.log("Mapped Orders:", mappedOrders);
          setOrders(mappedOrders);
          setError("");
        } else {
          setError("Invalid order data format.");
        }
      })
      .catch((error) => {
        console.error("Order fetch error:", error.response?.data);
        setError(`Failed to fetch orders: ${error.message}`);
      })
      .finally(() => setLoading(false));
  };

  const fetchCouriers = () => {
    const token = localStorage.getItem("token");
    console.log("Fetching couriers with token:", token);
    axios
      .get("http://localhost:8000/api/gudang/employees/kurir", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          setCouriers(response.data);
        } else {
          setError("Invalid courier data format.");
        }
      })
      .catch((error) => {
        console.error("Courier fetch error:", error.response?.data);
        setError(`Failed to fetch couriers: ${error.message}`);
      });
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        "http://localhost:8000/api/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (response.data.user_type === "pegawai") {
        return response.data.user.id;
      }
      throw new Error("User is not a pegawai");
    } catch (error) {
      console.error("User fetch error:", error.response?.data);
      throw error;
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
      setSelectedProduct(productData);
      const images = productData.photos.map((photo) => photo.url);
      setProductImages(images);
      const mainImage =
        productData.photos.find((photo) => photo.is_utama) ||
        productData.photos[0];
      setCurrentImage(mainImage ? mainImage.url : "/api/placeholder/60/60");
      setIsProductModalOpen(true);
    } catch (error) {
      console.error("Product fetch error:", error.response?.data);
      toast.error(`Failed to fetch product details: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleStatusFilter = (status) => setStatusFilter(status);

  const handleMethodFilter = (e) => setMethodFilter(e.target.value);

  const handleDateFilter = (e) => setDateFilter(e.target.value);

  const handleSortChange = (e) => setSortBy(e.target.value);

  const toggleSortDirection = () =>
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));

  const getScheduleDate = (transactionTime) => {
    const paymentDate = new Date(transactionTime);
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split("T")[0];
    const paymentDateString = paymentDate.toISOString().split("T")[0];

    // Jika transaksi bukan hari ini, selalu jadwalkan untuk besok atau hari kerja berikutnya
    if (paymentDateString !== currentDateString) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }

    // Jika transaksi hari ini dan setelah jam 16:00, jadwalkan besok
    const paymentHour = paymentDate.getHours();
    const paymentMinute = paymentDate.getMinutes();
    if (paymentHour > 16 || (paymentHour === 16 && paymentMinute > 0)) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }

    // Default: jadwalkan hari ini
    return currentDateString;
  };

  const isSessionDisabled = (sessionValue, scheduleDate) => {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split("T")[0];

    if (scheduleDate !== currentDateString) {
      return false;
    }

    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const [sessionHour, sessionMinute] = sessionValue.split(":").map(Number);
    const sessionTimeInMinutes = sessionHour * 60 + sessionMinute;

    return sessionTimeInMinutes <= currentTimeInMinutes;
  };

  const handleSchedule = (order) => {
    console.log("Opening schedule modal for order:", order.NOMOR_NOTA);
    console.log("Order Status:", order.STATUS);
    console.log("Order Method:", order.METODE_PENGIRIMAN);
    setSelectedOrder(order);
    setScheduleForm({
      session: "",
      courier: order.METODE_PENGIRIMAN.toLowerCase() === "dikirim" ? "" : "",
    });
    setCourierSearch("");
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const { session, courier } = scheduleForm;

    console.log("Submitting schedule for order:", selectedOrder.NOMOR_NOTA);
    console.log("ID_PENJUALAN:", selectedOrder.ID_PENJUALAN);

    if (!session) {
      toast.error("Pilih sesi yang valid", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (
      selectedOrder.METODE_PENGIRIMAN.toLowerCase() === "dikirim" &&
      (!courier || !couriers.some((c) => c.NAMA === courier))
    ) {
      toast.error("Pilih kurir yang valid", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const scheduleDate = getScheduleDate(selectedOrder.WAKTU_TRANSAKSI);
    const result = await Swal.fire({
      title: "Konfirmasi Jadwal",
      text: `Jadwalkan untuk ${new Date(scheduleDate).toLocaleDateString(
        "id-ID",
        { day: "numeric", month: "long", year: "numeric" }
      )} ${session}${
        selectedOrder.METODE_PENGIRIMAN.toLowerCase() === "dikirim"
          ? ` dengan kurir ${courier}`
          : ""
      }?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Konfirmasi",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (result.isConfirmed) {
      try {
        if (!selectedOrder.ID_PENJUALAN) {
          throw new Error("ID_PENJUALAN is undefined");
        }

        const token = localStorage.getItem("token");
        const gudangId = await fetchCurrentUser();
        const courierId =
          selectedOrder.METODE_PENGIRIMAN.toLowerCase() === "dikirim"
            ? couriers.find((c) => c.NAMA === courier)?.ID_PEGAWAI
            : null;

        const updateData = {
          ID_PEGAWAI_GUDANG: gudangId,
          ID_PEGAWAI_KURIR: courierId,
          TANGGAL_SIAP: `${scheduleDate} ${session}:00`,
          STATUS:
            selectedOrder.METODE_PENGIRIMAN.toLowerCase() === "dikirim"
              ? "Siap Dikirim"
              : "Siap Diambil",
        };

        await axios.put(
          `http://localhost:8000/api/gudang/transaksi-penjualan/${selectedOrder.ID_PENJUALAN}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        await fetchOrders();

        toast.success(
          `Jadwal ${
            selectedOrder.METODE_PENGIRIMAN.toLowerCase() === "dikirim"
              ? "pengiriman"
              : "pengambilan"
          } berhasil dikonfirmasi!`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
        setIsScheduleModalOpen(false);
      } catch (error) {
        console.error("Schedule update error:", error.response?.data);
        toast.error(
          `Gagal menjadwalkan: ${
            error.response?.data.message || error.message
          }`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      }
    }
  };

  const handleConfirmPickup = async (order) => {
    console.log("Confirming pickup for order:", order.NOMOR_NOTA);
    console.log("ID_PENJUALAN:", order.ID_PENJUALAN);

    const result = await Swal.fire({
      title: "Konfirmasi Pengambilan",
      text: `Konfirmasi bahwa pesanan dengan nomor nota ${order.NOMOR_NOTA} telah diambil?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Konfirmasi",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (result.isConfirmed) {
      try {
        if (!order.ID_PENJUALAN) {
          throw new Error("ID_PENJUALAN is undefined");
        }

        const token = localStorage.getItem("token");
        const gudangId = await fetchCurrentUser();

        const updateData = {
          ID_PEGAWAI_GUDANG: gudangId,
          STATUS: "Sudah Diambil",
        };

        await axios.put(
          `http://localhost:8000/api/gudang/transaksi-penjualan/${order.ID_PENJUALAN}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        await fetchOrders();

        toast.success("Pengambilan berhasil dikonfirmasi!", {
          position: "top-right",
          autoClose: 3000,
        });
      } catch (error) {
        console.error("Pickup confirmation error:", error.response?.data);
        toast.error(
          `Gagal mengkonfirmasi pengambilan: ${
            error.response?.data.message || error.message
          }`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      }
    }
  };

  const handleScheduleInputChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm({ ...scheduleForm, [name]: value });
  };

  const handleCourierSearch = (e) => {
    setCourierSearch(e.target.value);
  };

  const selectCourier = (courier) => {
    setScheduleForm({ ...scheduleForm, courier });
    setCourierSearch("");
  };

  const filteredCouriers = couriers
    .filter((courier) =>
      courier.NAMA.toLowerCase().includes(courierSearch.toLowerCase())
    )
    .map((courier) => courier.NAMA);

  const toggleExpand = (nomorNota) => {
    setExpandedOrder(expandedOrder === nomorNota ? null : nomorNota);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleViewProductDetails = (kodeBarang) => {
    fetchProductDetails(kodeBarang);
  };

  const changeMainImage = (newSrc) => {
    setCurrentImage(newSrc);
  };

  const handlePrintReceipt = (order) => {
    generateReceiptPDF(order, toast)
      .then(() => {
        console.log("PDF generated successfully");
      })
      .catch((err) => {
        console.error("PDF generation failed:", err);
      });
  };

  return (
    <div className="min-h-screen md:max-w-7xl 2xl:max-w-screen mx-auto mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-10">
        Manajemen Daftar Pesanan
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari nomor nota, nama pembeli, status, metode pengiriman, tanggal transaksi, nama barang, atau nama penitip"
            value={searchTerm}
            onChange={handleSearch}
            className="p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Urutkan berdasarkan:
          </label>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 bg-white min-w-[180px]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={toggleSortDirection}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 transition-colors"
            title={`Urutkan ${
              sortDirection === "asc" ? "Menurun (Z-A)" : "Menaik (A-Z)"
            }`}
          >
            {sortDirection === "asc" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
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
                width="24"
                height="24"
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

      {/* Status Tabs */}
      <div className="flex overflow-x-auto mb-6 pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusFilter(tab.value)}
            className={`px-4 py-2 whitespace-nowrap font-medium text-sm mr-2 rounded-md transition-colors ${
              statusFilter === tab.value
                ? "bg-olive-500 text-white"
                : "bg-white text-gray-700 hover:bg-olive-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow mt-10">
        {loading ? (
          <p className="p-6 text-center text-gray-500">Loading...</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {[
                  "Nomor Nota",
                  "Nama Pembeli",
                  "Nama Barang",
                  "Nama Penitip",
                  "Waktu Transaksi",
                  "Total Harga",
                  "Metode Pengiriman",
                  "Status",
                  "Aksi",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 bg-olive-500 text-sm font-medium text-white uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <React.Fragment key={order.NOMOR_NOTA}>
                    <tr>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {order.NOMOR_NOTA}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {order.NAMA_PEMBELI}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.ITEMS.map((item) => item.NAMA_BARANG).join(", ")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.ITEMS.map((item) => item.NAMA_PENITIP).join(
                          ", "
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {new Date(order.WAKTU_TRANSAKSI).toLocaleString(
                          "id-ID",
                          {
                            dateStyle: "medium",
                            timeStyle: "medium",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {formatCurrency(order.TOTAL_AKHIR)}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {order.METODE_PENGIRIMAN}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            order.STATUS === "Sedang Dikemas"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.STATUS === "Siap Dikirim"
                              ? "bg-green-100 text-green-800"
                              : order.STATUS === "Siap Diambil"
                              ? "bg-blue-100 text-blue-800"
                              : order.STATUS === "Sedang Dikirim"
                              ? "bg-purple-100 text-purple-800"
                              : order.STATUS === "Sudah Diterima" ||
                                order.STATUS === "Sudah Diambil"
                              ? "bg-gray-100 text-gray-800"
                              : ""
                          }`}
                        >
                          {order.STATUS}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <button
                          className="bg-olive-500 text-white px-3 py-1 rounded-md hover:bg-olive-700 mr-2"
                          onClick={() => toggleExpand(order.NOMOR_NOTA)}
                        >
                          {expandedOrder === order.NOMOR_NOTA
                            ? "Sembunyikan"
                            : "Lihat Detail"}
                        </button>
                        {order.STATUS === "Sedang Dikemas" && (
                          <button
                            className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-olive-700 mr-2"
                            onClick={() => handleSchedule(order)}
                          >
                            Jadwalkan{" "}
                            {order.METODE_PENGIRIMAN.toLowerCase() === "dikirim"
                              ? "Pengiriman"
                              : "Pengambilan"}
                          </button>
                        )}
                        {order.STATUS === "Siap Diambil" && (
                          <button
                            className="bg-olive-500 text-white px-3 py-1 rounded-md hover:bg-olive-700"
                            onClick={() => handleConfirmPickup(order)}
                          >
                            Konfirmasi Pengambilan
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedOrder === order.NOMOR_NOTA && (
                      <tr>
                        <td colSpan="9" className="px-6 py-4 bg-gray-50">
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-semibold">
                                Detail Barang
                              </h3>
                              {
                                <button
                                  className="bg-olive-500 text-white px-3 py-1 rounded-md hover:bg-olive-700 flex items-center"
                                  onClick={() => handlePrintReceipt(order)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Cetak Nota PDF
                                </button>
                              }
                            </div>
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr>
                                  {[
                                    "Kode Barang",
                                    "Nama Barang",
                                    "Nama Penitip",
                                    "Harga Barang",
                                    "Aksi",
                                  ].map((header) => (
                                    <th
                                      key={header}
                                      className="px-4 py-2 text-sm font-medium text-gray-700 uppercase tracking-wider"
                                    >
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {order.ITEMS.map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm">
                                      {item.KODE_BARANG}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {item.NAMA_BARANG}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {item.NAMA_PENITIP}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {formatCurrency(item.HARGA)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      <button
                                        className="bg-olive-500 text-white px-3 py-1 rounded-md hover:bg-olive-700"
                                        onClick={() =>
                                          handleViewProductDetails(
                                            item.KODE_BARANG
                                          )
                                        }
                                      >
                                        Lihat Detail Barang
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {(order.METODE_PENGIRIMAN.toLowerCase() ===
                              "dikirim" ||
                              (order.METODE_PENGIRIMAN.toLowerCase() ===
                                "diambil sendiri" &&
                                order.SCHEDULE_DETAILS)) && (
                              <div className="mt-4">
                                <h3 className="text-lg font-semibold mb-2">
                                  {order.METODE_PENGIRIMAN.toLowerCase() ===
                                  "dikirim"
                                    ? "Detail Pengiriman"
                                    : "Detail Pengambilan"}
                                </h3>
                                <div className="text-sm text-gray-600">
                                  {order.METODE_PENGIRIMAN.toLowerCase() ===
                                    "dikirim" &&
                                    order.ALAMAT_PENGIRIMAN &&
                                    order.ALAMAT_PENGIRIMAN !== "-" && (
                                      <p>
                                        <strong>Alamat Pengiriman:</strong>{" "}
                                        {order.ALAMAT_PENGIRIMAN}
                                      </p>
                                    )}
                                  {order.STATUS !== "Sedang Dikemas" &&
                                    order.SCHEDULE_DETAILS && (
                                      <>
                                        <p>
                                          <strong>Jadwal:</strong>{" "}
                                          {new Date(
                                            `${order.SCHEDULE_DETAILS.scheduleDate}T${order.SCHEDULE_DETAILS.session}:00`
                                          ).toLocaleString("id-ID", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                          })}
                                        </p>
                                        {order.METODE_PENGIRIMAN.toLowerCase() ===
                                          "dikirim" &&
                                          order.SCHEDULE_DETAILS.courier && (
                                            <p>
                                              <strong>Nama Kurir:</strong>{" "}
                                              {order.SCHEDULE_DETAILS.courier}
                                            </p>
                                          )}
                                      </>
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada pesanan yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsScheduleModalOpen(false);
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-1/3">
            <h2 className="text-xl font-bold mb-4">
              Jadwalkan{" "}
              {selectedOrder.METODE_PENGIRIMAN.toLowerCase() === "dikirim"
                ? "Pengiriman"
                : "Pengambilan"}
            </h2>
            <form onSubmit={handleScheduleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Waktu Transaksi
                </label>
                <p className="text-sm text-gray-600">
                  {new Date(selectedOrder.WAKTU_TRANSAKSI).toLocaleString(
                    "id-ID",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Tanggal{" "}
                  {selectedOrder.METODE_PENGIRIMAN.toLowerCase() === "dikirim"
                    ? "Pengiriman"
                    : "Pengambilan"}
                </label>
                <p className="text-sm text-gray-600">
                  {new Date(
                    getScheduleDate(selectedOrder.WAKTU_TRANSAKSI)
                  ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Pilih Sesi <span className="text-red-500">*</span>
                </label>
                <select
                  name="session"
                  value={scheduleForm.session}
                  onChange={handleScheduleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500"
                  required
                >
                  <option value="" disabled>
                    Pilih Jadwal
                  </option>
                  {sessions[
                    selectedOrder.METODE_PENGIRIMAN.toLowerCase() === "dikirim"
                      ? "dikirim"
                      : "Diambil Sendiri"
                  ].map((session) => (
                    <option
                      key={session.value}
                      value={session.value}
                      disabled={isSessionDisabled(
                        session.value,
                        getScheduleDate(selectedOrder.WAKTU_TRANSAKSI)
                      )}
                    >
                      {session.label}
                    </option>
                  ))}
                </select>
              </div>
              {selectedOrder.METODE_PENGIRIMAN.toLowerCase() === "dikirim" && (
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium mb-1">
                    Pilih Kurir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Cari nama kurir..."
                    value={courierSearch}
                    onChange={handleCourierSearch}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500"
                  />
                  {courierSearch && (
                    <div className="absolute left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto z-50">
                      {filteredCouriers.map((courier) => (
                        <div
                          key={courier}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectCourier(courier)}
                        >
                          {courier}
                        </div>
                      ))}
                    </div>
                  )}
                  {scheduleForm.courier && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {scheduleForm.courier}
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded-md mr-2 hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-olive-500 text-white px-4 py-2 rounded-md hover:bg-olive-500"
                >
                  Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {isProductModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsProductModalOpen(false);
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-3/4">
            <h2 className="text-xl font-bold mb-4">Detail Barang</h2>
            <div className="grid grid-cols-12 gap-4">
              {/* Left Column: Photo Gallery */}
              <div className="col-span-7">
                <div className="grid grid-cols-12 gap-2">
                  <div className="grid grid-rows-3 col-span-3 gap-4">
                    {productImages.map((image, index) => (
                      <div
                        key={index}
                        className="rounded-lg overflow-hidden cursor-pointer hover:shadow-lg justify-center items-center h-full flex"
                        onClick={() => changeMainImage(image)}
                      >
                        <img
                          src={image}
                          className="h-full object-fill"
                          alt={`Thumbnail ${index + 1}`}
                          onError={(e) =>
                            (e.target.src = "/api/placeholder/60/60")
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg col-span-9 pl-3">
                    <img
                      src={currentImage}
                      alt={selectedProduct.name || "Product Image"}
                      className="w-auto h-full object-fill rounded-md"
                      onError={(e) => (e.target.src = "/api/placeholder/60/60")}
                    />
                  </div>
                </div>
              </div>
              {/* Right Column: Product Details */}
              <div className="col-span-5">
                <div className="py-4">
                  <div className="flex w-auto">
                    <div className="py-2 px-3 mr-2 bg-olive-300 text-olive-500 rounded-2xl">
                      {selectedProduct.category || "Kategori"}
                    </div>
                  </div>
                  <h1 className="mt-3 text-3xl font-bold">
                    {selectedProduct.name || "Unknown Product"}
                  </h1>
                  <p className="mt-5 text-xl">
                    Kondisi: {selectedProduct.condition || "Tidak Diketahui"}
                  </p>
                  <p className="mt-5 text-xl">
                    Berat:{" "}
                    {selectedProduct.weight
                      ? `${selectedProduct.weight} KG`
                      : "Tidak Diketahui"}
                  </p>
                  <p className="mt-5 text-xl">
                    Garansi:{" "}
                    {selectedProduct.warranty_date
                      ? new Date(
                          selectedProduct.warranty_date
                        ).toLocaleDateString("id-ID")
                      : "Tidak Ada"}
                  </p>
                  <p className="mt-5 text-xl text-justify">
                    Deskripsi:{" "}
                    {selectedProduct.description ||
                      "Tidak ada deskripsi tersedia."}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default ManageOrderList;
