import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../utils/axiosInstance";

const ManageJabatan = () => {
  const [jobPositions, setJobPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nama: "" });
  const [editingId, setEditingId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const fetchJobPositions = useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const res = await axiosInstance.get("/admin/manage-jabatan");
      setJobPositions(res.data);
    } catch (err) {
      console.error("Failed to fetch job positions", err);
      setLoadError("Failed to load job positions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobPositions();
  }, [fetchJobPositions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredJobPositions = jobPositions.filter((pos) =>
    pos.NAMA.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = () => {
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ nama: "" });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/admin/manage-jabatan/${editingId}`, {
          NAMA: formData.nama,
        });
        alert("Jabatan berhasil diperbarui!");
      } else {
        await axiosInstance.post("/admin/manage-jabatan", {
          NAMA: formData.nama,
        });
        alert("Jabatan berhasil ditambahkan!");
      }
      fetchJobPositions();
      resetForm();
    } catch (err) {
      console.error("Error saving job position", err);
      alert("Gagal menyimpan jabatan. Silakan coba lagi.");
    }
  };

  const handleEdit = (jabatan) => {
    setFormData({ nama: jabatan.NAMA });
    setEditingId(jabatan.ID_JABATAN);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus jabatan ini?")) {
      try {
        await axiosInstance.delete(`/admin/manage-jabatan/${id}`);
        fetchJobPositions();
        alert("Jabatan berhasil dihapus!");
      } catch (err) {
        console.error("Error deleting job position", err);
        alert("Gagal menghapus jabatan. Silakan coba lagi.");
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-10">Manage Jabatan</h1>

      {loadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{loadError}</p>
          <button
            onClick={fetchJobPositions}
            className="ml-2 font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Cari jabatan..."
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border border-gray-300 rounded-md w-1/3"
        />
        <div
          role="button"
          onClick={openModal}
          className="bg-olive-500 text-white px-4 py-3 text-md rounded-md hover:bg-stone-700 cursor-pointer flex items-center justify-center"
        >
          + Tambah Jabatan
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-stone-500"></div>
          <p className="ml-3">Loading data...</p>
        </div>
      ) : (
        <div className="overflow-hidden sm:rounded-lg bg-white shadow mt-10">
          <table className="min-w-full divide-y divide-gray-200 rounded-2xl shadow">
            <thead>
              <tr>
                <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase">
                  ID
                </th>
                <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase">
                  Nama Jabatan
                </th>
                <th className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobPositions.length > 0 ? (
                filteredJobPositions.map((pos) => (
                  <tr key={pos.ID_JABATAN}>
                    <td className="pl-6 py-3 whitespace-nowrap text-gray-900">
                      {pos.ID_JABATAN}
                    </td>
                    <td className="pl-6 py-3 whitespace-nowrap text-gray-900">
                      {pos.NAMA}
                    </td>
                    <td className="pl-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleEdit(pos)}
                          className="text-blue-500 hover:text-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pos.ID_JABATAN)}
                          className="text-red-500 hover:text-red-500"
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
                    colSpan="3"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada jabatan ditemukan
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
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-1/3">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Edit Jabatan" : "Tambah Jabatan"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Nama Jabatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end">
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

export default ManageJabatan;
