import React, { useState, useEffect } from "react";
import { Menu, Bell, User } from "lucide-react";
import { Link } from "react-router-dom";

const PenitipHeader = ({ sidebarOpen, setSidebarOpen }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (userData) {
      setUserData(userData);
    }
  }, []);

  return (
    <header
      className={`bg-white shadow-lg fixed top-0 left-0 flex items-center w-full z-10 transition-all duration-300 ${
        sidebarOpen ? "sm:ml-64 " : "sm:ml-20"
      } ml-0 `}
    >
      <div
        className={`relative w-full flex items-center justify-between p-4 pr-6 ${
          sidebarOpen ? "sm:mr-64" : "sm:mr-20"
        } `}
      >
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Dashboard Penitip
          </h1>
          <p className="text-sm text-olive-500">
            Selamat datang, {userData?.nama || "Penitip"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button className="p-2 rounded-lg hover:bg-gray-100 relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <Link to="/penitip/profile" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-olive-500 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            </Link>
          </div>
        </div>
        {/* Show menu button only on mobile */}
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

export default PenitipHeader;
