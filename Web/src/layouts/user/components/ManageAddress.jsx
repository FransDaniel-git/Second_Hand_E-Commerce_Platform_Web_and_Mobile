import React, { useEffect, useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import Swal from "sweetalert2";

const AddressManagement = () => {
  const [addresses, setAddresses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    JALAN: "",
    KECAMATAN: "",
    KELURAHAN: "",
    KOTA: "",
    KODE_POS: "",
    ALAMAT_UTAMA: false,
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchAddresses();
  }, [searchQuery]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await axiosInstance.get("/pembeli/alamat", {
        params: { search: searchQuery },
      });
      setAddresses(response.data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setLoadError("Gagal memuat data alamat. Silakan coba lagi.");
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat data alamat.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.JALAN.trim()) errors.JALAN = "Jalan wajib diisi.";
    if (!formData.KECAMATAN.trim()) errors.KECAMATAN = "Kecamatan wajib diisi.";
    if (!formData.KELURAHAN.trim()) errors.KELURAHAN = "Kelurahan wajib diisi.";
    if (!formData.KOTA.trim()) errors.KOTA = "Kota wajib diisi.";
    if (!formData.KODE_POS.trim()) errors.KODE_POS = "Kode pos wajib diisi.";
    else if (!/^\d{5}$/.test(formData.KODE_POS))
      errors.KODE_POS = "Kode pos harus 5 digit angka.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAddresses();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Clear error for the field being edited
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      await Swal.fire({
        icon: "warning",
        title: "Validasi Gagal",
        text: "Harap isi semua kolom dengan benar.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
      return;
    }

    // Confirmation prompt for create or edit
    const confirmMessage = editingId
      ? "Apakah Anda yakin ingin memperbarui alamat ini?"
      : "Apakah Anda yakin ingin menambahkan alamat ini?";
    const result = await Swal.fire({
      icon: "question",
      title: "Konfirmasi",
      text: confirmMessage,
      showCancelButton: true,
      confirmButtonText: editingId ? "Ya, Perbarui" : "Ya, Tambah",
      cancelButtonText: "Batal",
      confirmButtonColor: "#4b7b6b",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      if (editingId) {
        await axiosInstance.put(`/pembeli/alamat/${editingId}`, formData);
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Alamat berhasil diperbarui!",
          confirmButtonText: "OK",
          confirmButtonColor: "#4b7b6b",
        });
      } else {
        await axiosInstance.post("/pembeli/alamat", formData);
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Alamat berhasil ditambahkan!",
          confirmButtonText: "OK",
          confirmButtonColor: "#4b7b6b",
        });
      }
      resetForm();
      fetchAddresses();
    } catch (error) {
      console.error("Gagal menyimpan alamat:", error);
      const errorMessage =
        error.response?.data?.message || "Gagal menyimpan alamat. Silakan coba lagi.";
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: errorMessage,
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (alamat) => {
    setFormData({
      JALAN: alamat.JALAN || "",
      KECAMATAN: alamat.KECAMATAN || "",
      KELURAHAN: alamat.KELURAHAN || "",
      KOTA: alamat.KOTA || "",
      KODE_POS: alamat.KODE_POS || "",
      ALAMAT_UTAMA: alamat.ALAMAT_UTAMA === 1,
    });
    setEditingId(alamat.ID_ALAMAT);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (addresses.length <= 1) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Tidak dapat menghapus alamat terakhir. Minimal harus ada satu alamat.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
      return;
    }

    // Confirmation prompt for delete
    const result = await Swal.fire({
      icon: "question",
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus alamat ini?",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#4b7b6b",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await axiosInstance.delete(`/pembeli/alamat/${id}`);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Alamat berhasil dihapus!",
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
      fetchAddresses();
    } catch (error) {
      console.error("Gagal menghapus alamat:", error);
      const errorMessage =
        error.response?.data?.message || "Gagal menghapus alamat. Silakan coba lagi.";
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: errorMessage,
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      JALAN: "",
      KECAMATAN: "",
      KELURAHAN: "",
      KOTA: "",
      KODE_POS: "",
      ALAMAT_UTAMA: false,
    });
    setEditingId(null);
    setIsModalOpen(false);
    setFormErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto py-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-olive-500">Manajemen Alamat</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-olive-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          Tambah Alamat
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-4">
        <input
          type="text"
          placeholder="Cari alamat..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-olive-500"
          disabled={loading}
        />
      </form>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              {editingId ? "Edit Alamat" : "Tambah Alamat"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="JALAN" className="block mb-1 font-semibold text-gray-700">
                    Jalan
                  </label>
                  <input
                    id="JALAN"
                    type="text"
                    name="JALAN"
                    placeholder="Cth : Jl. Babarsari No. 1"
                    className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                      formErrors.JALAN ? "border-red-500" : "focus:ring-olive-500"
                    }`}
                    value={formData.JALAN}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formErrors.JALAN && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.JALAN}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="KECAMATAN" className="block mb-1 font-semibold text-gray-700">
                    Kecamatan
                  </label>
                  <input
                    id="KECAMATAN"
                    type="text"
                    name="KECAMATAN"
                    placeholder="Cth : Depok"
                    className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                      formErrors.KECAMATAN ? "border-red-500" : "focus:ring-olive-500"
                    }`}
                    value={formData.KECAMATAN}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formErrors.KECAMATAN && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.KECAMATAN}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="KELURAHAN" className="block mb-1 font-semibold text-gray-700">
                    Kelurahan
                  </label>
                  <input
                    id="KELURAHAN"
                    type="text"
                    name="KELURAHAN"
                    placeholder="Cth : Caturtunggal"
                    className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                      formErrors.KELURAHAN ? "border-red-500" : "focus:ring-olive-500"
                    }`}
                    value={formData.KELURAHAN}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formErrors.KELURAHAN && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.KELURAHAN}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="KOTA" className="block mb-1 font-semibold text-gray-700">
                    Kota
                  </label>
                  <input
                    id="KOTA"
                    type="text"
                    name="KOTA"
                    placeholder="Cth : Sleman"
                    className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                      formErrors.KOTA ? "border-red-500" : "focus:ring-olive-500"
                    }`}
                    value={formData.KOTA}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formErrors.KOTA && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.KOTA}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="KODE_POS" className="block mb-1 font-semibold text-gray-700">
                    Kode Pos
                  </label>
                  <input
                    id="KODE_POS"
                    type="text"
                    name="KODE_POS"
                    placeholder="Cth : 55281"
                    className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                      formErrors.KODE_POS ? "border-red-500" : "focus:ring-olive-500"
                    }`}
                    value={formData.KODE_POS}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {formErrors.KODE_POS && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.KODE_POS}</p>
                  )}
                </div>
                <label className="flex items-center gap-2 mt-2 md:col-span-2">
                  <input
                    type="checkbox"
                    name="ALAMAT_UTAMA"
                    checked={formData.ALAMAT_UTAMA}
                    onChange={handleChange}
                    className="w-5 h-5 text-olive-500"
                    disabled={loading}
                  />
                  <span className="text-gray-700">Jadikan sebagai Alamat Utama</span>
                </label>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <button
                  type="submit"
                  className="bg-olive-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
                  disabled={loading}
                >
                  {loading
                    ? editingId
                      ? "Memperbarui..."
                      : "Menambahkan..."
                    : editingId
                    ? "Update Alamat"
                    : "Tambah Alamat"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition disabled:bg-gray-300"
                  disabled={loading}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h3 className="text-xl font-semibold mb-4 text-gray-700 mt-8">Daftar Alamat</h3>
      {loading ? (
        <p className="text-gray-500">Memuat data alamat...</p>
      ) : loadError ? (
        <p className="text-red-500">{loadError}</p>
      ) : addresses.length === 0 ? (
        <p className="text-gray-500">Tidak ada alamat ditemukan.</p>
      ) : (
        <div className="space-y-4">
          {addresses.map((alamat) => (
            <div
              key={alamat.ID_ALAMAT}
              className="bg-olive-100 shadow-sm rounded-lg p-4 flex justify-between items-start"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {alamat.JALAN}, {alamat.KECAMATAN}, {alamat.KELURAHAN}, {alamat.KOTA}, {alamat.KODE_POS}
                </p>
                {alamat.ALAMAT_UTAMA === 1 && (
                  <span className="inline-block bg-olive-300 text-olive-900 px-2 py-2 rounded mt-3">
                    Alamat Utama
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(alamat)}
                  className="text-sm bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 disabled:bg-yellow-200"
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(alamat.ID_ALAMAT)}
                  className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-red-300"
                  disabled={loading}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressManagement;