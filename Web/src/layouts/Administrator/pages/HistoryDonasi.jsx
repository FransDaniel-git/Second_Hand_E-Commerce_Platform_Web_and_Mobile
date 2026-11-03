import React, { useState, useEffect } from "react";
import axios from "../../../utils/axiosInstance";
import Swal from 'sweetalert2';

const HistoryDonasi = () => {
  const [histories, setHistories] = useState([]);
  const [filteredHistories, setFilteredHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDonasi, setSelectedDonasi] = useState(null);
  const [recipientName, setRecipientName] = useState("");
  const [donationDate, setDonationDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [organizations, setOrganizations] = useState([]);

  // Get today's date in YYYY-MM-DD format for max date validation
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchHistories();
  }, []);

  useEffect(() => {
    filterAndSearch();
  }, [searchTerm, selectedOrganization, histories]);

  const fetchHistories = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/owner/history-donasi");
      const data = response.data;
      setHistories(data);
      // Extract unique organizations for filter
      const uniqueOrgs = [...new Set(data.map((item) => item.organisasi))];
      setOrganizations(uniqueOrgs);
    } catch (error) {
      console.error("Error fetching donation history:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data donasi. Silakan coba lagi.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSearch = () => {
    let filtered = [...histories];

    // Filter by organization
    if (selectedOrganization) {
      filtered = filtered.filter(
        (donasi) => donasi.organisasi === selectedOrganization
      );
    }

    // Search by name, date, or status
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (donasi) =>
          donasi.nama_penerima.toLowerCase().includes(lowerSearch) ||
          donasi.tanggal_donasi.toLowerCase().includes(lowerSearch) ||
          (donasi.nama_penerima === "Belum ditentukan"
            ? "Belum Diterima"
            : "Diterima"
          )
            .toLowerCase()
            .includes(lowerSearch)
      );
    }

    setFilteredHistories(filtered);
  };

  const handleConfirmDonation = (donasi) => {
    setSelectedDonasi(donasi);
    setRecipientName(
      donasi.nama_penerima !== "Belum ditentukan" ? donasi.nama_penerima : ""
    );
    setDonationDate(
      donasi.tanggal_donasi !== "Belum ditentukan" ? donasi.tanggal_donasi : ""
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!recipientName || !donationDate) {
      await Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Nama penerima dan tanggal donasi wajib diisi.',
      });
      return;
    }

    // Validate date is not in the future
    if (donationDate > today) {
      await Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Tanggal donasi tidak boleh lebih dari hari ini.',
      });
      return;
    }

    const confirmation = await Swal.fire({
      title: 'Konfirmasi Donasi',
      text: 'Apakah Anda yakin ingin mengkonfirmasi donasi ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, konfirmasi!',
      cancelButtonText: 'Tidak, batal',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      await axios.put(`/owner/history-donasi/${selectedDonasi.id}`, {
        NAMA_PENERIMA: recipientName,
        TANGGAL_DONASI: donationDate,
      });

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Donasi berhasil dikonfirmasi!',
      });
      fetchHistories();
      setIsModalOpen(false);
      setRecipientName("");
      setDonationDate("");
    } catch (error) {
      console.error("Error confirming donation:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal mengkonfirmasi donasi. Silakan coba lagi.',
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">History Donasi ke Organisasi</h1>

      {/* Filter and Search Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            Filter by Organization
          </label>
          <select
            value={selectedOrganization}
            onChange={(e) => setSelectedOrganization(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            Search by Name, Date, or Status
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-600"></div>
        </div>
      ) : filteredHistories.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded">
          Tidak ada data donasi yang sesuai dengan kriteria.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {[
                  "ID",
                  "Organisasi",
                  "Barang yang Didonasikan",
                  "Nama Penerima",
                  "Tanggal Donasi",
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
              {filteredHistories.map((donasi) => (
                <tr key={donasi.id}>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {donasi.id}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {donasi.organisasi}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <ul className="list-disc list-inside">
                      {donasi.barang && donasi.barang.length > 0 ? (
                        donasi.barang.map((item, index) => (
                          <div key={index}>{item}</div>
                        ))
                      ) : (
                        <div>Tidak ada data barang</div>
                      )}
                    </ul>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {donasi.nama_penerima}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {donasi.tanggal_donasi}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        donasi.nama_penerima === "Belum ditentukan"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {donasi.nama_penerima === "Belum ditentukan"
                        ? "Belum Diterima"
                        : "Diterima"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <button
                      onClick={() => handleConfirmDonation(donasi)}
                      className={`px-3 py-2 rounded-md text-white ${
                        donasi.nama_penerima !== "Belum ditentukan"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                      disabled={donasi.nama_penerima !== "Belum ditentukan"}
                    >
                      {donasi.nama_penerima !== "Belum ditentukan"
                        ? "Terkonfirmasi"
                        : "Konfirmasi Donasi"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for confirming donation */}
      {isModalOpen && selectedDonasi && (
        <div
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-3/5">
            <h2 className="text-xl font-bold mb-4">
              Konfirmasi Donasi - {selectedDonasi.organisasi}
            </h2>
            <p className="mb-4 text-gray-700">
              Barang: {selectedDonasi.barang && selectedDonasi.barang.join(", ")}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Nama Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Tanggal Donasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  max={today}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

export default HistoryDonasi;