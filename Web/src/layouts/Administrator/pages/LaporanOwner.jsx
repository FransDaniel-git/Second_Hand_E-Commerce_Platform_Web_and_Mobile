import React, { useState } from 'react';
import PenjualanBulananKeseluruhan from './laporan/PenjualanBulananKeseluruhan';
import KomisiBulananPerProduk from './laporan/KomisiBulananPerProduk';
import StokGudang from './laporan/StokGudang';
import PenjualanPerKategori from './laporan/PenjualanPerKategori';
import MasaPenitipanHabis from './laporan/MasaPenitipanHabis';
import DonasiBarang from './laporan/DonasiBarang';
import RequestDonasiBelumTerpenuhi from './laporan/RequestDonasiBelumTerpenuhi';
import TransaksiPenitip from './laporan/TransaksiPenitip';

const LaporanOwner = () => {
  const [currentPage, setPage] = useState("Penjualan Bulanan Keseluruhan");

  const menuItems = [
    "Penjualan Bulanan Keseluruhan",
    "Laporan Komisi Bulanan per Produk",
    "Laporan Stok Gudang",
    "Laporan Penjualan per Kategori Barang",
    "Laporan Barang yang Masa Penitipannya Sudah Habis",
    "Laporan Donasi Barang",
    "Laporan Request Donasi",
    "Laporan Transaksi Penitip",
  ];


  const LaporanTransaksiPenitip = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-olive-500 mb-4">Laporan Transaksi Penitip</h2>
      <p>Placeholder for consignment transaction report.</p>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case "Penjualan Bulanan Keseluruhan":
        return <PenjualanBulananKeseluruhan />;
      case "Laporan Komisi Bulanan per Produk":
        return <KomisiBulananPerProduk />;
      case "Laporan Stok Gudang":
        return <StokGudang />;
      case "Laporan Penjualan per Kategori Barang":
        return <PenjualanPerKategori />;
      case "Laporan Barang yang Masa Penitipannya Sudah Habis":
        return <MasaPenitipanHabis />;
      case "Laporan Donasi Barang":
        return <DonasiBarang />;
      case "Laporan Request Donasi":
        return <RequestDonasiBelumTerpenuhi />;
      case "Laporan Transaksi Penitip":
        return <TransaksiPenitip />;
      default:
        return <PenjualanBulananKeseluruhan />;
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Top Menu Bar */}
        <h1 className="text-3xl font-bold mb-8">Laporan</h1>
        {/* Sub-page Tabs */}
        <div className="bg-white shadow rounded-2xl">
            <div className="flex border-b">
            {menuItems.map((item, index) => (
                <button
                key={index}
                className={`px-4 py-2 text-gray-600 hover:text-olive-500 border-b-2 ${
                    currentPage === item ? 'border-olive-500 text-olive-500' : 'border-transparent'
                }`}
                onClick={() => setPage(item)}
                >
                {item}
                </button>
            ))}
            </div>
            <div>{renderPage()}</div>
        </div>
        </div>
    );
};

export default LaporanOwner;