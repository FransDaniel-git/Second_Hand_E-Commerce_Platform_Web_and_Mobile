import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // pakai Outlet, bukan Routes
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      if (window.innerWidth >= 640) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-auto  w-full overflow-x-hidden relative">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} />

      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className={`flex-1 transition-all duration-300 mt-20 ${isMobile ? 'ml-0' : (sidebarOpen ? 'ml-64' : 'ml-20')} w-full`}>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} />
        <main className="p-6 w-full overflow-x-hidden">
          <Outlet /> {/* ⬅️ Ini tempat halaman anak-anak admin (dashboard content, manage pegawai, dll) */}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
