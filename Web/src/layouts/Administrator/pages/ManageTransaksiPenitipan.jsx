import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { generateReceiptPenitipanPDF } from "./ReceiptPenitipanPDFGenerator";

const ManageTransaksiPenitipan = () => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString("id-ID", {
      month: "long",
    })} ${date.getFullYear()} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const [transaksiPenitipans, setTransaksiPenitipans] = useState([]);
  const [penitips, setPenitips] = useState([]);
  const [hunters, setHunters] = useState([]);
  const [qcEmployees, setQcEmployees] = useState([]);
  const [kategoris, setKategoris] = useState([]);
  const [subkategoriByKategori, setSubkategoriByKategori] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [penitipSearch, setPenitipSearch] = useState("");
  const [hunterSearch, setHunterSearch] = useState("");
  const [qcSearch, setQcSearch] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("NO_NOTA_PENITIPAN");
  const [sortDirection, setSortDirection] = useState("asc");

  const [transaksiPenitipan, setTransaksiPenitipan] = useState({
    ID_PENITIPAN: "",
    ID_PENITIP: "",
    NAMA_PENITIP: "",
    ID_PEGAWAI_HUNTER: "",
    NAMA_PEGAWAI_HUNTER: "",
    ID_PEGAWAI_QC: "",
    NAMA_PEGAWAI_QC: "",
    CATATAN: "",
    BARANG_TITIPAN: [
      {
        KODE_PRODUK: "",
        NAMA: "",
        ID_SUBKATEGORI: "",
        ID_KATEGORI: "",
        NAMA_KATEGORI: "",
        HARGA_JUAL: "",
        BERAT: "",
        KONDISI: "",
        TANGGAL_GARANSI: "",
        DESKRIPSI: "",
        FOTOS: [null, null, null],
        IS_UTAMA_INDEX: 0,
        EXISTING_FOTOS: [],
      },
    ],
  });

  const [expandedTransaksi, setExpandedTransaksi] = useState(null);
  const [barangTitipans, setBarangTitipans] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [productImages, setProductImages] = useState([]);

  const sortOptions = [
    { value: "ID_PENITIPAN", label: "ID" },
    { value: "NAMA_PENITIP", label: "Nama Penitip" },
    { value: "NAMA_PEGAWAI_HUNTER", label: "Nama Hunter" },
    { value: "NAMA_PEGAWAI_QC", label: "Nama QC" },
    { value: "NO_NOTA_PENITIPAN", label: "No Nota" },
    { value: "TANGGAL_PENITIPAN", label: "Tanggal" },
    { value: "TOTAL_NILAI_BARANG", label: "Total Nilai" },
    { value: "CATATAN", label: "Catatan" },
  ];

  useEffect(() => {
    fetchTransaksiPenitipans();
    fetchPenitips();
    fetchHunters();
    fetchQcEmployees();
    fetchKategoris();
  }, []);

  const fetchTransaksiPenitipans = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        "http://localhost:8000/api/gudang/manage-transaksi-penitipan",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Transaksi Penitipan API Response:", response.data);
      setTransaksiPenitipans(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (error) {
      setError(`Failed to fetch transactions: ${error.message}`);
      console.error("Fetch Transaksi Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async (transaksi) => {
    console.log("Transaksi Data for PDF:", transaksi);
    let alamat = transaksi.ALAMAT_PENITIP || "-";

    // Fetch ALAMAT from penitip API if not present in transaksi
    if (alamat === "-") {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          `http://localhost:8000/api/gudang/manage-penitip/${transaksi.ID_PENITIP}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        alamat = response.data.ALAMAT || "-";
        console.log(
          "Fetched ALAMAT for ID_PENITIP:",
          transaksi.ID_PENITIP,
          alamat
        );
      } catch (error) {
        console.error("Failed to fetch penitip ALAMAT:", error);
        toast.error(`Gagal mengambil alamat penitip: ${error.message}`);
      }
    }

    const orderData = {
      NO_NOTA_PENITIPAN: transaksi.NO_NOTA_PENITIPAN,
      ID_PENITIP: transaksi.ID_PENITIP,
      NAMA_PENITIP: transaksi.NAMA_PENITIP,
      ALAMAT: alamat,
      TANGGAL_PENITIPAN: transaksi.TANGGAL_PENITIPAN,
      TANGGAL_KADALUARSA: new Date(
        new Date(transaksi.TANGGAL_PENITIPAN).getTime() +
          30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      NAMA_PEGAWAI_QC: transaksi.NAMA_PEGAWAI_QC,
      ID_PEGAWAI_QC: transaksi.ID_PEGAWAI_QC,
      BARANG_TITIPAN: barangTitipans,
    };
    generateReceiptPenitipanPDF(orderData, toast)
      .then(() => {
        console.log("PDF generated successfully");
      })
      .catch((err) => {
        console.error("PDF generation failed:", err);
      });
  };

  const fetchPenitips = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        "http://localhost:8000/api/gudang/manage-penitip",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setPenitips(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setError(`Failed to fetch penitips: ${error.message}`);
    }
  };

  const fetchHunters = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        "http://localhost:8000/api/gudang/employees/hunter",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setHunters(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setError(`Failed to fetch hunters: ${error.message}`);
    }
  };

  const fetchQcEmployees = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        "http://localhost:8000/api/gudang/employees/gudang",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setQcEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setError(`Failed to fetch QC employees: ${error.message}`);
    }
  };

  const fetchKategoris = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/categories", {
        headers: { Accept: "application/json" },
      });
      const categories = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      console.log("Fetched categories:", categories);
      setKategoris(categories);
    } catch (error) {
      setError(`Failed to fetch kategoris: ${error.message}`);
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubkategoris = async (idKategori) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/categories/${idKategori}/subcategories`,
        { headers: { Accept: "application/json" } }
      );
      setSubkategoriByKategori((prev) => ({
        ...prev,
        [idKategori]: Array.isArray(response.data.data)
          ? response.data.data
          : [],
      }));
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      setError(`Failed to fetch subkategoris: ${error.message}`);
      return [];
    }
  };

  const fetchBarangTitipan = async (idPenitipan) => {
    console.log("Fetching barang for ID_PENITIPAN:", idPenitipan);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        "http://localhost:8000/api/gudang/barang-titipan",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      console.log("API Response:", response.data);
      const filteredBarang = response.data.data.filter(
        (item) => String(item.id_penitipan) === String(idPenitipan)
      );
      console.log("Filtered Barang:", filteredBarang);
      setBarangTitipans(filteredBarang);
    } catch (error) {
      console.error("Fetch Error:", error);
      setError(`Failed to fetch barang titipan: ${error.message}`);
      toast.error(`Failed to fetch barang titipan: ${error.message}`);
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
      setIsProductModalOpen(true);
    } catch (error) {
      toast.error(`Failed to fetch product details: ${error.message}`);
    }
  };

  const fetchBarangTitipanForEdit = async (idPenitipan) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `http://localhost:8000/api/gudang/manage-transaksi-penitipan/${idPenitipan}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      console.log("API Response:", response.data);

      if (!response.data.data || !response.data.data.barang_titipan) {
        console.error("No barang_titipan found for ID:", idPenitipan);
        return [];
      }

      const barangTitipan = response.data.data.barang_titipan;
      return await Promise.all(
        barangTitipan.map(async (item) => {
          try {
            const subkategoriResponse = await axios.get(
              `http://localhost:8000/api/subcategories/${item.ID_SUBKATEGORI}`,
              { headers: { Accept: "application/json" } }
            );
            const subkategori = subkategoriResponse.data.data;

            const kategoriResponse = await axios.get(
              `http://localhost:8000/api/categories/${subkategori.ID_KATEGORI}`,
              { headers: { Accept: "application/json" } }
            );
            const kategori = kategoriResponse.data.data;

            await fetchSubkategoris(subkategori.ID_KATEGORI);

            const photos = item.foto_produk || [];
            const isUtamaIndex =
              photos.findIndex((photo) => photo.IS_UTAMA) >= 0
                ? photos.findIndex((photo) => photo.IS_UTAMA)
                : 0;

            return {
              KODE_PRODUK: item.KODE_PRODUK || "",
              NAMA: item.NAMA || "",
              ID_SUBKATEGORI: item.ID_SUBKATEGORI || "",
              ID_KATEGORI: subkategori.ID_KATEGORI || "",
              NAMA_KATEGORI: kategori.NAMA || "",
              HARGA_JUAL: item.HARGA_JUAL || "",
              BERAT: item.BERAT || "",
              KONDISI: item.KONDISI || "",
              TANGGAL_GARANSI: item.TANGGAL_GARANSI
                ? new Date(item.TANGGAL_GARANSI).toISOString().split("T")[0]
                : "",
              DESKRIPSI: item.DESKRIPSI || "",
              FOTOS: [null, null, null],
              EXISTING_FOTOS: photos.map((photo) => ({
                url: photo.URL_FOTO
                  ? `http://localhost:8000/storage/${photo.URL_FOTO}`
                  : "/api/placeholder/60/60",
                is_utama: photo.IS_UTAMA,
              })),
              IS_UTAMA_INDEX: isUtamaIndex,
            };
          } catch (err) {
            console.error(`Error processing barang ${item.KODE_PRODUK}:`, err);
            return null;
          }
        })
      ).then((results) => results.filter((item) => item !== null));
    } catch (error) {
      console.error("Fetch barang titipan error:", error);
      setError(`Failed to fetch barang titipan for edit: ${error.message}`);
      toast.error(`Failed to fetch barang titipan for edit: ${error.message}`);
      return [];
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handlePenitipSearch = (e) => setPenitipSearch(e.target.value);
  const handleHunterSearch = (e) => setHunterSearch(e.target.value);
  const handleQcSearch = (e) => setQcSearch(e.target.value);

  const handleSortChange = (e) => setSortBy(e.target.value);

  const toggleSortDirection = () =>
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));

  const filteredTransaksi = transaksiPenitipans
    .filter(
      (t) =>
        (t.NAMA_PENITIP || "-")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (t.NAMA_PEGAWAI_HUNTER || "-")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (t.NAMA_PEGAWAI_QC || "-")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (t.NO_NOTA_PENITIPAN || "-")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (t.TANGGAL_PENITIPAN ? formatDate(t.TANGGAL_PENITIPAN) : "-")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "TOTAL_NILAI_BARANG") {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      } else if (sortBy === "TANGGAL_PENITIPAN") {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      } else if (sortBy === "ID_PENITIPAN") {
        aValue = parseInt(aValue || 0);
        bValue = parseInt(bValue || 0);
      } else {
        aValue = (aValue || "-").toString().toLowerCase();
        bValue = (bValue || "-").toString().toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const filteredPenitips = penitips.filter((p) =>
    p.NAMA?.toLowerCase().includes(penitipSearch.toLowerCase())
  );
  const filteredHunters = hunters.filter((h) =>
    h.NAMA?.toLowerCase().includes(hunterSearch.toLowerCase())
  );
  const filteredQcEmployees = qcEmployees.filter((q) =>
    q.NAMA?.toLowerCase().includes(qcSearch.toLowerCase())
  );

  const selectPenitip = (penitip) => {
    setTransaksiPenitipan({
      ...transaksiPenitipan,
      ID_PENITIP: penitip.ID_PENITIP,
      NAMA_PENITIP: penitip.NAMA,
    });
    setPenitipSearch("");
  };

  const selectHunter = (hunter) => {
    setTransaksiPenitipan({
      ...transaksiPenitipan,
      ID_PEGAWAI_HUNTER: hunter.ID_PEGAWAI,
      NAMA_PEGAWAI_HUNTER: hunter.NAMA,
    });
    setHunterSearch("");
  };

  const selectQcEmployee = (qc) => {
    setTransaksiPenitipan({
      ...transaksiPenitipan,
      ID_PEGAWAI_QC: qc.ID_PEGAWAI,
      NAMA_PEGAWAI_QC: qc.NAMA,
    });
    setQcSearch("");
  };

  const handleInputChange = async (e, barangIndex = null) => {
    const { name, value, files } = e.target;
    if (barangIndex !== null) {
      const newBarangTitipan = [...transaksiPenitipan.BARANG_TITIPAN];
      if (name.startsWith("FOTO_")) {
        const fotoIndex = parseInt(name.split("_")[1]);
        newBarangTitipan[barangIndex].FOTOS[fotoIndex] = files
          ? files[0]
          : null;
        newBarangTitipan[barangIndex].EXISTING_FOTOS = [];
      } else if (name.startsWith("IS_UTAMA_INDEX_")) {
        newBarangTitipan[barangIndex].IS_UTAMA_INDEX = parseInt(value);
      } else if (name === "ID_SUBKATEGORI") {
        newBarangTitipan[barangIndex][name] = value;
        try {
          const subkategoriResponse = await axios.get(
            `http://localhost:8000/api/subcategories/${value}`,
            { headers: { Accept: "application/json" } }
          );
          const subkategori = subkategoriResponse.data.data;
          const kategoriResponse = await axios.get(
            `http://localhost:8000/api/categories/${subkategori.ID_KATEGORI}`,
            { headers: { Accept: "application/json" } }
          );
          const kategori = kategoriResponse.data.data;
          newBarangTitipan[barangIndex].ID_KATEGORI = subkategori.ID_KATEGORI;
          newBarangTitipan[barangIndex].NAMA_KATEGORI = kategori.NAMA;
        } catch (error) {
          console.error("Failed to fetch category data:", error);
        }
      } else {
        newBarangTitipan[barangIndex][name] = value;
      }
      setTransaksiPenitipan({
        ...transaksiPenitipan,
        BARANG_TITIPAN: newBarangTitipan,
      });
    } else {
      setTransaksiPenitipan({ ...transaksiPenitipan, [name]: value });
    }
  };

  const addBarangTitipan = () => {
    setTransaksiPenitipan({
      ...transaksiPenitipan,
      BARANG_TITIPAN: [
        ...transaksiPenitipan.BARANG_TITIPAN,
        {
          KODE_PRODUK: "",
          NAMA: "",
          ID_SUBKATEGORI: "",
          ID_KATEGORI: "",
          NAMA_KATEGORI: "",
          HARGA_JUAL: "",
          BERAT: "",
          KONDISI: "",
          TANGGAL_GARANSI: "",
          DESKRIPSI: "",
          FOTOS: [null, null, null],
          IS_UTAMA_INDEX: 0,
          EXISTING_FOTOS: [],
        },
      ],
    });
  };

  const removeBarangTitipan = (index) => {
    if (transaksiPenitipan.BARANG_TITIPAN.length === 1) {
      setError("Minimal satu barang titipan diperlukan.");
      return;
    }
    const newBarangTitipan = transaksiPenitipan.BARANG_TITIPAN.filter(
      (_, i) => i !== index
    );
    setTransaksiPenitipan({
      ...transaksiPenitipan,
      BARANG_TITIPAN: newBarangTitipan,
    });
  };

  const validateForm = () => {
    if (!transaksiPenitipan.ID_PENITIP) return "Nama Penitip diperlukan.";
    if (!transaksiPenitipan.ID_PEGAWAI_QC) return "Nama Pegawai QC diperlukan.";

    for (let i = 0; i < transaksiPenitipan.BARANG_TITIPAN.length; i++) {
      const barang = transaksiPenitipan.BARANG_TITIPAN[i];
      if (!barang.NAMA) return `Nama Barang untuk Barang ${i + 1} diperlukan.`;
      if (!barang.ID_KATEGORI)
        return `Kategori untuk Barang ${i + 1} diperlukan.`;
      if (!barang.ID_SUBKATEGORI)
        return `Subkategori untuk Barang ${i + 1} diperlukan.`;
      if (!barang.HARGA_JUAL || isNaN(barang.HARGA_JUAL))
        return `Harga Jual untuk Barang ${i + 1} harus berupa angka valid.`;
      if (!barang.BERAT || isNaN(barang.BERAT))
        return `Berat untuk Barang ${i + 1} harus berupa angka valid.`;
      if (!barang.KONDISI) return `Kondisi untuk Barang ${i + 1} diperlukan.`;
      if (!barang.DESKRIPSI)
        return `Deskripsi untuk Barang ${i + 1} diperlukan.`;
      if (modalMode === "add" && !barang.FOTOS.every((foto) => foto))
        return `Semua foto (3) diperlukan untuk Barang ${i + 1}.`;
      if (
        modalMode === "edit" &&
        !barang.FOTOS.every((foto) => foto) &&
        !barang.EXISTING_FOTOS.length
      )
        return `Semua foto (3) diperlukan untuk Barang ${
          i + 1
        } jika tidak ada foto yang sudah ada.`;
    }
    return null;
  };

  const openModal = async (mode, data = null) => {
    setModalMode(mode);
    if (mode === "edit" && data) {
      const barangTitipanData = await fetchBarangTitipanForEdit(
        data.ID_PENITIPAN
      );
      console.log("Barang Titipan Data:", barangTitipanData);
      setTransaksiPenitipan({
        ID_PENITIPAN: data.ID_PENITIPAN,
        ID_PENITIP: data.ID_PENITIP || "",
        NAMA_PENITIP:
          penitips.find((p) => p.ID_PENITIP === data.ID_PENITIP)?.NAMA || "",
        ID_PEGAWAI_HUNTER: data.ID_PEGAWAI_HUNTER || "",
        NAMA_PEGAWAI_HUNTER:
          hunters.find((h) => h.ID_PEGAWAI === data.ID_PEGAWAI_HUNTER)?.NAMA ||
          "",
        ID_PEGAWAI_QC: data.ID_PEGAWAI_QC || "",
        NAMA_PEGAWAI_QC:
          qcEmployees.find((q) => q.ID_PEGAWAI === data.ID_PEGAWAI_QC)?.NAMA ||
          "",
        CATATAN: data.CATATAN || "",
        BARANG_TITIPAN:
          barangTitipanData.length > 0
            ? barangTitipanData
            : [
                {
                  KODE_PRODUK: "",
                  NAMA: "",
                  ID_SUBKATEGORI: "",
                  ID_KATEGORI: "",
                  NAMA_KATEGORI: "",
                  HARGA_JUAL: "",
                  BERAT: "",
                  KONDISI: "",
                  TANGGAL_GARANSI: "",
                  DESKRIPSI: "",
                  FOTOS: [null, null, null],
                  IS_UTAMA_INDEX: 0,
                  EXISTING_FOTOS: [],
                },
              ],
      });
    } else {
      setTransaksiPenitipan({
        ID_PENITIPAN: "",
        ID_PENITIP: "",
        NAMA_PENITIP: "",
        ID_PEGAWAI_HUNTER: "",
        NAMA_PEGAWAI_HUNTER: "",
        ID_PEGAWAI_QC: "",
        NAMA_PEGAWAI_QC: "",
        CATATAN: "",
        BARANG_TITIPAN: [
          {
            KODE_PRODUK: "",
            NAMA: "",
            ID_SUBKATEGORI: "",
            ID_KATEGORI: "",
            NAMA_KATEGORI: "",
            HARGA_JUAL: "",
            BERAT: "",
            KONDISI: "",
            TANGGAL_GARANSI: "",
            DESKRIPSI: "",
            FOTOS: [null, null, null],
            IS_UTAMA_INDEX: 0,
            EXISTING_FOTOS: [],
          },
        ],
      });
    }
    console.log(
      "EXISTING_FOTOS:",
      transaksiPenitipan.BARANG_TITIPAN[0].EXISTING_FOTOS
    );
    setPenitipSearch("");
    setHunterSearch("");
    setQcSearch("");
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const result = await Swal.fire({
      title: `Konfirmasi ${modalMode === "add" ? "Tambah" : "Edit"} Transaksi`,
      text: `Apakah Anda yakin ingin ${
        modalMode === "add" ? "menambah" : "mengedit"
      } transaksi ini?`,
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

    const token = localStorage.getItem("token");
    const url =
      modalMode === "add"
        ? "http://localhost:8000/api/gudang/manage-transaksi-penitipan"
        : `http://localhost:8000/api/gudang/manage-transaksi-penitipan/${transaksiPenitipan.ID_PENITIPAN}`;

    const formData = new FormData();
    formData.append("ID_PENITIP", transaksiPenitipan.ID_PENITIP);
    formData.append("ID_PEGAWAI_HUNTER", transaksiPenitipan.ID_PEGAWAI_HUNTER);
    formData.append("ID_PEGAWAI_QC", transaksiPenitipan.ID_PEGAWAI_QC);
    formData.append("CATATAN", transaksiPenitipan.CATATAN || "");

    if (modalMode === "edit") {
      formData.append("_method", "PUT");
    }

    transaksiPenitipan.BARANG_TITIPAN.forEach((barang, index) => {
      if (modalMode === "edit" && barang.KODE_PRODUK) {
        formData.append(
          `BARANG_TITIPAN[${index}][KODE_PRODUK]`,
          barang.KODE_PRODUK
        );
      }
      formData.append(`BARANG_TITIPAN[${index}][NAMA]`, barang.NAMA);
      formData.append(
        `BARANG_TITIPAN[${index}][ID_SUBKATEGORI]`,
        barang.ID_SUBKATEGORI
      );
      formData.append(
        `BARANG_TITIPAN[${index}][HARGA_JUAL]`,
        barang.HARGA_JUAL
      );
      formData.append(`BARANG_TITIPAN[${index}][BERAT]`, barang.BERAT);
      formData.append(`BARANG_TITIPAN[${index}][KONDISI]`, barang.KONDISI);
      if (barang.TANGGAL_GARANSI) {
        formData.append(
          `BARANG_TITIPAN[${index}][TANGGAL_GARANSI]`,
          barang.TANGGAL_GARANSI
        );
      }
      formData.append(`BARANG_TITIPAN[${index}][DESKRIPSI]`, barang.DESKRIPSI);
      formData.append(
        `BARANG_TITIPAN[${index}][IS_UTAMA_INDEX]`,
        barang.IS_UTAMA_INDEX
      );

      barang.FOTOS.forEach((foto, fotoIndex) => {
        if (foto) {
          formData.append(
            `BARANG_TITIPAN[${index}][FOTOS][${fotoIndex}]`,
            foto
          );
        }
      });
    });

    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      const response = await axios({
        method: "post",
        url,
        data: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        await fetchTransaksiPenitipans();
        setIsModalOpen(false);
        setError("");
        toast.success(
          `Transaksi berhasil ${
            modalMode === "add" ? "ditambahkan" : "diperbarui"
          }!`
        );
      } else {
        throw new Error(response.data.message || "Pembaruan gagal di server");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message);
      setError(
        `Gagal ${
          modalMode === "add" ? "menambah" : "mengedit"
        } transaksi: ${errorMessage}`
      );
      toast.error(
        `Gagal ${
          modalMode === "add" ? "menambah" : "mengedit"
        } transaksi: ${errorMessage}`
      );
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Konfirmasi Hapus Transaksi",
      text: `Apakah Anda yakin ingin menghapus transaksi dengan ID ${id}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `http://localhost:8000/api/gudang/manage-transaksi-penitipan/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setTransaksiPenitipans(
        transaksiPenitipans.filter((tr) => tr.ID_PENITIPAN !== id)
      );
      toast.success("Transaksi berhasil dihapus!");
    } catch (error) {
      setError(`Failed to delete transaction: ${error.message}`);
      toast.error(`Failed to delete transaction: ${error.message}`);
    }
  };

  const toggleExpandBarang = (idPenitipan) => {
    if (expandedTransaksi === idPenitipan) {
      setExpandedTransaksi(null);
      setBarangTitipans([]);
    } else {
      setExpandedTransaksi(idPenitipan);
      fetchBarangTitipan(idPenitipan);
    }
  };

  const handleViewProductDetails = (kodeBarang) => {
    fetchProductDetails(kodeBarang);
  };

  const changeMainImage = (newSrc) => {
    setCurrentImage(newSrc);
  };

  const isWarrantyActive = (warrantyDate) => {
    if (!warrantyDate) return false;
    const currentDate = new Date();
    const warranty = new Date(warrantyDate);
    return currentDate <= warranty;
  };

  const getMinDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-10 text-gray-800">
        Manage Transaksi Penitipan
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari (nota, penitip, hunter, QC, tanggal)..."
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
        <button
          onClick={() => openModal("add")}
          className="bg-olive-500 text-white px-4 py-3 text-md rounded-md hover:bg-olive-700 transition"
        >
          + Tambah Transaksi
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow mt-10">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {[
                  "ID",
                  "Nama Penitip",
                  "Nama Hunter",
                  "Nama QC",
                  "No Nota",
                  "Tanggal",
                  "Total Nilai",
                  "Catatan",
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
              {filteredTransaksi.map((t) => (
                <React.Fragment key={t.ID_PENITIPAN}>
                  <tr>
                    <td className="px-6 py-4 text-sm">{t.ID_PENITIPAN}</td>
                    <td className="px-6 py-4 text-sm">
                      {t.NAMA_PENITIP || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {t.NAMA_PEGAWAI_HUNTER || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {t.NAMA_PEGAWAI_QC || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">{t.NO_NOTA_PENITIPAN}</td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(t.TANGGAL_PENITIPAN)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {t.TOTAL_NILAI_BARANG
                        ? `Rp${parseInt(t.TOTAL_NILAI_BARANG).toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">{t.CATATAN}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        <button
                          className=" text-blue-500 hover:text-white px-3 py-1 rounded-md hover:bg-blue-700"
                          onClick={() => openModal("edit", t)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500  px-2 rounded-md hover:bg-red-600 hover:text-white"
                          onClick={() => handleDelete(t.ID_PENITIPAN)}
                        >
                          Delete
                        </button>
                        <button
                          className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                          onClick={() => toggleExpandBarang(t.ID_PENITIPAN)}
                        >
                          {expandedTransaksi === t.ID_PENITIPAN
                            ? "Sembunyikan"
                            : "Lihat Barang"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedTransaksi === t.ID_PENITIPAN && (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 bg-gray-50">
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                              Daftar Barang Titipan
                            </h3>
                            <button
                              className="bg-olive-500 text-white px-3 py-1 rounded-md hover:bg-olive-700 flex items-center"
                              onClick={() => handlePrintReceipt(t)}
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
                          </div>
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                {[
                                  "Kode Barang",
                                  "Nama Barang",
                                  "Harga Jual",
                                  "Tanggal Kadaluarsa",
                                  "Tanggal Garansi",
                                  "Status Barang",
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
                              {barangTitipans.length > 0 ? (
                                barangTitipans.map((item) => (
                                  <tr key={item.kode_barang}>
                                    <td className="px-4 py-2 text-sm">
                                      {item.kode_barang}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {item.nama}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {item.harga_jual}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {item.tanggal_kadaluarsa !== "-"
                                        ? formatDate(item.tanggal_kadaluarsa)
                                        : "-"}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {item.tanggal_garansi !== "-"
                                        ? formatDate(item.tanggal_garansi)
                                        : "-"}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      <span
                                        className={`px-2 py-1 text-xs rounded-full ${
                                          item.status_barang === "Tersedia"
                                            ? "bg-green-100 text-green-800"
                                            : item.status_barang ===
                                              "Kadaluarsa"
                                            ? "bg-red-100 text-red-800"
                                            : item.status_barang ===
                                              "Didonasikan"
                                            ? "bg-blue-100 text-blue-800"
                                            : item.status_barang ===
                                              "Siap Diambil Kembali"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {item.status_barang}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      <button
                                        className="bg-olive-500 text-white px-3 py-1 rounded-md hover:bg-olive-700"
                                        onClick={() =>
                                          handleViewProductDetails(
                                            item.kode_barang
                                          )
                                        }
                                      >
                                        Lihat Detail
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan="7"
                                    className="px-4 py-2 text-sm text-center text-gray-500"
                                  >
                                    Tidak ada barang titipan ditemukan
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg w-3/4 max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {modalMode === "add" ? "Tambah" : "Edit"} Transaksi Penitipan
            </h2>
            <form className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  Detail Transaksi
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-gray-600">
                      Nama Penitip
                    </label>
                    <input
                      type="text"
                      placeholder="Cari Penitip..."
                      value={penitipSearch || transaksiPenitipan.NAMA_PENITIP}
                      onChange={handlePenitipSearch}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                    />
                    {penitipSearch && filteredPenitips.length > 0 && (
                      <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredPenitips.map((p) => (
                          <li
                            key={p.ID_PENITIP}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectPenitip(p)}
                          >
                            {p.NAMA}
                          </li>
                        ))}
                      </ul>
                    )}
                    {transaksiPenitipan.NAMA_PENITIP && (
                      <p className="text-sm text-gray-600 mt-1">
                        Terpilih: {transaksiPenitipan.NAMA_PENITIP}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-gray-600">
                      Nama Pegawai Hunter
                    </label>
                    <input
                      type="text"
                      placeholder="Cari Hunter..."
                      value={
                        hunterSearch || transaksiPenitipan.NAMA_PEGAWAI_HUNTER
                      }
                      onChange={handleHunterSearch}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                    />
                    {hunterSearch && filteredHunters.length > 0 && (
                      <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredHunters.map((h) => (
                          <li
                            key={h.ID_PEGAWAI}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectHunter(h)}
                          >
                            {h.NAMA}
                          </li>
                        ))}
                      </ul>
                    )}
                    {transaksiPenitipan.NAMA_PEGAWAI_HUNTER && (
                      <p className="text-sm text-gray-600 mt-1">
                        Terpilih: {transaksiPenitipan.NAMA_PEGAWAI_HUNTER}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-gray-600">
                      Nama Pegawai QC
                    </label>
                    <input
                      type="text"
                      placeholder="Cari Pegawai QC..."
                      value={qcSearch || transaksiPenitipan.NAMA_PEGAWAI_QC}
                      onChange={handleQcSearch}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                    />
                    {qcSearch && filteredQcEmployees.length > 0 && (
                      <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredQcEmployees.map((q) => (
                          <li
                            key={q.ID_PEGAWAI}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectQcEmployee(q)}
                          >
                            {q.NAMA}
                          </li>
                        ))}
                      </ul>
                    )}
                    {transaksiPenitipan.NAMA_PEGAWAI_QC && (
                      <p className="text-sm text-gray-600 mt-1">
                        Terpilih: {transaksiPenitipan.NAMA_PEGAWAI_QC}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-600">
                      Catatan
                    </label>
                    <textarea
                      name="CATATAN"
                      value={transaksiPenitipan.CATATAN}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 text-sm shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  Barang Dititipkan
                </h3>
                {transaksiPenitipan.BARANG_TITIPAN.map((barang, index) => (
                  <div
                    key={index}
                    className="border p-4 mb-4 rounded-lg bg-gray-50 shadow-sm relative"
                  >
                    <h4 className="text-md font-medium mb-3 text-gray-600">
                      Barang {index + 1}
                    </h4>
                    {transaksiPenitipan.BARANG_TITIPAN.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBarangTitipan(index)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-600"
                      >
                        Hapus
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {modalMode === "edit" && barang.KODE_PRODUK && (
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-600">
                            Kode Produk
                          </label>
                          <input
                            type="text"
                            name="KODE_PRODUK"
                            value={barang.KODE_PRODUK}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 shadow-sm"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                          Nama Barang
                        </label>
                        <input
                          type="text"
                          name="NAMA"
                          value={barang.NAMA}
                          onChange={(e) => handleInputChange(e, index)}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                          Kategori
                        </label>
                        <select
                          value={barang.ID_KATEGORI}
                          onChange={(e) => {
                            const selectedKategoriId = e.target.value;
                            const selectedKategori = kategoris.find(
                              (k) => k.ID_KATEGORI === selectedKategoriId
                            );
                            const newBarangTitipan = [
                              ...transaksiPenitipan.BARANG_TITIPAN,
                            ];
                            newBarangTitipan[index].ID_KATEGORI =
                              selectedKategoriId;
                            newBarangTitipan[index].ID_SUBKATEGORI = "";
                            newBarangTitipan[index].NAMA_KATEGORI =
                              selectedKategori?.NAMA || "";
                            console.log(
                              "Selected NAMA_KATEGORI:",
                              newBarangTitipan[index].NAMA_KATEGORI
                            );
                            if (
                              newBarangTitipan[index].NAMA_KATEGORI !==
                              "Elektronik & Gadget"
                            ) {
                              newBarangTitipan[index].TANGGAL_GARANSI = "";
                            }
                            setTransaksiPenitipan({
                              ...transaksiPenitipan,
                              BARANG_TITIPAN: newBarangTitipan,
                            });
                            if (selectedKategoriId)
                              fetchSubkategoris(selectedKategoriId);
                          }}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                        >
                          <option value="">Pilih Kategori</option>
                          {kategoris.map((k) => (
                            <option key={k.ID_KATEGORI} value={k.ID_KATEGORI}>
                              {k.NAMA}
                            </option>
                          ))}
                        </select>
                        {barang.NAMA_KATEGORI && (
                          <p className="text-sm text-gray-600 mt-1">
                            Terpilih: {barang.NAMA_KATEGORI}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                          Subkategori
                        </label>
                        <select
                          value={barang.ID_SUBKATEGORI}
                          onChange={(e) => handleInputChange(e, index)}
                          name="ID_SUBKATEGORI"
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                          disabled={!barang.ID_KATEGORI}
                        >
                          <option value="">Pilih Subkategori</option>
                          {(
                            subkategoriByKategori[barang.ID_KATEGORI] || []
                          ).map((s) => (
                            <option
                              key={s.ID_SUBKATEGORI}
                              value={s.ID_SUBKATEGORI}
                            >
                              {s.NAMASUB}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                          Harga Jual
                        </label>
                        <input
                          type="number"
                          name="HARGA_JUAL"
                          value={barang.HARGA_JUAL}
                          onChange={(e) => handleInputChange(e, index)}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                          Berat
                        </label>
                        <input
                          type="number"
                          name="BERAT"
                          value={barang.BERAT}
                          onChange={(e) => handleInputChange(e, index)}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                          Kondisi
                        </label>
                        <input
                          type="text"
                          name="KONDISI"
                          value={barang.KONDISI}
                          onChange={(e) => handleInputChange(e, index)}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                        />
                      </div>
                      {barang.NAMA_KATEGORI === "Elektronik & Gadget" && (
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-600">
                            Tanggal Garansi (Opsional)
                          </label>
                          <input
                            type="date"
                            name="TANGGAL_GARANSI"
                            value={barang.TANGGAL_GARANSI}
                            onChange={(e) => handleInputChange(e, index)}
                            min={getMinDate()}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                          />
                        </div>
                      )}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                          Deskripsi
                        </label>
                        <textarea
                          name="DESKRIPSI"
                          value={barang.DESKRIPSI}
                          onChange={(e) => handleInputChange(e, index)}
                          rows="3"
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 shadow-sm"
                        />
                      </div>
                      {barang.EXISTING_FOTOS?.length > 0 && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium mb-1 text-gray-600">
                            Foto Produk Yang Ada
                          </label>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {barang.EXISTING_FOTOS.map((photo, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={photo.url}
                                  alt={`Existing ${idx}`}
                                  className="w-full h-32 object-cover rounded"
                                  onError={(e) =>
                                    (e.target.src = "/api/placeholder/60/60")
                                  }
                                />
                                {photo.is_utama && (
                                  <span className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded">
                                    Utama
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1 text-gray-600">
                          Foto Produk Baru (Wajib 3 Foto jika mengganti)
                        </label>
                        {[0, 1, 2].map((fotoIndex) => (
                          <div
                            key={fotoIndex}
                            className="flex items-center mb-2"
                          >
                            <input
                              type="file"
                              name={`FOTO_${fotoIndex}`}
                              accept="image/*"
                              onChange={(e) => handleInputChange(e, index)}
                              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                              required={
                                modalMode === "add" ||
                                (modalMode === "edit" &&
                                  barang.FOTOS.some((f) => f))
                              }
                            />
                            <label className="ml-4 text-sm text-gray-600">
                              <input
                                type="radio"
                                name={`IS_UTAMA_INDEX_${index}`}
                                value={fotoIndex}
                                checked={barang.IS_UTAMA_INDEX === fotoIndex}
                                onChange={(e) => handleInputChange(e, index)}
                                disabled={
                                  !barang.FOTOS[fotoIndex] &&
                                  !barang.EXISTING_FOTOS[fotoIndex]
                                }
                                className="mr-1"
                              />
                              Utama
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBarangTitipan}
                  className="bg-olive-500 text-white px-4 py-2 rounded-md hover:bg-olive-500 transition shadow-sm"
                >
                  + Tambah Barang
                </button>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded-md mr-2 hover:bg-gray-400 transition shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-olive-500 text-white px-4 py-2 rounded-md hover:bg-olive-700 transition shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProductModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsProductModalOpen(false);
          }}
        >
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-bold mb-4">Detail Barang</h2>
            <div className="grid grid-cols-12 gap-4">
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
              <div className="col-span-5">
                <div className="py-4">
                  <div className="flex w-auto">
                    <div className="py-2 px-3 mr-2 bg-olive-300 text-olive-500 rounded-2xl">
                      {selectedProduct.category || "Kategori"}
                    </div>
                  </div>
                  <h1 className="mt-3 text-2xl font-bold">
                    {selectedProduct.name || "Unknown Product"}
                  </h1>
                  <h1 className="mt-5 text-3xl font-bold text-olive-700">
                    Rp.{" "}
                    {selectedProduct.price
                      ? selectedProduct.price.toLocaleString("id-ID")
                      : "N/A"}
                  </h1>
                  <p className="mt-5">
                    Kondisi: {selectedProduct.condition || "Tidak Diketahui"}
                  </p>
                  <p className="mt-5">
                    Berat:{" "}
                    {selectedProduct.weight
                      ? `${selectedProduct.weight} KG`
                      : "Tidak Diketahui"}
                  </p>
                  <p className="mt-5">
                    Garansi:{" "}
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
                  <p className="mt-5">
                    Tanggal Kadaluarsa:{" "}
                    {selectedProduct.expiry_date
                      ? formatDate(selectedProduct.expiry_date)
                      : "-"}
                  </p>
                  <p className="mt-5">
                    Status Barang:{" "}
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        selectedProduct.status === "Tersedia"
                          ? "bg-green-100 text-green-800"
                          : selectedProduct.status === "Kadaluarsa"
                          ? "bg-red-100 text-red-800"
                          : selectedProduct.status === "Didonasikan"
                          ? "bg-blue-100 text-blue-800"
                          : selectedProduct.status === "Siap Diambil Kembali"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-blue-800"
                      }`}
                    >
                      {selectedProduct.status || "Unknown"}
                    </span>
                  </p>
                  <p className="mt-5">
                    Tanggal Perpanjangan:{" "}
                    {selectedProduct.extension_date
                      ? formatDate(selectedProduct.extension_date)
                      : "-"}
                  </p>
                  <p className="mt-5 text-justify">
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

export default ManageTransaksiPenitipan;
