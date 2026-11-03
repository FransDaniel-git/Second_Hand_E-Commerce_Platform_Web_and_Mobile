import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import Swal from "sweetalert2";

const ManageOrganisasi = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrganization, setNewOrganization] = useState({
    nama: "",
    alamat: "",
    telepon: "",
    deskripsi: "",
    email: "",
    status: "active",
    foto: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "active", "inactive"

  const formatImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `http://localhost:8000/storage/${imagePath}`;
  };

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const url = searchTerm
        ? `/admin/manage-organisasi/search?search=${encodeURIComponent(
            searchTerm
          )}`
        : "/admin/manage-organisasi";
      const res = await axiosInstance.get(url);
      let data = res.data;

      // Apply status filter locally if needed
      if (filterStatus !== "all") {
        data = data.filter((org) => org.STATUS === filterStatus);
      }

      setOrganizations(data);
    } catch (err) {
      console.error("Failed to fetch organizations", err);
      setLoadError("Failed to load organizations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrganization({
      ...newOrganization,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
    }
  };

  const resetForm = () => {
    setNewOrganization({
      nama: "",
      alamat: "",
      telepon: "",
      deskripsi: "",
      email: "",
      status: "active",
      foto: "",
    });
    setSelectedFile(null);
    setPreviewImage(null);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!newOrganization.nama) {
      await Swal.fire({
        icon: "warning",
        title: "Validasi Gagal",
        text: "Nama organisasi wajib diisi.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
      return;
    }

    // Confirmation prompt
    const result = await Swal.fire({
      icon: "question",
      title: "Konfirmasi",
      text: "Apakah Anda yakin ingin memperbarui organisasi ini?",
      showCancelButton: true,
      confirmButtonText: "Ya, Perbarui",
      cancelButtonText: "Batal",
      confirmButtonColor: "#4b7b6b",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("NAMA", newOrganization.nama);
      formData.append("ALAMAT", newOrganization.alamat);
      formData.append("TELEPON", newOrganization.telepon);
      formData.append("DESKRIPSI", newOrganization.deskripsi);
      formData.append("EMAIL", newOrganization.email);
      formData.append("STATUS", newOrganization.status);

      if (selectedFile) {
        formData.append("FOTO_ORGANISASI", selectedFile);
      }

      setLoading(true);
      await axiosInstance.post(
        `/admin/manage-organisasi/${editingId}?_method=PUT`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Organisasi berhasil diperbarui!",
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });

      fetchOrganizations();
      resetForm();
    } catch (err) {
      console.error("Error saving organization", err);
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text:
          err.response?.data?.message ||
          "Gagal menyimpan organisasi. Silakan coba lagi.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (org) => {
    setNewOrganization({
      nama: org.NAMA,
      alamat: org.ALAMAT,
      telepon: org.TELEPON,
      deskripsi: org.DESKRIPSI,
      email: org.EMAIL,
      status: org.STATUS,
      foto: org.FOTO_ORGANISASI,
    });

    if (org.FOTO_ORGANISASI) {
      setPreviewImage(formatImageUrl(org.FOTO_ORGANISASI));
    } else {
      setPreviewImage(null);
    }

    setEditingId(org.ID_ORGANISASI);
    setIsModalOpen(true);
  };

  const handleToggleOrganizationStatus = async (
    id,
    currentStatus,
    orgName,
    orgMail
  ) => {
    const isActive = currentStatus === "active";
    const action = isActive ? "menonaktifkan" : "mengaktifkan";
    const newStatus = isActive ? "inactive" : "active";

    const result = await Swal.fire({
      icon: "question",
      title: "Konfirmasi Status",
      text: `Apakah Anda yakin ingin ${action} ${orgName} (${orgMail})? Status akan menjadi ${newStatus}.`,
      showCancelButton: true,
      confirmButtonText: `Ya, ${
        action.charAt(0).toUpperCase() + action.slice(1)
      }`,
      cancelButtonText: "Batal",
      confirmButtonColor: "#4b7b6b",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.delete(`/admin/manage-organisasi/${id}`);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Organisasi berhasil ${action}!`,
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
      fetchOrganizations();
    } catch (err) {
      console.error(`Error ${action}ing organization:`, err);
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: `Gagal ${action} organisasi. Silakan coba lagi.`,
        confirmButtonText: "OK",
        confirmButtonColor: "#4b7b6b",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-10">Manage Organisasi</h1>

      {loadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{loadError}</p>
          <button
            onClick={fetchOrganizations}
            className="ml-2 font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Cari organisasi..."
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border border-gray-300 Rounded-md w-1/3"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="all">Semua</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-stone-600"></div>
          <p className="ml-3">Loading data...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow mt-10">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {[
                  "ID",
                  "Nama",
                  "Alamat",
                  "Telepon",
                  "Deskripsi",
                  "Email",
                  "Status",
                  "Foto",
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
              {organizations.length > 0 ? (
                organizations.map((org) => (
                  <tr key={org.ID_ORGANISASI}>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                      {org.ID_ORGANISASI}
                    </td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap max-w-[150px]">
                      {org.NAMA}
                    </td>
                    <td className="px-4 py-2 text-sm max-w-[200px] break-words">
                      {org.ALAMAT}
                    </td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                      {org.TELEPON}
                    </td>
                    <td className="px-4 py-2 text-sm max-w-[250px] break-words">
                      {org.DESKRIPSI}
                    </td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap max-w-[180px] truncate">
                      {org.EMAIL}
                    </td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                      {org.STATUS}
                    </td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                      {org.FOTO_ORGANISASI ? (
                        <img
                          src={formatImageUrl(org.FOTO_ORGANISASI)}
                          alt="Foto Organisasi"
                          className="h-16 w-16 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder-organization.png";
                            e.target.onerror = null;
                          }}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">
                            No Image
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex space-x-4">
                        <button
                          className="text-blue-500 text-sm hover:text-blue-600"
                          onClick={() => handleEdit(org)}
                        >
                          Edit
                        </button>
                        <button
                          className={
                            org.STATUS === "active"
                              ? "text-red-500 hover:text-red-600"
                              : "text-green-500 hover:text-green-600"
                          }
                          onClick={() =>
                            handleToggleOrganizationStatus(
                              org.ID_ORGANISASI,
                              org.STATUS,
                              org.NAMA,
                              org.EMAIL
                            )
                          }
                        >
                          {org.STATUS === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-2 text-center text-gray-500"
                  >
                    Tidak ada organisasi ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && resetForm()}
        >
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-1/3 md:max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Organisasi</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Nama Organisasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama"
                  value={newOrganization.nama}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Alamat</label>
                <input
                  type="text"
                  name="alamat"
                  value={newOrganization.alamat}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Telepon
                </label>
                <input
                  type="text"
                  name="telepon"
                  value={newOrganization.telepon}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="deskripsi"
                  value={newOrganization.deskripsi}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={newOrganization.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={newOrganization.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Foto Organisasi
                </label>
                <input
                  type="file"
                  name="foto_file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/jpg"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format yang diperbolehkan: JPG, PNG, JPEG. Maks: 2MB.
                </p>

                {previewImage && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-24 w-24 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = "/placeholder-organization.png";
                          e.target.onerror = null;
                        }}
                      />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewImage(null);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="mr-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-olive-500 text-white px-4 py-2 rounded-md hover:bg-stone-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrganisasi;
