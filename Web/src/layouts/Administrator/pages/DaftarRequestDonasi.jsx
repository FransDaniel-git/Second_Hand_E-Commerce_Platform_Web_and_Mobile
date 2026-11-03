import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AuthService from "../../../services/authService";

const DaftarRequestDonasi = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    action: null,
    message: "",
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/owner/request-donasi",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setRequests(response.data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleApproval = async (id, newStatus) => {
    const pegawaiId = AuthService.getCurrentUser().ID_PEGAWAI;
    const requestItem = requests.find((req) => req.ID_REQUEST === id);

    if (!requestItem) {
      console.error("Request not found with ID:", id);
      return;
    }

    // Show confirmation prompt for rejection
    if (newStatus === "ditolak") {
      setConfirmDialog({
        show: true,
        message: `Apakah Anda yakin ingin menolak request donasi dengan ID ${id}?`,
        action: () => performApproval(id, newStatus, pegawaiId),
      });
      return;
    }

    performApproval(id, newStatus, pegawaiId);
  };

  const performApproval = async (id, newStatus, pegawaiId) => {
    // Only include necessary fields for rejection
    const requestData = {
      ID_PEGAWAI: pegawaiId,
      STATUS: newStatus,
    };

    try {
      await axios.put(
        `http://localhost:8000/api/owner/request-donasi/${id}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setRequests(
        requests.map((request) =>
          request.ID_REQUEST === id
            ? { ...request, STATUS: newStatus }
            : request
        )
      );
      // Show success message
      toast.success(
        newStatus === "ditolak"
          ? "Request donasi berhasil ditolak."
          : "Request donasi berhasil diperbarui."
      );
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Gagal memperbarui status request. Silakan coba lagi.");
    }
  };

  const openModal = async (id) => {
    setSelectedRequestId(id);
    setIsModalOpen(true);
    setSearchTerm("");

    setLoadingItems(true);
    try {
      const response = await axios.get(
        "http://localhost:8000/api/owner/barang-titipan-donasi",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Hanya barang yang masih menjadi kandidat donasi. Barang berstatus
      // "Telah Didonasikan" sudah selesai dan tidak boleh dipilih lagi.
      const formattedItems = (response.data.data || [])
        .filter((item) =>
          ["Didonasikan", "Hangus", "Kadaluarsa"].includes(item.STATUS)
        )
        .map((item) => {
          const kodeProduk = String(item.KODE_PRODUK);
          return {
            id: kodeProduk,
            name: item.NAMA || "Barang tanpa nama",
            condition: item.KONDISI || "Tidak diketahui",
            warrantyDate: item.TANGGAL_GARANSI || "-",
            status: item.STATUS,
            kode: kodeProduk,
          };
        });

      setItems(formattedItems);
    } catch (error) {
      console.error("Error fetching donation items:", error);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const handleConfirmSelection = async () => {
    if (selectedRequestId && selectedItem) {
      // Show confirmation prompt
      setConfirmDialog({
        show: true,
        message: `Apakah Anda yakin ingin menyetujui donasi barang "${selectedItem.name}" untuk request ID ${selectedRequestId}?`,
        action: () => performDonationConfirmation(),
      });
    } else {
      toast.warning("Silakan pilih barang terlebih dahulu");
    }
  };

  const performDonationConfirmation = async () => {
    try {
      // Satu endpoint menangani semuanya secara atomik: membuat record donasi,
      // mengubah status barang menjadi "Telah Didonasikan", dan mengonfirmasi
      // request donasi.
      await axios.post(
        "http://localhost:8000/api/owner/manage-donasi",
        {
          KODE_PRODUK: String(selectedItem.id),
          ID_REQUEST: selectedRequestId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update local state
      setRequests(
        requests.map((request) =>
          request.ID_REQUEST === selectedRequestId
            ? { ...request, STATUS: "dikonfirmasi" }
            : request
        )
      );

      setIsModalOpen(false);
      setSelectedItem(null);

      toast.success(
        "Donasi berhasil disetujui dan poin loyalitas penitip telah diperbarui."
      );

      // Refresh items list; barang yang baru didonasikan harus hilang.
      const itemsRes = await axios.get(
        "http://localhost:8000/api/owner/barang-titipan-donasi",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const formattedItems = (itemsRes.data.data || [])
        .filter((item) =>
          ["Didonasikan", "Hangus", "Kadaluarsa"].includes(item.STATUS)
        )
        .map((item) => ({
          id: String(item.KODE_PRODUK),
          name: item.NAMA || "Barang tanpa nama",
          condition: item.KONDISI || "Tidak diketahui",
          warrantyDate: item.TANGGAL_GARANSI || "-",
          status: item.STATUS,
          kode: String(item.KODE_PRODUK),
        }));

      setItems(formattedItems);
    } catch (error) {
      console.error("Error confirming donation:", error);
      const message =
        error.response?.data?.errors?.KODE_PRODUK?.[0] ||
        error.response?.data?.errors?.ID_REQUEST?.[0] ||
        error.response?.data?.message ||
        "Gagal menyetujui donasi. Silakan coba lagi.";
      toast.error(message);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests =
    filterStatus === "Semua"
      ? requests
      : requests.filter((r) => r.STATUS.trim() === filterStatus.trim());

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Daftar Request Donasi</h1>

      <div className="flex mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="Semua">Semua</option>
          <option value="menunggu konfirmasi">Menunggu Konfirmasi</option>
          <option value="dikonfirmasi">Dikonfirmasi</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {[
                  "ID",
                  "Nama Organisasi",
                  "Deskripsi",
                  "Tanggal Permintaan",
                  "Status",
                  "Aksi",
                ].map((header, index) => (
                  <th
                    key={`header-${index}`}
                    className="px-4 py-3 bg-olive-500 text-sm font-medium text-white uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((req, index) => (
                <tr key={`request-${req.ID_REQUEST || index}`}>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {req.ID_REQUEST}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {req.ID_ORGANISASI}
                  </td>
                  <td className="description-cell px-6 py-4">
                    {req.DESKRIPSI_PERMINTAAN}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {req.TANGGAL_PERMINTAAN}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        req.STATUS === "menunggu konfirmasi"
                          ? "bg-yellow-100 text-yellow-700"
                          : req.STATUS === "dikonfirmasi"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {req.STATUS}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {req.STATUS === "menunggu konfirmasi" ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(req.ID_REQUEST)}
                          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600"
                        >
                          Pilih Barang
                        </button>
                        <button
                          onClick={() =>
                            handleApproval(req.ID_REQUEST, "ditolak")
                          }
                          className="bg-red-500 text-sm text-white px-3 py-2 rounded-md hover:bg-red-600"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        {req.STATUS === "dikonfirmasi"
                          ? "Sudah Dikonfirmasi"
                          : "Tidak ada aksi"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              setSelectedItem(null);
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-3/4 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              Pilih Barang untuk Donasi
            </h2>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Cari barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {loadingItems ? (
              <div className="flex justify-center items-center h-40">
                <p>Loading barang...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <p>
                  Tidak ada barang dengan status 'Didonasikan', 'Hangus', atau
                  'Kadaluarsa' yang tersedia
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0">
                    <tr>
                      <th className="px-6 py-4 bg-olive-500 text-lg font-medium text-white uppercase tracking-wider">
                        Kode Barang
                      </th>
                      <th className="px-6 py-4 bg-olive-500 text-lg font-medium text-white uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-4 bg-olive-500 text-lg font-medium text-white uppercase tracking-wider">
                        Kondisi
                      </th>
                      <th className="px-6 py-4 bg-olive-500 text-lg font-medium text-white uppercase tracking-wider">
                        Tanggal Garansi
                      </th>
                      <th className="px-6 py-4 bg-olive-500 text-lg font-medium text-white uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item, index) => (
                      <tr
                        key={`item-${item.id || index}`}
                        className={`hover:bg-gray-100 cursor-pointer ${
                          selectedItem?.id === item.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleSelectItem(item)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {item.kode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.condition}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.warrantyDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              item.status === "Didonasikan"
                                ? "bg-orange-100 text-orange-700"
                                : item.status === "Hangus"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedItem && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="font-medium">
                  Barang terpilih: {selectedItem.name} (Kode:{" "}
                  {selectedItem.kode})
                </p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedItem(null);
                }}
                className="mr-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Kembali
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedItem}
                className={`${
                  !selectedItem
                    ? "bg-stone-400 cursor-not-allowed"
                    : "bg-olive-500 hover:bg-stone-700"
                } text-white px-4 py-2 rounded-md`}
              >
                Setujui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Konfirmasi</h3>
            <p className="text-gray-700 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setConfirmDialog({ show: false, action: null, message: "" })
                }
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirmDialog.action();
                  setConfirmDialog({ show: false, action: null, message: "" });
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaftarRequestDonasi;
