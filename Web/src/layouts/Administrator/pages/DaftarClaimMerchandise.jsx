import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Package,
  User,
  CheckCircle,
  Clock,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline">
                {" "}
                Terjadi kesalahan: {this.state.error.message}
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const DaftarClaimMerchandise = () => {
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [filter, setFilter] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch claims data from API
  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("No authentication token found. Please log in.");

      const response = await axios.get("/api/cs/daftar-claim-merchandise", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10-second timeout
      });

      console.log("API response:", response.data);

      // Handle different response formats
      let claimsData = response.data;
      if (response.data && typeof response.data === "object") {
        if (Array.isArray(response.data.data)) {
          claimsData = response.data.data; // Handle { success: true, data: [...] }
        } else if (Array.isArray(response.data)) {
          claimsData = response.data; // Handle direct array
        } else {
          console.warn("API response is not an array:", response.data);
          claimsData = [];
        }
      } else {
        console.warn("Invalid API response format:", response.data);
        claimsData = [];
      }

      // Normalize data to ensure required fields
      claimsData = claimsData.map((claim) => {
        const normalizedClaim = {
          ID_PENUKARAN: claim.ID_PENUKARAN || "N/A",
          KODE_PENUKARAN: String(claim.KODE_PENUKARAN || "-"),
          POIN_DIGUNAKAN: Number(claim.POIN_DIGUNAKAN) || 0,
          TANGGAL_PENUKARAN: claim.TANGGAL_PENUKARAN || null,
          TANGGAL_DIKLAIM: claim.TANGGAL_DIKLAIM || null,
          pembeli: {
            NAMA: String(claim.pembeli?.NAMA || claim.penitip?.NAMA || "-"),
            EMAIL: String(claim.pembeli?.EMAIL || "-"),
          },
          merchandise: {
            NAMA: String(claim.merchandise?.NAMA || "-"),
          },
          pegawai: {
            NAMA: String(claim.pegawai?.NAMA || "-"),
          },
        };
        console.log("Normalized claim:", normalizedClaim);
        return normalizedClaim;
      });

      setClaims(claimsData);
      setFilteredClaims(claimsData);
    } catch (err) {
      console.error("Error fetching claims:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Gagal mengambil data klaim merchandise"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle claim actions (e.g., mark as claimed)
  const handleClaimAction = async (id, action, kodePenukaranDisplay) => {
    if (action !== "mark-claimed") return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");

      // Show SweetAlert2 confirmation dialog
      const result = await Swal.fire({
        title: "Konfirmasi Klaim Merchandise",
        text: `Apakah Anda yakin ingin menandai merchandise dengan kode ${kodePenukaranDisplay} sebagai diambil?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Konfirmasi",
        cancelButtonText: "Batal",
      });

      if (result.isConfirmed) {
        await axios.post(
          `/api/cs/penukaran/${id}/mark-claimed`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: "Berhasil!",
          text: "Merchandise telah ditandai sebagai diambil.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchClaims(); // Refresh claims after action
      }
    } catch (err) {
      console.error("Error handling claim action:", err);
      const errorMessage =
        err.response?.data?.message || "Gagal memproses aksi klaim";
      Swal.fire({
        title: "Gagal!",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
      setError(errorMessage);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  useEffect(() => {
    try {
      if (!Array.isArray(claims)) {
        setFilteredClaims([]);
        return;
      }
      let filtered = [...claims];
      if (filter === "belum-diambil") {
        filtered = filtered.filter((claim) => claim.TANGGAL_DIKLAIM === null);
      }
      if (searchTerm) {
        console.log("Applying search filter with term:", searchTerm);
        filtered = filtered.filter((claim) => {
          try {
            const namaPembeli = String(claim.pembeli?.NAMA || "");
            const namaMerchandise = String(claim.merchandise?.NAMA || "");
            const kodePenukaran = String(claim.KODE_PENUKARAN || "");
            const trimmedSearchTerm = searchTerm.trim();
            console.log(
              "Searching claim:",
              { kodePenukaran, searchTerm: trimmedSearchTerm },
              "Match:",
              kodePenukaran.includes(trimmedSearchTerm)
            );
            return (
              namaPembeli
                .toLowerCase()
                .includes(trimmedSearchTerm.toLowerCase()) ||
              namaMerchandise
                .toLowerCase()
                .includes(trimmedSearchTerm.toLowerCase()) ||
              kodePenukaran.includes(trimmedSearchTerm)
            );
          } catch (err) {
            console.error("Error in search filter for claim:", claim, err);
            return false; // Skip problematic claims
          }
        });
      }
      setFilteredClaims(filtered);
    } catch (err) {
      console.error("Error in filter effect:", err);
      setError("Gagal memfilter data klaim: " + err.message);
      setFilteredClaims([]);
    }
  }, [filter, searchTerm, claims]);

  const getStatusBadge = (claim) => {
    const isUnclaimed = claim.TANGGAL_DIKLAIM === null;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isUnclaimed
            ? "bg-yellow-100 text-yellow-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        {isUnclaimed ? (
          <Clock className="w-3 h-3 mr-1" />
        ) : (
          <CheckCircle className="w-3 h-3 mr-1" />
        )}
        {isUnclaimed ? "Belum Diambil" : "Sudah Diambil"}
      </span>
    );
  };

  const unclaimedCount = Array.isArray(claims)
    ? claims.filter((claim) => claim.TANGGAL_DIKLAIM === null).length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={fetchClaims}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <div className="mx-auto px-4 sm:px-6 lg:p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Daftar Klaim Merchandise
            </h1>
            <p className="text-gray-600">
              Kelola penukaran merchandise dari seluruh pembeli dan penitip
            </p>
          </div>

          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilter("semua")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === "semua"
                          ? "bg-olive-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Semua ({Array.isArray(claims) ? claims.length : 0})
                    </button>
                    <button
                      onClick={() => setFilter("belum-diambil")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === "belum-diambil"
                          ? "bg-olive-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Belum Diambil ({unclaimedCount})
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama pembeli/penitip, kode penukaran atau merchandise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-olive-500">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Pembeli/Penitip
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Merchandise
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Kode Penukaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Poin Digunakan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Tanggal Penukaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Tanggal Diklaim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">
                          Tidak ada data klaim
                        </p>
                        <p className="text-sm">
                          Belum ada penukaran merchandise yang ditemukan
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => (
                      <tr key={claim.ID_PENUKARAN} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {claim.pembeli.NAMA}
                              </div>
                              <div className="text-sm text-gray-500">
                                {claim.pembeli.EMAIL}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {claim.merchandise.NAMA}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {claim.KODE_PENUKARAN}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {claim.POIN_DIGUNAKAN.toLocaleString()} poin
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(claim.TANGGAL_PENUKARAN)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(claim.TANGGAL_DIKLAIM)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(claim)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {claim.TANGGAL_DIKLAIM === null ? (
                            <button
                              onClick={() =>
                                handleClaimAction(
                                  claim.ID_PENUKARAN,
                                  "mark-claimed",
                                  claim.KODE_PENUKARAN
                                )
                              }
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                            >
                              Konfirmasi Diambil
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">
              Menampilkan {filteredClaims.length} dari{" "}
              {Array.isArray(claims) ? claims.length : 0} total klaim
              merchandise
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DaftarClaimMerchandise;
