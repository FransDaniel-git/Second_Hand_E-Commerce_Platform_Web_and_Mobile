App.jsx
// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Dashboard from "./layouts/Administrator/Dashboard";
import PenitipDashboard from "./layouts/Penitip/components/PenitipDashboard";
import Login from "./auth/login/login";
import ForgotPass from "./auth/login/forgotPass";
import ResetPass from "./auth/login/resetPass";
import Register from "./auth/register/register";
import RegisterTypeSelection from "./auth/register/RegisterTypeSelection";
import RegisterOrganisasi from "./auth/register/RegisterOrganisasi";
import HomePage from "./layouts/user/pages/homepage";
import Catalogue from "./layouts/user/pages/Catalogue";
import UserNavbar from "./layouts/user/components/UserNavbar";
import DetailProduct from "./layouts/user/pages/DetailProduct";
import Profile from "./layouts/user/pages/profile";
import ManagePegawai from "./layouts/Administrator/pages/ManagePegawai";
import ManagePenitip from "./layouts/Administrator/pages/ManagePenitip";
import ManageJabatan from "./layouts/Administrator/pages/ManageJabatan";
import ManageOrganisasi from "./layouts/Administrator/pages/ManageOrganisasi";
import ManageMerchandise from "./layouts/Administrator/pages/ManageMerchandise";
import ManageRequestDonasi from "./layouts/Administrator/pages/ManageRequestDonasi";
import DaftarRequestDonasi from "./layouts/Administrator/pages/DaftarRequestDonasi";
import HistoryDonasi from "./layouts/Administrator/pages/HistoryDonasi";
import ManageBarangTitipan from "./layouts/Administrator/pages/ManageBarangTitipan";
import ManagePengambilanBarang from "./layouts/Administrator/pages/ManagePengambilanBarang";
import ManageOrderList from "./layouts/Administrator/pages/ManageOrderList";
import ManageTransaksiPenitipan from "./layouts/Administrator/pages/ManageTransaksiPenitipan";
import ManageDiskusiBarang from "./layouts/Administrator/pages/ManageDiskusiBarang";
import VerifikasiPembayaran from "./layouts/Administrator/pages/ManageBuktiPembayaran";
import DashboardContent from "./layouts/Administrator/pages/DashboardContent";
import DashboardContentCS from "./layouts/Administrator/pages/DashboardContentCS";
import DashboardContentOwner from "./layouts/Administrator/pages/DashboardContentOwner";
import DashboardContentAdmin from "./layouts/Administrator/pages/DashboardContentAdmin";
import DashboardContentGudang from "./layouts/Administrator/pages/DashboardContentGudang";
import PenitipDashboardContent from "./layouts/Penitip/pages/PenitipDashboardContent";
import PenitipProfile from "./layouts/Penitip/pages/PenitipProfile";
import DaftarBarangTitipan from "./layouts/Penitip/pages/DaftarBarangTitipan";
import DaftarBarangTitipanKadaluarsa from "./layouts/Penitip/pages/DaftarBarangTitipanKadaluarsa";
import HistoryPenjualan from "./layouts/Penitip/pages/HistoryPenjualan";
import AboutPage from "./layouts/user/pages/About";
import Cart from "./layouts/user/pages/Cart";
import Checkout from "./layouts/user/pages/Checkout";
import LaporanOwner from "./layouts/Administrator/pages/LaporanOwner";
import DaftarClaimMerchandise from "./layouts/Administrator/pages/DaftarClaimMerchandise";
import AuthService from "./services/authService";
import MonitoringLogs from "./layouts/Administrator/pages/MonitoringLogs";

const UserLayout = () => {
  return (
    <>
      <UserNavbar />
      <Outlet />
    </>
  );
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  const userType = AuthService.getUserType();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (userType === "pegawai") {
    return <Navigate to="/admin/dashboard" />;
  }

  if (userType === "penitip") {
    return <Navigate to="/penitip/dashboard" />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  const userType = AuthService.getUserType();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (userType !== "pegawai" && userType !== "organisasi") {
    return <Navigate to="/login" />;
  }

  if (
    userType === "organisasi" &&
    window.location.pathname !== "/admin/manage-request-donasi"
  ) {
    return <Navigate to="/admin/manage-request-donasi" />;
  }

  return children;
};

const PenitipRoute = ({ children }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  const userType = AuthService.getUserType();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (userType !== "penitip") {
    return <Navigate to="/login" />;
  }

  return children;
};

const RoleBasedDashboard = () => {
  return <DashboardContentAdmin />;
};

function App() {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgotPass" element={<ForgotPass />} />
        <Route path="/reset-password" element={<ResetPass />} />
        <Route path="/register-selection" element={<RegisterTypeSelection />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-organisasi" element={<RegisterOrganisasi />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<RoleBasedDashboard />} />
          <Route path="manage-pegawai" element={<ManagePegawai />} />
          <Route path="manage-penitip" element={<ManagePenitip />} />
          <Route path="manage-jabatan" element={<ManageJabatan />} />
          <Route path="manage-organisasi" element={<ManageOrganisasi />} />
          <Route path="manage-merchandise" element={<ManageMerchandise />} />
          <Route path="manage-request-donasi" element={<ManageRequestDonasi />} />
          <Route path="daftar-request-donasi" element={<DaftarRequestDonasi />} />
          <Route path="history-donasi" element={<HistoryDonasi />} />
          <Route path="manage-barang-penitipan" element={<ManageBarangTitipan />} />
          <Route path="manage-pengambilan-barang" element={<ManagePengambilanBarang />} />
          <Route path="manage-transaksi-penitipan" element={<ManageTransaksiPenitipan />} />
          <Route path="manage-order-list" element={<ManageOrderList />} />
          <Route path="manage-diskusi" element={<ManageDiskusiBarang />} />
          <Route path="verifikasi-pembayaran" element={<VerifikasiPembayaran />} />
          <Route path="laporan-owner" element={<LaporanOwner />} />
          <Route path="daftar-claim-merchandise" element={<DaftarClaimMerchandise />} />
          <Route path="monitoring-logs" element={<MonitoringLogs />} />
        </Route>

        <Route
          path="/penitip"
          element={
            <PenitipRoute>
              <PenitipDashboard />
            </PenitipRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<PenitipDashboardContent />} />
          <Route path="profile" element={<PenitipProfile />} />
          <Route path="daftar-barang" element={<DaftarBarangTitipan />} />
          <Route path="history-penjualan" element={<HistoryPenjualan />} />
          <Route path="daftar-barang-kadaluarsa" element={<DaftarBarangTitipanKadaluarsa />} />
        </Route>

        <Route element={<UserLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/detail-product/:id" element={<DetailProduct />} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/transaksi/:transactionId" element={<ProtectedRoute><Profile initialTab="pembelian" /></ProtectedRoute>} />
          <Route path="/transaksi/:transactionId" element={<ProtectedRoute><Profile initialTab="detailPembelian" /></ProtectedRoute>} />
          <Route path="/profile/transaksi/:transactionId" element={<ProtectedRoute><Profile initialTab="pembatalan" /></ProtectedRoute>} />
          <Route path="/transaksi/:transactionId" element={<ProtectedRoute><Profile initialTab="detailPembelian" /></ProtectedRoute>} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;