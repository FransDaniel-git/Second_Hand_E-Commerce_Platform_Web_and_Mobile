import React, { useState, useEffect } from 'react';

const ManageDiskusi = () => {
  const [diskusi, setDiskusi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDiskusi, setNewDiskusi] = useState({
    ID_PEGAWAI: '',
    ID_PEMBELI: '',
    ID_PENITIP: '',
    KODE_PRODUK: '',
    PESAN: '',
    TANGGAL_DIBUAT: '',
  });

  useEffect(() => {
    setTimeout(() => {
      setDiskusi([
        {
          ID_BALASANDISKUSI: 1,
          ID_PEGAWAI: 'PG001',
          ID_PEMBELI: '',
          ID_PENITIP: '',
          KODE_PRODUK: 'PRD001',
          PESAN: 'Produk ini masih tersedia?',
          TANGGAL_DIBUAT: '2025-04-20',
        },
        {
          ID_BALASANDISKUSI: 2,
          ID_PEGAWAI: '',
          ID_PEMBELI: 'PL001',
          ID_PENITIP: '',
          KODE_PRODUK: 'PRD001',
          PESAN: 'Iya, tersedia hingga akhir bulan.',
          TANGGAL_DIBUAT: '2025-04-21',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredDiskusi = diskusi.filter((d) =>
    d.PESAN.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDiskusi({ ...newDiskusi, [name]: value });
  };

  const handleAddDiskusi = () => {
    const newId = diskusi.length > 0 ? diskusi[diskusi.length - 1].ID_BALASANDISKUSI + 1 : 1;
    const diskusiToAdd = {
      ID_BALASANDISKUSI: newId,
      ...newDiskusi,
    };
    setDiskusi([...diskusi, diskusiToAdd]);
    setIsModalOpen(false);
    setNewDiskusi({
      ID_PEGAWAI: '',
      ID_PEMBELI: '',
      ID_PENITIP: '',
      KODE_PRODUK: '',
      PESAN: '',
      TANGGAL_DIBUAT: '',
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-10">Manage Diskusi Produk</h1>

      <div className="flex justify-between mb-6">
        <input
          type="text"
          placeholder="Cari pesan..."
          value={searchTerm}
          onChange={handleSearch}
          className="p-2 border border-gray-300 rounded-md w-1/3"
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-stone-600 text-white px-4 py-3 text-lg rounded-md hover:bg-stone-700"
        >
          + Tambah Diskusi
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow mt-10">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {['ID', 'Produk', 'Pesan', 'Tanggal', 'Pegawai', 'Pembeli', 'Penitip', 'Aksi'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 bg-stone-600 text-lg font-medium text-white uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDiskusi.map((d) => (
                <tr key={d.ID_BALASANDISKUSI}>
                  <td className="px-6 py-4 whitespace-nowrap">{d.ID_BALASANDISKUSI}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{d.KODE_PRODUK}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{d.PESAN}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{d.TANGGAL_DIBUAT}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{d.ID_PEGAWAI}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{d.ID_PEMBELI}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{d.ID_PENITIP}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="text-red-500 hover:text-red-600"
                      onClick={() => {
                        if (confirm('Yakin ingin menghapus diskusi ini?')) {
                          setDiskusi(diskusi.filter((dsk) => dsk.ID_BALASANDISKUSI !== d.ID_BALASANDISKUSI));
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-2/3">
            <h2 className="text-xl font-bold mb-4">Tambah Balasan Diskusi</h2>
            <form>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="KODE_PRODUK"
                  placeholder="Kode Produk"
                  value={newDiskusi.KODE_PRODUK}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <input
                  name="TANGGAL_DIBUAT"
                  type="date"
                  value={newDiskusi.TANGGAL_DIBUAT}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <input
                  name="ID_PEGAWAI"
                  placeholder="ID Pegawai"
                  value={newDiskusi.ID_PEGAWAI}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <input
                  name="ID_PEMBELI"
                  placeholder="ID Pembeli"
                  value={newDiskusi.ID_PEMBELI}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <input
                  name="ID_PENITIP"
                  placeholder="ID Penitip"
                  value={newDiskusi.ID_PENITIP}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <textarea
                  name="PESAN"
                  rows="3"
                  placeholder="Isi pesan"
                  value={newDiskusi.PESAN}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md col-span-2"
                />
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded-md mr-2 hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddDiskusi}
                  className="bg-stone-500 text-white px-4 py-2 rounded-md hover:bg-stone-600"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDiskusi;
