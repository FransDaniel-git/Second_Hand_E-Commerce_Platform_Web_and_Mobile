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

const DashboardContentAdmin = () => {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalOrganizations, setTotalOrganizations] = useState(0);
  const [totalJobPositions, setTotalJobPositions] = useState(0);
  const [totalMerchandise, setTotalMerchandise] = useState(0);
  const [employeeRoleData, setEmployeeRoleData] = useState([]);
  const [organizationStatusData, setOrganizationStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) {
          throw new Error('Silakan login untuk mengakses dashboard.');
        }

        const [employeesResponse, organizationsResponse, jobPositionsResponse, merchandiseResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/admin/manage-pegawai', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8000/api/admin/manage-organisasi', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8000/api/admin/manage-jabatan', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:8000/api/admin/manage-merchandise', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const employees = employeesResponse.data || [];
        const organizations = organizationsResponse.data || [];
        const jobPositions = jobPositionsResponse.data || [];
        const merchandise = merchandiseResponse.data || [];

        setTotalEmployees(employees.length);
        setTotalOrganizations(organizations.length);
        setTotalJobPositions(jobPositions.length);
        setTotalMerchandise(merchandise.length);

        // Prepare employee data by role
        const roleCounts = {
          admin: employees.filter(e => e.JABATAN.toLowerCase() === 'admin').length,
          cs: employees.filter(e => e.JABATAN.toLowerCase() === 'cs').length,
          gudang: employees.filter(e => e.JABATAN.toLowerCase() === 'gudang').length,
          kurir: employees.filter(e => e.JABATAN.toLowerCase() === 'kurir').length,
          hunter: employees.filter(e => e.JABATAN.toLowerCase() === 'hunter').length,
        };
        setEmployeeRoleData([
          roleCounts.admin,
          roleCounts.cs,
          roleCounts.gudang,
          roleCounts.kurir,
          roleCounts.hunter,
        ]);

        // Prepare organization status data
        const activeCount = organizations.filter(o => o.STATUS === 'active').length;
        const inactiveCount = organizations.filter(o => o.STATUS === 'inactive').length;
        setOrganizationStatusData([activeCount, inactiveCount]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        if (error.response && [401, 403].includes(error.response.status)) {
          setIsAdmin(false);
        } else {
          setError(
            error.response?.data?.message ||
            'Gagal memuat data dashboard. Silakan coba lagi.'
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

  if (!isAdmin) {
    return <DashboardContent />;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow-md mx-auto mt-10 w-full max-w-4xl">
        {error}
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, title: { display: false } },
    },
  };

  const employeeRoleChartData = {
    labels: ['Admin', 'CS', 'Gudang', 'Kurir', 'Hunter'],
    datasets: [
      {
        label: 'Jumlah Pegawai per Jabatan',
        data: employeeRoleData,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const totalEmployeesChartData = {
    labels: ['Total Pegawai'],
    datasets: [
      {
        label: 'Jumlah',
        data: [totalEmployees],
        backgroundColor: 'rgba(234, 179, 8, 0.6)',
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 1,
      },
    ],
  };

  const organizationStatusChartData = {
    labels: ['Status Organisasi'],
    datasets: [
      {
        label: 'Aktif',
        data: [organizationStatusData[0]],
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      },
      {
        label: 'Tidak Aktif',
        data: [organizationStatusData[1]],
        backgroundColor: 'rgba(107, 114, 128, 0.6)',
        borderColor: 'rgba(107, 114, 128, 1)',
        borderWidth: 1,
      },
    ],
  };

  const totalJobPositionsChartData = {
    labels: ['Total Jabatan'],
    datasets: [
      {
        label: 'Jumlah',
        data: [totalJobPositions],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  const totalMerchandiseChartData = {
    labels: ['Total Merchandise'],
    datasets: [
      {
        label: 'Jumlah',
        data: [totalMerchandise],
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard Admin</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Pegawai"
            value={totalEmployees}
            bgColor="bg-yellow-200"
          />
          <StatCard
            title="Total Organisasi"
            value={totalOrganizations}
            bgColor="bg-purple-200"
          />
          <StatCard
            title="Total Jabatan"
            value={totalJobPositions}
            bgColor="bg-green-200"
          />
          <StatCard
            title="Total Merchandise"
            value={totalMerchandise}
            bgColor="bg-red-200"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Pegawai per Jabatan</h2>
            <Bar data={employeeRoleChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Total Pegawai</h2>
            <Bar data={totalEmployeesChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Status Organisasi</h2>
            <Bar data={organizationStatusChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Total Jabatan</h2>
            <Bar data={totalJobPositionsChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4">Total Merchandise</h2>
            <Bar data={totalMerchandiseChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContentAdmin;