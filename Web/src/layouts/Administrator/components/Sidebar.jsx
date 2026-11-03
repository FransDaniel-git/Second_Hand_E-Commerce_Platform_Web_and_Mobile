import React, { useState, useEffect } from "react";
import {
  Menu,
  PanelLeftClose,
  Home,
  Users,
  UserPlus,
  Briefcase,
  Building2,
  Package,
  HandHelping,
  HeartHandshake,
  History,
  LogOut,
  CheckCircle,
  ClipboardList,
  Boxes,
  Truck,
  PackageCheck,
  Clipboard,
  DiscAlbum,
  UserPenIcon,
  GiftIcon,
  Activity,
} from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import LaporanOwner from "../pages/LaporanOwner";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [userRoles, setUserRoles] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [userType, setUserType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserData = () => {
      try {
        setIsLoading(true);
        const userData = JSON.parse(localStorage.getItem("userData"));
        const userType = localStorage.getItem("userType");

        if (!userData) {
          console.error("No user data found in localStorage");
          setIsLoading(false);
          return;
        }

        setUserType(userType || "");
        setUserRoles(userData.role || []);
        setUserPermissions(userData.permissions || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load user data:", error);
        setIsLoading(false);
      }
    };

    getUserData();
  }, []);

  const hasRole = (role) => userRoles.includes(role);
  const hasPermission = (permission) => userPermissions.includes(permission);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("userData");
    navigate("/login");
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="bg-white text-black fixed h-full z-50 w-64 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-olive-100 text-black transition-all duration-300 fixed h-full z-50 ${
        sidebarOpen ? "w-64" : "sm:w-20 w-64"
      } ${sidebarOpen ? "left-0" : "sm:left-0 -left-full"}`}
    >
      <div className="flex items-center justify-between p-6 border-b border-stone-400">
        {(sidebarOpen || window.innerWidth < 640) && (
          <div className="flex items-center space-x-2 mr-3">
            <img src="/src/assets/logo.png" alt="Logo" className="h-6 w-6" />
            <h1 className="text-xl font-bold text-olive-500">ReuseMart</h1>
          </div>
        )}
        <div className="sm:block hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-olive-500 hover:text-white"
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className="sm:hidden block">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-olive-500 hover:text-white"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>
      </div>

      <nav className="mt-6">
        {!hasRole("organisasi") && (
          <SidebarItem
            icon={<Home />}
            text="Dashboard"
            path="dashboard"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {(hasRole("admin") || hasRole("adminbiasa")) &&
          hasPermission("manage-pegawai") && (
            <SidebarItem
              icon={<Users />}
              text="Manage Pegawai"
              path="manage-pegawai"
              expanded={sidebarOpen || window.innerWidth < 640}
            />
          )}
        {hasRole("cs") && hasPermission("manage-penitip") && (
          <SidebarItem
            icon={<UserPlus />}
            text="Manage Penitip"
            path="manage-penitip"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {hasRole("cs") && (
          <SidebarItem
            icon={<UserPenIcon />}
            text="Manage Diskusi"
            path="manage-diskusi"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {hasRole("cs") && hasPermission("manage-penitip") && (
          <SidebarItem
            icon={<CheckCircle />}
            text="Verifikasi Pembayaran"
            path="verifikasi-pembayaran"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {hasRole("cs") && (
          <SidebarItem
            icon={<GiftIcon />}
            text="Daftar Klaim Merchandise"
            path="daftar-claim-merchandise"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}

        {(hasRole("admin") || hasRole("adminbiasa")) &&
          hasPermission("manage-jabatan") && (
            <SidebarItem
              icon={<Briefcase />}
              text="Manage Jabatan"
              path="manage-jabatan"
              expanded={sidebarOpen || window.innerWidth < 640}
            />
          )}
        {(hasRole("admin") || hasRole("adminbiasa")) &&
          hasPermission("manage-organisasi") && (
            <SidebarItem
              icon={<Building2 />}
              text="Manage Organisasi"
              path="manage-organisasi"
              expanded={sidebarOpen || window.innerWidth < 640}
            />
          )}
        {(hasRole("admin") || hasRole("adminbiasa")) &&
          hasPermission("manage-merchandise") && (
            <SidebarItem
              icon={<Package />}
              text="Manage Merchandise"
              path="manage-merchandise"
              expanded={sidebarOpen || window.innerWidth < 640}
            />
          )}
        {hasRole("admin") && (
          <SidebarItem
            icon={<Activity />}
            text="Monitoring Logs"
            path="monitoring-logs"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {hasRole("organisasi") && hasPermission("manage-request-donasi") && (
          <SidebarItem
            icon={<HandHelping />}
            text="Manage Request Donasi"
            path="manage-request-donasi"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {hasRole("owner") && hasPermission("manage-donasi") && (
          <SidebarItem
            icon={<HeartHandshake />}
            text="Manage Donasi"
            path="daftar-request-donasi"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {hasRole("owner") && hasPermission("history-donasi") && (
          <SidebarItem
            icon={<History />}
            text="History Donasi"
            path="history-donasi"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {hasRole("owner") && (
          <SidebarItem
            icon={<ClipboardList />}
            text="Laporan"
            path="laporan-owner"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}

        {hasRole("gudang") && hasPermission("manage-transaksi-penitipan") && (
          <SidebarItem
            icon={<ClipboardList />}
            text="Manage Penitipan"
            path="manage-transaksi-penitipan"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {hasRole("gudang") && hasPermission("manage-barang-penitipan") && (
          <SidebarItem
            icon={<Boxes />}
            text="Manage Barang Titipan"
            path="manage-barang-penitipan"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {hasRole("gudang") && hasPermission("manage-barang-penitipan") && (
          <SidebarItem
            icon={<Truck />}
            text="Manage Pengambilan Barang"
            path="manage-pengambilan-barang"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}
        {hasRole("gudang") && hasPermission("manage-barang-penitipan") && (
          <SidebarItem
            icon={<PackageCheck />}
            text="Manage Daftar Pesanan"
            path="manage-order-list"
            expanded={sidebarOpen || window.innerWidth < 640}
          />
        )}

        <div className="absolute bottom-0 w-full border-t border-stone-400 p-2">
          <button
            onClick={() => {
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
                  handleLogout();
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
            }}
            className={`flex items-center w-full p-3 rounded-lg hover:bg-black hover:text-white transition-colors duration-200 ${
              sidebarOpen || window.innerWidth < 640
                ? "justify-start"
                : "justify-center"
            }`}
            title="Logout"
          >
            <LogOut size={20} />
            {(sidebarOpen || window.innerWidth < 640) && (
              <span className="ml-3">Logout</span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
