import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import Swal from "sweetalert2";

const ManagePegawai = () => {
  const [employees, setEmployees] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    tgl_lahir: "",
    password: "",
    idJabatan: "",
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchJobPositions = useCallback(async () => {
    try {
      setLoadError(null);
      console.log("Fetching job positions...");
      const response = await axiosInstance.get("/admin/manage-jabatan");
      console.log("Job positions fetched:", response.data);
      setJobPositions(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching job positions:", error);
      setLoadError("Gagal memuat data jabatan. Silakan coba lagi.");
      return [];
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      console.log("Fetching employees...");

      const response = await axiosInstance.get("/admin/manage-pegawai");
      console.log("Employees fetched:", response.data);

      let positions = jobPositions;
      if (positions.length === 0) {
        positions = await fetchJobPositions();
      }

      const jobPositionsMap = {};
      positions.forEach((position) => {
        jobPositionsMap[position.ID_JABATAN] = position.NAMA;
      });

      const employeesWithJabatan = response.data.map((employee) => ({
        ...employee,
        JABATAN: jobPositionsMap[employee.ID_JABATAN] || "Unknown Position",
      }));

      setEmployees(employeesWithJabatan);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setLoadError("Gagal memuat data pegawai. Silakan coba lagi.");
      setLoading(false);
    }
  }, [jobPositions, fetchJobPositions]);

  useEffect(() => {
    const loadJobPositions = async () => {
      await fetchJobPositions();
    };
    loadJobPositions();
  }, [fetchJobPositions]);

  useEffect(() => {
    const loadEmployees = async () => {
      if (jobPositions.length > 0) {
        await fetchEmployees();
      }
    };
    loadEmployees();
  }, [jobPositions, fetchEmployees]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter((employee) =>
    `
      ${employee.ID_PEGAWAI || ""}
      ${employee.NAMA || ""}
      ${employee.EMAIL || ""}
      ${employee.TELEPON || ""}
      ${employee.ALAMAT || ""}
      ${employee.STATUS || ""}
      ${employee.JABATAN || ""}
    `.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({ ...newEmployee, [name]: value });
  };

  const handleAddEmployee = async (e) => {
    if (e) e.preventDefault();

    if (
      !newEmployee.name ||
      !newEmployee.email ||
      !newEmployee.phone ||
      !newEmployee.address ||
      !newEmployee.tgl_lahir ||
      !newEmployee.idJabatan ||
      !newEmployee.password
    ) {
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Semua kolom wajib diisi!",
      });
      return;
    }

    const confirmation = await Swal.fire({
      title: "Tambah Pegawai",
      text: "Apakah Anda yakin ingin menambah pegawai ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, tambah!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setLoading(true);
      console.log("Adding new employee:", newEmployee);
      await axiosInstance.post("/admin/manage-pegawai", {
        NAMA: newEmployee.name,
        EMAIL: newEmployee.email,
        TELEPON: newEmployee.phone,
        ALAMAT: newEmployee.address,
        STATUS: "active",
        TGL_LAHIR: newEmployee.tgl_lahir,
        PASSWORD: newEmployee.password,
        ID_JABATAN: newEmployee.idJabatan,
      });
      console.log("Employee added successfully");
      await Swal.fire({
        icon: "success",
        title: "Sukses",
        text: "Pegawai berhasil ditambahkan!",
      });
      await fetchEmployees();
      resetForm();
    } catch (error) {
      console.error("Error adding employee:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal menambahkan pegawai. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployee = async (e) => {
    if (e) e.preventDefault();

    if (
      !newEmployee.name ||
      !newEmployee.email ||
      !newEmployee.phone ||
      !newEmployee.address ||
      !newEmployee.tgl_lahir ||
      !newEmployee.idJabatan
    ) {
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Semua kolom wajib diisi!",
      });
      return;
    }

    const confirmation = await Swal.fire({
      title: "Update Pegawai",
      text: "Apakah Anda yakin ingin memperbarui data pegawai ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, update!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setLoading(true);
      console.log("Updating employee:", editingEmployeeId, newEmployee);
      await axiosInstance.put(`/admin/manage-pegawai/${editingEmployeeId}`, {
        NAMA: newEmployee.name,
        EMAIL: newEmployee.email,
        TELEPON: newEmployee.phone,
        ALAMAT: newEmployee.address,
        STATUS: "active",
        TGL_LAHIR: newEmployee.tgl_lahir,
        ID_JABATAN: newEmployee.idJabatan,
      });
      console.log("Employee updated successfully");
      await Swal.fire({
        icon: "success",
        title: "Sukses",
        text: "Pegawai berhasil diperbarui!",
      });
      await fetchEmployees();
      resetForm();
    } catch (error) {
      console.error("Error updating employee:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal memperbarui pegawai. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployeeStatus = async (id, currentStatus, employeeName) => {
    const isActive = currentStatus === "active";
    const action = isActive ? "deactivate" : "activate";
    const newStatus = isActive ? "inactive" : "active";

    const confirmation = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Pegawai`,
      text: `Apakah Anda yakin ingin ${action} ${employeeName}? Status akan menjadi ${newStatus}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Ya, ${action}!`,
      cancelButtonText: "Batal",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setLoading(true);
      console.log(`Toggling employee status to ${newStatus}:`, id);
      await axiosInstance.put(`/admin/manage-pegawai/${id}`, {
        STATUS: newStatus,
      });
      console.log(`Employee ${action}d successfully`);
      await Swal.fire({
        icon: "success",
        title: "Sukses",
        text: `Pegawai berhasil di-${action}!`,
      });
      await fetchEmployees();
    } catch (error) {
      console.error(`Error ${action}ing employee:`, error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: `Gagal ${action} pegawai. Silakan coba lagi.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (employee) => {
    const confirmation = await Swal.fire({
      title: "Reset Password",
      text: `Apakah Anda yakin ingin mereset password untuk ${employee.NAMA} ke tanggal lahirnya?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, reset!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!confirmation.isConfirmed) return;

    try {
      console.log("Resetting password for employee:", employee.ID_PEGAWAI);
      await axiosInstance.post("/auth/forgot-password-gabungan", {
        email: employee.EMAIL,
      });
      console.log("Password reset successfully");
      await Swal.fire({
        icon: "success",
        title: "Sukses",
        text: "Password telah direset ke tanggal lahir pegawai (YYYY-MM-DD)!",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal mereset password. Silakan coba lagi.",
      });
    }
  };

  const resetForm = () => {
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      address: "",
      tgl_lahir: "",
      password: "",
      idJabatan: "",
    });
    setEditingEmployeeId(null);
    setIsModalOpen(false);
    setShowPassword(false);
  };

  const openEditModal = (employee) => {
    setNewEmployee({
      name: employee.NAMA,
      email: employee.EMAIL,
      phone: employee.TELEPON,
      address: employee.ALAMAT,
      tgl_lahir: employee.TGL_LAHIR ? employee.TGL_LAHIR.substring(0, 10) : "",
      password: "",
      idJabatan: employee.ID_JABATAN,
    });
    setEditingEmployeeId(employee.ID_PEGAWAI);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="mt-6 min-h-screen md:max-w-7xl 2xl:max-w-screen mx-auto ">
      <h1 className="text-3xl font-bold mb-10">Manage Pegawai</h1>

      {loadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{loadError}</p>
          <button
            onClick={() => {
              setLoadError(null);
              fetchJobPositions().then(() => fetchEmployees());
            }}
            className="ml-2 font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Cari pegawai..."
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border border-gray-300 rounded-md w-1/3"
        />
        <div
          role="button"
          onClick={openAddModal}
          onKeyDown={(e) => e.key === "Enter" && openAddModal()}
          tabIndex={0}
          className="bg-olive-500 text-white px-4 py-3 text-md rounded-md hover:bg-stone-700 cursor-pointer flex items-center justify-center"
        >
          + Tambah Pegawai
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-olive-500"></div>
          <p className="ml-3">Loading data...</p>
        </div>
      ) : (
        <div className=" sm:rounded-lg bg-white shadow mt-10 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-2xl shadow">
            <thead>
              <tr>
                {[
                  "ID",
                  "Nama",
                  "No. Telepon",
                  "Alamat",
                  "Email",
                  "Status",
                  "Tanggal Lahir",
                  "Jabatan",
                  "Aksi",
                ].map((head) => (
                  <th
                    key={head}
                    className="px-3 py-3 bg-olive-500 text-sm font-medium text-white uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <tr key={employee.ID_PEGAWAI}>
                    <td className="pl-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.ID_PEGAWAI}
                    </td>
                    <td className="pl-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.NAMA}
                    </td>
                    <td className="pl-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.TELEPON}
                    </td>
                    <td className="pl-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.ALAMAT}
                    </td>
                    <td className="pl-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.EMAIL}
                    </td>
                    <td className="pl-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.STATUS}
                    </td>
                    <td className="pl-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.TGL_LAHIR
                        ? employee.TGL_LAHIR.substring(0, 10)
                        : "-"}
                    </td>
                    <td className="pl-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.JABATAN}
                    </td>
                    <td className="pl-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => openEditModal(employee)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleToggleEmployeeStatus(
                              employee.ID_PEGAWAI,
                              employee.STATUS,
                              employee.NAMA
                            )
                          }
                          className={
                            employee.STATUS === "active"
                              ? "text-red-500 hover:text-red-600"
                              : "text-green-500 hover:text-green-600"
                          }
                        >
                          {employee.STATUS === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                        <button
                          onClick={() => handleResetPassword(employee)}
                          className="text-yellow-500 hover:text-yellow-600"
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada pegawai ditemukan
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
              {editingEmployeeId ? "Edit Pegawai" : "Tambah Pegawai"}
            </h2>
            <form
              onSubmit={
                editingEmployeeId ? handleUpdateEmployee : handleAddEmployee
              }
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newEmployee.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={newEmployee.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  No. Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={newEmployee.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={newEmployee.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tgl_lahir"
                  value={newEmployee.tgl_lahir}
                  onChange={handleInputChange}
                  max={getTodayDate()}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Jabatan <span className="text-red-500">*</span>
                </label>
                <select
                  name="idJabatan"
                  value={newEmployee.idJabatan}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Pilih Jabatan</option>
                  {jobPositions.map((jabatan) => (
                    <option key={jabatan.ID_JABATAN} value={jabatan.ID_JABATAN}>
                      {jabatan.NAMA}
                    </option>
                  ))}
                </select>
              </div>
              {!editingEmployeeId && (
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={newEmployee.password}
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-black px-4 py-2 rounded-md mr-2 hover:bg-gray-400 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-olive-500 text-white px-4 py-2 rounded-md hover:bg-stone-700 cursor-pointer"
                >
                  {editingEmployeeId ? "Simpan" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePegawai;