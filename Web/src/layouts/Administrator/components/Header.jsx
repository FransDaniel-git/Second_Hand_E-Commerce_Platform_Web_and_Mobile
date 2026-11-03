import React from "react";
import { Menu } from "lucide-react";

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header
      className={`bg-white shadow-lg fixed top-0 left-0 flex items-center w-full z-10 transition-all duration-300 ${
        sidebarOpen ? "sm:ml-64" : "sm:ml-20"
      } ml-0`}
    >
      <div className="relative w-full flex items-center justify-between p-4 pr-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-sm text-olive-500">
            Welcome back, Pegawai ReuseMart
          </p>
        </div>

        {/* Show menu button only on mobile (smaller than sm breakpoint) */}
        <div className="block sm:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-olive-500 hover:text-white"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
