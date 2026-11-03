// src/layouts/Administrator/pages/DashboardContentCS.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import DashboardContent from './DashboardContent';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardContentCS = () => {
  const [pendingDiscussions, setPendingDiscussions] = useState(0);
  const [unverifiedPayments, setUnverifiedPayments] = useState(0);
  const [unclaimedMerchandise, setUnclaimedMerchandise] = useState(0);
  const [discussionData, setDiscussionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCS, setIsCS] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        console.log('Token:', token);

        const [discussionsResponse, paymentsResponse, claimsResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/cs/product-discussions', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8000/api/cs/verifikasi-pembayaran', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8000/api/cs/daftar-claim-merchandise', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        console.log('Discussions Response:', discussionsResponse.data);
        console.log('Payments Response:', paymentsResponse.data);
        console.log('Claims Response:', claimsResponse.data);

        // Tangani struktur data secara fleksibel
        const discussions = discussionsResponse.data.data || discussionsResponse.data || [];
        const payments = paymentsResponse.data.data || paymentsResponse.data || [];
        const claims = claimsResponse.data.data || claimsResponse.data || [];

        setPendingDiscussions(
          discussions.filter(d => d.STATUS_BALASAN === 'Belum Dibalas').length
        );
        setUnverifiedPayments(payments.filter(p => !p.verified_at).length);
        setUnclaimedMerchandise(claims.filter(c => !c.TANGGAL_DIKLAIM).length);

        // Prepare discussion data for the last 7 days
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const dailyDiscussions = last7Days.map(date =>
          discussions.filter(
            d => new Date(d.TANGGAL_DISKUSI).toISOString().split('T')[0] === date
          ).length
        );
        setDiscussionData(dailyDiscussions);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching CS dashboard data:', error);
        console.log('Error Response:', error.response);
        console.log('Error Message:', error.message);
        if (error.response && [401, 403].includes(error.response.status)) {
          setIsCS(false);
        } else {
          setError(
            error.response?.data?.message ||
              `Gagal memuat data dashboard: ${error.message}`
          );
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Memuat...</div>;
  }

  if (!isCS) {
    return <DashboardContent />;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow-md mx-auto mt-10 w-full max-w-4xl">
        {error}
      </div>
    );
  }

  // Grafik Diskusi Harian
  const discussionChartData = {
    labels: ['-6', '-5', '-4', '-3', '-2', '-1', '0'],
    datasets: [
      {
        label: 'Diskusi Harian',
        data: discussionData,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Grafik Diskusi Belum Dibalas
  const pendingDiscussionsChartData = {
    labels: ['Diskusi Belum Dibalas'],
    datasets: [
      {
        label: 'Jumlah',
        data: [pendingDiscussions],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Grafik Pembayaran Belum Terverifikasi
  const unverifiedPaymentsChartData = {
    labels: ['Pembayaran Belum Terverifikasi'],
    datasets: [
      {
        label: 'Jumlah',
        data: [unverifiedPayments],
        backgroundColor: 'rgba(234, 179, 8, 0.6)',
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Grafik Merchandise Belum Diklaim
  const unclaimedMerchandiseChartData = {
    labels: ['Merchandise Belum Diklaim'],
    datasets: [
      {
        label: 'Jumlah',
        data: [unclaimedMerchandise],
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }, // Judul digantikan oleh h2
    },
    scales: {
      y: { beginAtZero: true, title: { display: false } },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard CS</h1>
        {/* Kartu Statistik di Atas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="Diskusi Belum Dibalas"
            value={pendingDiscussions}
            bgColor="bg-blue-200"
          />
          <StatCard
            title="Pembayaran Belum Terverifikasi"
            value={unverifiedPayments}
            bgColor="bg-yellow-200"
          />
          <StatCard
            title="Merchandise Belum Diklaim"
            value={unclaimedMerchandise}
            bgColor="bg-red-200"
          />
        </div>
        {/* Grafik di Bawah */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grafik Diskusi Harian */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Diskusi Harian</h2>
            <Bar data={discussionChartData} options={chartOptions} />
          </div>
          {/* Grafik Diskusi Belum Dibalas */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Diskusi Belum Dibalas</h2>
            <Bar data={pendingDiscussionsChartData} options={chartOptions} />
          </div>
          {/* Grafik Pembayaran Belum Terverifikasi */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Pembayaran Belum Terverifikasi</h2>
            <Bar data={unverifiedPaymentsChartData} options={chartOptions} />
          </div>
          {/* Grafik Merchandise Belum Diklaim */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Merchandise Belum Diklaim</h2>
            <Bar data={unclaimedMerchandiseChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContentCS;