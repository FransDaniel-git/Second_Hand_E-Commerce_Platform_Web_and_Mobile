import React, { useState, useEffect } from "react";
import axios from "axios";
import AuthService from "../../../services/authService";
import Swal from "sweetalert2"; // Import SweetAlert2

const ManageRequestDonasi = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [newRequest, setNewRequest] = useState({
    DESKRIPSI_PERMINTAAN: "",
  });
  const [error, setError] = useState("");

  const API_URL = "http://localhost:8000/api/organisasi/request-donasi";
  const token = localStorage.getItem("token");
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to fetch requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredRequests = requests.filter((r) => {
    const status = r.STATUS ? r.STATUS.toLowerCase() : "";
    const tanggal = r.TANGGAL_PERMINTAAN
      ? new Date(r.TANGGAL_PERMINTAAN).toISOString().split("T")[0]
      : "";
    const deskripsi = r.DESKRIPSI_PERMINTAAN
      ? r.DESKRIPSI_PERMINTAAN.toLowerCase()
      : "";

    return (
      status.includes(searchTerm.toLowerCase()) ||
      tanggal.includes(searchTerm.toLowerCase()) ||
      deskripsi.includes(searchTerm.toLowerCase())
    );
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRequest({
      ...newRequest,
      [name]: value,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Formats to yyyy-mm-dd
  };

  const handleAddRequest = async () => {
    // Validation
    if (!newRequest.DESKRIPSI_PERMINTAAN) {
      Swal.fire({
        title: "Validation Error",
        text: "Deskripsi permintaan wajib diisi.",
        icon: "error",
        customClass: { popup: "swal2-sm-popup" },
      });
      return;
    }

    // Confirmation prompt
    const result = await Swal.fire({
      title: "Confirm Add Request",
      text: "Apakah Anda yakin ingin menambahkan permintaan donasi ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Tambah",
      cancelButtonText: "Batal",
      customClass: { popup: "swal2-sm-popup" },
    });

    if (!result.isConfirmed) return;

    try {
      const payload = {
        DESKRIPSI_PERMINTAAN: newRequest.DESKRIPSI_PERMINTAAN,
      };
      const response = await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests([...requests, response.data.data]);
      setIsModalOpen(false);
      setNewRequest({
        DESKRIPSI_PERMINTAAN: "",
      });
      setError("");
      Swal.fire({
        title: "Success",
        text: "Permintaan donasi added successfully!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "swal2-sm-popup" },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add request. Please try again."
      );
    }
  };

  const handleEditRequest = (req) => {
    setEditMode(true);
    setCurrentRequestId(req.ID_REQUEST);
    setNewRequest({
      DESKRIPSI_PERMINTAAN: req.DESKRIPSI_PERMINTAAN,
    });
    setIsModalOpen(true);
  };

  const handleUpdateRequest = async () => {
    // Validation
    if (!newRequest.DESKRIPSI_PERMINTAAN) {
      Swal.fire({
        title: "Validation Error",
        text: "Deskripsi permintaan wajib diisi.",
        icon: "error",
        customClass: { popup: "swal2-sm-popup" },
      });
      return;
    }

    // Confirmation prompt
    const result = await Swal.fire({
      title: "Confirm Update Request",
      text: "Apakah Anda yakin ingin memperbarui permintaan donasi ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Update",
      cancelButtonText: "Batal",
      customClass: { popup: "swal2-sm-popup" },
    });

    if (!result.isConfirmed) return;

    try {
      const payload = {
        DESKRIPSI_PERMINTAAN: newRequest.DESKRIPSI_PERMINTAAN,
      };
      const response = await axios.put(
        `${API_URL}/${currentRequestId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRequests(
        requests.map((req) =>
          req.ID_REQUEST === currentRequestId ? response.data.data : req
        )
      );
      setIsModalOpen(false);
      setEditMode(false);
      setNewRequest({
        DESKRIPSI_PERMINTAAN: "",
      });
      setError("");
      Swal.fire({
        title: "Success",
        text: "Permintaan donasi updated successfully!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "swal2-sm-popup" },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update request. Please try again."
      );
    }
  };

  const handleDeleteRequest = async (id) => {
    // Confirmation prompt
    const result = await Swal.fire({
      title: "Confirm Delete Request",
      text: "Apakah Anda yakin ingin menghapus permintaan donasi ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      customClass: { popup: "swal2-sm-popup" },
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(requests.filter((req) => req.ID_REQUEST !== id));
      setError("");
      Swal.fire({
        title: "Success",
        text: "Permintaan donasi deleted successfully!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "swal2-sm-popup" },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete request. Please try again."
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-10">Manage Request Donasi</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      {/* Search dan Tambah */}
      <div className="flex justify-between mb-6">
        <input
          type="text"
          placeholder="Cari permintaan..."
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border border-gray-300 rounded-md w-1/3"
        />
        <button
          onClick={() => {
            setEditMode(false);
            setNewRequest({
              DESKRIPSI_PERMINTAAN: "",
            });
            setIsModalOpen(true);
          }}
          className="bg-olive-500 text-white px-4 py-3 text-sm rounded-md hover:bg-stone-700"
        >
          + Tambah Permintaan
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow mt-10">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {[
                  "ID",
                  "Deskripsi Permintaan",
                  "Tanggal Permintaan",
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
              {filteredRequests.map((req) => (
                <tr key={req.ID_REQUEST}>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {req.ID_REQUEST}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {req.DESKRIPSI_PERMINTAAN}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {formatDate(req.TANGGAL_PERMINTAAN)}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {req.STATUS}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {req.STATUS !== "dikonfirmasi" &&
                    req.STATUS !== "ditolak" ? (
                      <div className="flex space-x-4">
                        <button
                          className="text-blue-500 text-sm hover:text-blue-600"
                          onClick={() => handleEditRequest(req)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500 text-sm hover:text-red-600"
                          onClick={() => handleDeleteRequest(req.ID_REQUEST)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-2/3">
            <h2 className="text-xl font-bold mb-4">
              {editMode ? "Edit Permintaan Donasi" : "Tambah Permintaan Donasi"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                editMode ? handleUpdateRequest() : handleAddRequest();
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Deskripsi Permintaan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="DESKRIPSI_PERMINTAAN"
                    value={newRequest.DESKRIPSI_PERMINTAAN}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded-md mr-2 hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-olive-500 text-white px-4 py-2 rounded-md hover:bg-olive-500"
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

export default ManageRequestDonasi;
