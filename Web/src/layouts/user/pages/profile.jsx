import React, { useEffect, useState } from "react";
import { User, ShoppingBag, Bell, Package, LogOut } from "lucide-react";
import AddressManagement from "../components/ManageAddress";
import HistoryPembelian from "../components/HistoryPembelian";
import DetailPembelian from "../components/DetailPembelian";
import Batal from "../components/Batal";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AuthService from "../../../services/authService";
import Swal from "sweetalert2";

export default function Profile({ initialTab = "profile" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [userRoles, setUserRoles] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [userType, setUserType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { transactionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      customClass: {
        popup: "swal2-sm-popup",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        AuthService.logout();
        localStorage.removeItem("userInitials");
        window.dispatchEvent(new Event("authChange"));
        navigate("/");
        Swal.fire({
          title: "Logged Out",
          text: "Anda telah berhasil logout.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: "swal2-sm-popup",
          },
        });
      }
    });
  };

  useEffect(() => {
    const getUserData = () => {
      try {
        setIsLoading(true);

        const userData = JSON.parse(localStorage.getItem("userData"));
        const userType = localStorage.getItem("userType");

        if (!userData || !userType) {
          console.error("No user data or userType found in localStorage");
          setError("User data not found. Please log in again.");
          setIsLoading(false);
          return;
        }

        setUserType(userType);
        setUserRoles(userData.role || []);
        setUserPermissions(userData.permissions || []);

        // Only set activeTab based on initialTab or state on first load
        const txId = transactionId || location.state?.transactionId;
        const activeTabFromState = location.state?.activeTab;
        if (activeTab !== initialTab && activeTab !== activeTabFromState) {
          if (
            txId &&
            userType === "pembeli" &&
            hasPermission("view-history-pembelian")
            // ,
            // txId &&
            // userType === "pembeli" &&
            // hasPermission("view-history-pembelian-batal")
          ) {
            setActiveTab(initialTab);
          } else if (activeTabFromState) {
            setActiveTab(activeTabFromState);
          } else {
            setActiveTab(initialTab);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load user data:", error);
        setError("Failed to load user data.");
        setIsLoading(false);
      }
    };

    getUserData();
  }, [transactionId, location.state, initialTab]);

  const hasRole = (role) => userRoles.includes(role);
  const hasPermission = (permission) => userPermissions.includes(permission);

  const handleBackToHistory = () => {
    navigate("/profile", { state: { activeTab: "pembelian" } });
  };

  if (isLoading) {
    return (
      <div className="text-center text-gray-600 mt-10">
        Memuat data profil...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 mt-10">{error}</div>;
  }

  return (
    <div className="flex h-[80vh] rounded-2xl mx-16 mt-28">
      <div className="w-64 bg-white">
        <div className="py-6 px-3">
          <h1 className="text-2xl font-bold text-olive-500">Profil Pengguna</h1>
        </div>
        <div className="px-2">
          <SidebarItem
            icon={<User size={24} />}
            text="Informasi Pengguna"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          {hasRole("pembeli") && hasPermission("view-history-pembelian") && (
            <SidebarItem
              icon={<ShoppingBag size={24} />}
              text="Transaksi Pembelian"
              active={
                activeTab === "pembelian" || activeTab === "detailPembelian"
              }
              onClick={() => setActiveTab("pembelian")}
            />
            
          )}
          {hasRole("pembeli") && hasPermission("view-history-pembelian") && (
            <SidebarItem
              icon={<ShoppingBag size={24} />}
              text="Pembatalan Transaksi Valid"
              active={
                activeTab === "pembatalan" || activeTab === "detailPembatalan"
              }
              onClick={() => setActiveTab("pembatalan")}
            />
          )}
          {hasRole("penitip") && hasPermission("view-history-penitipan") && (
            <SidebarItem
              icon={<Package size={24} />}
              text="Transaksi Penitipan"
              active={activeTab === "penitipan"}
              onClick={() => setActiveTab("penitipan")}
            />
          )}
          <SidebarItem
            icon={<Bell size={24} />}
            text="Notifikasi"
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
          />
          <SidebarItem
            icon={<LogOut size={24} />}
            text="Keluar"
            active={false}
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          />
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {activeTab === "profile" && <ProfilePage />}
        {activeTab === "pembelian" && (
          <HistoryPembelian
            initialTransactionId={
              transactionId || location.state?.transactionId
            }
          />
        )}
        {activeTab === "detailPembelian" && (
          <DetailPembelian
            transactionId={transactionId}
            onBack={handleBackToHistory}
          />
        )}
        {activeTab === "pembatalan" && (
          <Batal
            initialTransactionId={
              transactionId || location.state?.transactionId
            }
          />
        )}
        {activeTab === "detailPembatalan" && (
          <DetailPembelian
            transactionId={transactionId}
            onBack={handleBackToHistory}
          />
        )}
        {activeTab === "penitipan" && <HistoryPenitipan />}
        {activeTab === "notifications" && (
          <PlaceholderPage title="Notifications" />
        )}
      </div>
    </div>
  );
}

function SidebarItem({ icon, text, active, onClick, className = "" }) {
  return (
    <div
      className={`flex items-center text-lg p-2 mb-3 rounded-lg cursor-pointer ${
        active
          ? "bg-olive-300 text-olive-500 font-medium"
          : `text-gray-500 hover:bg-gray-100 ${className}`
      }`}
      onClick={onClick}
    >
      <div className="mr-3">{icon}</div>
      <span>{text}</span>
      {active && <div className="ml-auto w-1 h-5 bg-olive-500 rounded"></div>}
    </div>
  );
}

function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const response = await axios.get(
          "http://localhost:8000/api/auth/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUserData(response.data);

        localStorage.setItem(
          "userData",
          JSON.stringify({
            role: response.data.user.role || [],
            permissions: response.data.user.permissions || [],
          })
        );
        localStorage.setItem("userType", response.data.user_type || "");
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
        setError("Failed to fetch profile data.");
      }
    };

    fetchProfile();
  }, []);

  if (error) {
    return <div className="text-center text-red-600 mt-10">{error}</div>;
  }

  if (!userData) {
    return (
      <div className="text-center text-gray-600 mt-10">
        Memuat data profil...
      </div>
    );
  }

  const { user_type, user } = userData;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      <h2 className="text-2xl font-semibold text-olive-500 mb-7">
        Manajemen Profile
      </h2>
      <div className="flex items-center space-x-6">
        <img
          src="src/assets/user.png"
          alt="Profile"
          className="w-16 h-16 rounded-full object-cover border-2 border-stone-300"
        />
        <div>
          <h2 className="text-2xl font-semibold text-stone-700">{user.nama}</h2>
          <p className="text-olive-500 text-lg">{user.email}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-stone-700">
        {user_type !== "organisasi" && (
          <ProfileItem label="Poin Loyalitas" value={user.poin ?? "-"} />
        )}
        <ProfileItem label="No. Telepon" value={user.telepon} />
        {user_type === "penitip" && (
          <ProfileItem label="Saldo" value={user.saldo} />
        )}
        {user_type === "organisasi" && (
          <>
            <ProfileItem label="Alamat" value={user.alamat} />
            <ProfileItem label="Telepon" value={user.telepon} />
            <ProfileItem label="Deskripsi" value={user.deskripsi} />
          </>
        )}
      </div>

      <hr className="text-olive-500 my-5" />
      {user_type === "pembeli" && <AddressManagement />}
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-olive-500 mb-1">{label}</p>
      <div className="py-2 px-3 rounded-lg bg-olive-100">{value}</div>
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="text-center text-gray-500 mt-20">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p>Fitur ini belum tersedia.</p>
    </div>
  );
}