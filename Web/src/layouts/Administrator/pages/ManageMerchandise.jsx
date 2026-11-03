import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../utils/axiosInstance";

const ManageMerchandise = () => {
  const [merchandises, setMerchandises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMerchandise, setNewMerchandise] = useState({
    nama: "",
    deskripsi: "",
    poin_dibutuhkan: "",
    stok: "",
    gambar: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Function to format the image URL correctly
  const formatImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If path already includes http:// or https://, return as is
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // Otherwise, prepend the storage URL
    return `http://localhost:8000/storage/${imagePath}`;
  };

  const fetchMerchandises = useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const res = await axiosInstance.get("/admin/manage-merchandise");
      setMerchandises(res.data);
    } catch (err) {
      console.error("Failed to fetch merchandises", err);
      setLoadError("Failed to load merchandises. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchandises();
  }, [fetchMerchandises]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredMerchandises = merchandises.filter((item) =>
    item.NAMA.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMerchandise({
      ...newMerchandise,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
    }
  };

  const resetForm = () => {
    setNewMerchandise({
      nama: "",
      deskripsi: "",
      poin_dibutuhkan: "",
      stok: "",
      gambar: "",
    });
    setSelectedFile(null);
    setPreviewImage(null);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Confirmation prompt
    if (!window.confirm(`Apakah Anda yakin ingin ${editingId ? 'memperbarui' : 'menambahkan'} merchandise ini?`)) {
      return;
    }

    try {
      const payload = {
        NAMA: newMerchandise.nama,
        DESKRIPSI: newMerchandise.deskripsi,
        POIN_DIBUTUHKAN: newMerchandise.poin_dibutuhkan,
        STOK: newMerchandise.stok,
      };

      if (editingId) {
        if (selectedFile) {
          // PHP tidak mem-parsing multipart pada request PUT, jadi upload
          // file tetap dikirim sebagai POST dengan _method=PUT.
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) =>
            formData.append(key, value)
          );
          formData.append("URL_GAMBAR", selectedFile);

          await axiosInstance.post(
            `/admin/manage-merchandise/${editingId}?_method=PUT`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        } else {
          // Tanpa file baru, gunakan PUT JSON agar field yang dikirim jelas
          // dan gambar lama tetap dipertahankan backend.
          await axiosInstance.put(
            `/admin/manage-merchandise/${editingId}`,
            payload
          );
        }
        alert("Merchandise berhasil diperbarui!");
      } else {
        // For create
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) =>
          formData.append(key, value)
        );
        if (selectedFile) {
          formData.append("URL_GAMBAR", selectedFile);
        }

        await axiosInstance.post("/admin/manage-merchandise", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Merchandise berhasil ditambahkan!");
      }

      fetchMerchandises();
      resetForm();
    } catch (err) {
      console.error("Error saving merchandise", err);
      alert("Gagal menyimpan merchandise. Silakan coba lagi.");
    }
  };

  const handleEdit = (item) => {
    setNewMerchandise({
      nama: item.NAMA,
      deskripsi: item.DESKRIPSI,
      poin_dibutuhkan: item.POIN_DIBUTUHKAN,
      stok: item.STOK,
      gambar: item.URL_GAMBAR,
    });

    // Set the preview image if there's an existing photo
    if (item.URL_GAMBAR) {
      setPreviewImage(formatImageUrl(item.URL_GAMBAR));
    } else {
      setPreviewImage(null);
    }

    setEditingId(item.ID_MERCHANDISE);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus merchandise ini?")) {
      try {
        await axiosInstance.delete(`/admin/manage-merchandise/${id}`);
        fetchMerchandises();
        alert("Merchandise berhasil dihapus!");
      } catch (err) {
        console.error("Error deleting merchandise", err);
        alert("Gagal menghapus merchandise. Silakan coba lagi.");
      }
    }
  };

  // Clean up preview URL when component unmounts or when a new file is selected
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-10">Manage Merchandise</h1>

      {loadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{loadError}</p>
          <button
            onClick={fetchMerchandises}
            className="ml-2 font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between mb-4 items-center">
        <input
          type="text"
          placeholder="Cari merchandise..."
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border border-gray-300 rounded-md w-1/3"
        />
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-olive-500 text-white px-4 py-3 text-md rounded-md hover:bg-stone-700"
        >
          + Tambah Merchandise
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
                  "Deskripsi",
                  "Poin Dibutuhkan",
                  "Stok",
                  "Gambar",
                  "Aksi",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-sm bg-olive-500 font-medium text-white uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMerchandises.length > 0 ? (
                filteredMerchandises.map((item) => (
                  <tr key={item.ID_MERCHANDISE}>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      {item.ID_MERCHANDISE}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">{item.NAMA}</td>
                    <td className="px-3 py-3 text-sm whitespace-normal break-words max-w-xs">
                      {item.DESKRIPSI}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap text-center">
                      {item.POIN_DIBUTUHKAN}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap text-center">
                      {item.STOK}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap flex items-center justify-center">
                      {item.URL_GAMBAR ? (
                        <img
                          src={formatImageUrl(item.URL_GAMBAR)}
                          alt="Gambar Merchandise"
                          className="h-16 w-16 rounded object-cover align"
                          onError={(e) => {
                            console.error(
                              "Image failed to load:",
                              item.URL_GAMBAR
                            );
                            e.target.src = "/placeholder-merchandise.png"; // Fallback image
                            e.target.onerror = null; // Prevent infinite loop
                          }}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            No Image
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap ">
                      <div className="flex justify-center space-x-4">
                        <button
                          className="text-blue-500 text-sm hover:text-blue-600"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500 text-sm hover:text-red-600"
                          onClick={() => handleDelete(item.ID_MERCHANDISE)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada merchandise ditemukan
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
              {editingId ? "Edit" : "Tambah"} Merchandise
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nama Merchandise <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={newMerchandise.nama}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    name="deskripsi"
                    value={newMerchandise.deskripsi}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Poin Dibutuhkan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="poin_dibutuhkan"
                    value={newMerchandise.poin_dibutuhkan}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Stok <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stok"
                    value={newMerchandise.stok}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Gambar Merchandise
                  </label>
                  <input
                    type="file"
                    name="gambar_file"
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
                      <div className="relative inline-block">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="h-24 w-24 rounded object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder-merchandise.png";
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
                  className="bg-stone-600 text-white px-4 py-2 rounded-md hover:bg-stone-700"
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

export default ManageMerchandise;