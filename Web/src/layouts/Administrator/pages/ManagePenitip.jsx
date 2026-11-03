import React, { useState, useEffect } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import AuthService from "../../../services/authService";
import Swal from "sweetalert2"; // Import SweetAlert2

const ManagePenitip = () => {
  const [penitips, setPenitips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPenitip, setNewPenitip] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    noKtp: "",
    password: "",
    fotoKtp: null,
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingPenitipId, setEditingPenitipId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchPenitips = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await axiosInstance.get("/cs/manage-penitip");
      setPenitips(response.data);
    } catch (error) {
      console.error("Error fetching penitips:", error);
      setLoadError("Failed to load penitips data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = AuthService.getCurrentUser();
        setCurrentUserId(user.id);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchPenitips();
    fetchCurrentUser();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredPenitips = penitips.filter((penitip) =>
    Object.values({
      ID: penitip.ID_PENITIP,
      NAMA: penitip.NAMA,
      TELEPON: penitip.TELEPON,
      ALAMAT: penitip.ALAMAT,
      EMAIL: penitip.EMAIL,
      NO_KTP: penitip.NO_KTP,
      STATUS: penitip.STATUS,
    }).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPenitip({
      ...newPenitip,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (!file.type.match("image.*")) {
        Swal.fire({
          title: "Invalid File",
          text: "Please select an image file (jpeg, png, jpg, gif)",
          icon: "error",
          customClass: { popup: "swal2-sm-popup" },
        });
        e.target.value = "";
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          title: "File Too Large",
          text: "File size should be less than 2MB",
          icon: "error",
          customClass: { popup: "swal2-sm-popup" },
        });
        e.target.value = "";
        return;
      }

      setNewPenitip({
        ...newPenitip,
        fotoKtp: file,
      });

      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
    } else {
      setNewPenitip({
        ...newPenitip,
        fotoKtp: null,
      });
      setPreviewImage(null);
    }
  };

  const formatImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `http://localhost:8000/storage/${imagePath}`;
  };

  const handleAddPenitip = async (e) => {
    if (e) e.preventDefault();

    // Validation
    if (
      !newPenitip.name ||
      !newPenitip.email ||
      !newPenitip.phone ||
      !newPenitip.address ||
      !newPenitip.noKtp ||
      !newPenitip.password
    ) {
      Swal.fire({
        title: "Validation Error",
        text: "All required fields must be filled",
        icon: "error",
        customClass: { popup: "swal2-sm-popup" },
      });
      return;
    }

    // Confirmation prompt
    const result = await Swal.fire({
      title: "Confirm Add Penitip",
      text: "Apakah Anda yakin ingin menambahkan penitip ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Tambah",
      cancelButtonText: "Batal",
      customClass: { popup: "swal2-sm-popup" },
    });

    if (!result.isConfirmed) return;

    const formData = new FormData();
    formData.append("NAMA", newPenitip.name);
    formData.append("ALAMAT", newPenitip.address);
    formData.append("TELEPON", newPenitip.phone);
    formData.append("NO_KTP", newPenitip.noKtp);
    formData.append("EMAIL", newPenitip.email);
    formData.append("PASSWORD", newPenitip.password);
    if (newPenitip.fotoKtp) {
      formData.append("FOTO_KTP", newPenitip.fotoKtp);
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post(
        "/cs/manage-penitip",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      fetchPenitips();
      setIsModalOpen(false);
      resetForm();
      Swal.fire({
        title: "Success",
        text: "Penitip added successfully!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "swal2-sm-popup" },
      });
    } catch (error) {
      console.error("Error adding penitip:", error);
      let errorMessage = "Something went wrong";
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Error: ${error.response.status} - Something went wrong`;
      } else if (error.request) {
        errorMessage =
          "No response from server. Please check your internet connection.";
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        customClass: { popup: "swal2-sm-popup" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePenitip = async (e) => {
    if (e) e.preventDefault();

    // Validation
    if (
      !newPenitip.name ||
      !newPenitip.email ||
      !newPenitip.phone ||
      !newPenitip.address ||
      !newPenitip.noKtp
    ) {
      Swal.fire({
        title: "Validation Error",
        text: "All required fields must be filled",
        icon: "error",
        customClass: { popup: "swal2-sm-popup" },
      });
      return;
    }

    // Confirmation prompt
    const result = await Swal.fire({
      title: "Confirm Update Penitip",
      text: "Apakah Anda yakin ingin memperbarui penitip ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Update",
      cancelButtonText: "Batal",
      customClass: { popup: "swal2-sm-popup" },
    });

    if (!result.isConfirmed) return;

    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("NAMA", newPenitip.name);
    formData.append("ALAMAT", newPenitip.address);
    formData.append("TELEPON", newPenitip.phone);
    formData.append("NO_KTP", newPenitip.noKtp);
    formData.append("EMAIL", newPenitip.email);
    if (newPenitip.fotoKtp) {
      formData.append("FOTO_KTP", newPenitip.fotoKtp);
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post(
        `/cs/manage-penitip/${editingPenitipId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      fetchPenitips();
      setIsModalOpen(false);
      resetForm();
      Swal.fire({
        title: "Success",
        text: "Penitip updated successfully!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "swal2-sm-popup" },
      });
    } catch (error) {
      console.error("Error updating penitip:", error);
      let errorMessage = "Something went wrong";
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Error: ${error.response.status} - Something went wrong`;
      } else if (error.request) {
        errorMessage =
          "No response from server. Please check your internet connection.";
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        customClass: { popup: "swal2-sm-popup" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePenitipStatus = async (id, currentStatus, penitipName) => {
    const isActive = currentStatus === "active";
    const action = isActive ? "deactivate" : "activate";
    const actionText = isActive ? "menonaktifkan" : "mengaktifkan";
    const newStatus = isActive ? "inactive" : "active";

    const result = await Swal.fire({
      title: `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      text: `Apakah Anda yakin ingin ${actionText} ${penitipName}? Ini akan mengatur status menjadi ${newStatus}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Ya, ${
        actionText.charAt(0).toUpperCase() + actionText.slice(1)
      }`,
      cancelButtonText: "Batal",
      customClass: { popup: "swal2-sm-popup" },
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await axiosInstance.delete(`/cs/manage-penitip/${id}`);
      Swal.fire({
        title: "Success",
        text: `Penitip ${action}d successfully!`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "swal2-sm-popup" },
      });
      await fetchPenitips();
    } catch (error) {
      console.error(`Error ${action}ing penitip:`, error);
      Swal.fire({
        title: "Error",
        text: `Failed to ${action} penitip. Please try again.`,
        icon: "error",
        customClass: { popup: "swal2-sm-popup" },
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewPenitip({
      name: "",
      email: "",
      phone: "",
      address: "",
      noKtp: "",
      password: "",
      fotoKtp: null,
    });
    setPreviewImage(null);
    setEditingPenitipId(null);
    setIsModalOpen(false);
    setShowPassword(false);
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
      <h1 className="text-3xl font-bold mb-10">Manage Penitip</h1>

      {loadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{loadError}</p>
          <button onClick={fetchPenitips} className="ml-2 font-bold underline">
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Cari penitip (nama, telepon, alamat, email, KTP, status)..."
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border border-gray-300 rounded-md w-1/3"
        />
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-olive-500 text-white px-4 py-3 text-md rounded-md hover:bg-olive-900"
        >
          + Tambah Penitip
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-olive-500"></div>
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
                  "No. Telepon",
                  "Alamat",
                  "Email",
                  "No. KTP",
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
              {filteredPenitips.length > 0 ? (
                filteredPenitips.map((penitip) => (
                  <tr key={penitip.ID_PENITIP}>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {penitip.ID_PENITIP}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {penitip.NAMA}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {penitip.TELEPON}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {penitip.ALAMAT}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {penitip.EMAIL}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {penitip.NO_KTP}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {penitip.STATUS}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <div className="flex space-x-4">
                        <button
                          className="text-blue-500 hover:text-blue-600"
                          onClick={() => {
                            setNewPenitip({
                              name: penitip.NAMA,
                              email: penitip.EMAIL,
                              phone: penitip.TELEPON,
                              address: penitip.ALAMAT,
                              noKtp: penitip.NO_KTP,
                              password: "",
                              fotoKtp: null,
                            });
                            setEditingPenitipId(penitip.ID_PENITIP);
                            setPreviewImage(formatImageUrl(penitip.FOTO_KTP));
                            setIsModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className={
                            penitip.STATUS === "active"
                              ? "text-red-500 hover:text-red-600"
                              : "text-green-500 hover:text-green-600"
                          }
                          onClick={() =>
                            handleTogglePenitipStatus(
                              penitip.ID_PENITIP,
                              penitip.STATUS,
                              penitip.NAMA
                            )
                          }
                        >
                          {penitip.STATUS === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada penitip ditemukan
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
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-3/5">
            <h2 className="text-xl font-bold mb-4">
              {editingPenitipId ? "Edit" : "Tambah"} Penitip
            </h2>
            <form
              onSubmit={
                editingPenitipId ? handleUpdatePenitip : handleAddPenitip
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newPenitip.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newPenitip.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    No. Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={newPenitip.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    No. KTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="noKtp"
                    value={newPenitip.noKtp}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Alamat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={newPenitip.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                {!editingPenitipId && (
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={newPenitip.password}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-9 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.79m0 0L21 21"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          ></path>
                        </svg>
                      )}
                    </button>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Foto KTP{" "}
                    {!editingPenitipId && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="file"
                    name="fotoKtp"
                    onChange={handleFileChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    required={!editingPenitipId}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format yang diperbolehkan: JPG, PNG, JPEG, GIF. Maks: 2MB.
                  </p>

                  {previewImage && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-1">Preview:</p>
                      <div className="relative inline-block">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="h-24 w-24 rounded object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder-ktp.png";
                            e.target.onerror = null;
                          }}
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                          onClick={() => {
                            setNewPenitip({
                              ...newPenitip,
                              fotoKtp: null,
                            });
                            setPreviewImage(null);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="mr-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-olive-500 text-white px-4 py-2 rounded-md hover:bg-olive-900"
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

export default ManagePenitip;
