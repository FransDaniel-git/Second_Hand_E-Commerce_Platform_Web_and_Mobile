import React from 'react';

const Footer = () => {
    // Categories data with subcategories
    const categories = [
        {
          name: "Elektronik & Gadget",
          subcategories: [
            "Smartphone & Tablet",
            "Laptop & Komputer",
            "Kamera & Aksesori",
            "Peralatan Audio/Video",
            "Konsol Game & Aksesorinya",
            "Printer & Scanner",
            "Peralatan Dapur Elektronik"
          ]
        },
        {
          name: "Pakaian & Aksesori",
          subcategories: [
            "Pakaian Pria, Wanita, dan Anak",
            "Jaket, Sweater, dan Outerwear",
            "Sepatu, Sandal, dan Boots",
            "Tas, Dompet, dan Ransel",
            "Perhiasan & Aksesori",
            "Topi, Syal, dan Aksesori lainnya"
          ]
        },
        {
          name: "Perabotan Rumah Tangga",
          subcategories: [
            "Sofa, Meja, Kursi",
            "Lemari, Rak Buku, dan Meja TV",
            "Tempat Tidur & Kasur",
            "Peralatan Masak",
            "Dekorasi Rumah",
            "Alat Kebersihan"
          ]
        },
        {
          name: "Buku, Alat Tulis, & Peralatan Sekolah",
          subcategories: [
            "Buku Pelajaran & Buku Bacaan",
            "Buku Koleksi",
            "Alat Tulis",
            "Tas Sekolah & Peralatan Laboratorium",
            "Kalkulator & Alat Ukur"
          ]
        },
        {
          name: "Hobi, Mainan, & Koleksi",
          subcategories: [
            "Mainan Anak",
            "Alat Musik",
            "Perlengkapan Olahraga",
            "Barang Koleksi",
            "Buku Komik, CD Musik, DVD Film",
            "Peralatan Memancing atau Camping"
          ]
        },
        {
          name: "Perlengkapan Bayi & Anak",
          subcategories: [
            "Pakaian Bayi & Anak",
            "Perlengkapan Makan Bayi",
            "Mainan Edukasi",
            "Stroller, Car Seat, & Baby Carrier",
            "Tempat Tidur & Perlengkapan Bayi"
          ]
        },
        {
          name: "Otomotif & Aksesori",
          subcategories: [
            "Sepeda Motor & Sepeda Bekas",
            "Suku Cadang & Aksesori Mobil/Motor",
            "Helm, Jaket Riding, dan Sarung Tangan",
            "Ban, Velg, dan Aksesori Kendaraan",
            "Peralatan Perawatan Kendaraan"
          ]
        },
        {
          name: "Perlengkapan Taman & Outdoor",
          subcategories: [
            "Peralatan Berkebun",
            "Meja & Kursi Taman",
            "Alat BBQ & Outdoor Cooking",
            "Tenda, Sleeping Bag, & Peralatan Camping"
          ]
        },
        {
          name: "Peralatan Kantor & Industri",
          subcategories: [
            "Meja & Kursi Kantor",
            "Lemari Arsip",
            "Mesin Fotokopi, Printer, dan Scanner",
            "Alat-alat Teknik & Perkakas",
            "Rak Gudang & Peralatan Penyimpanan"
          ]
        },
        {
          name: "Kosmetik & Perawatan Diri",
          subcategories: [
            "Alat Kecantikan",
            "Parfum & Produk Perawatan",
            "Aksesori Kecantikan"
          ]
        }
      ];

    return (
        <>
            {/* Categories Section */}
            <section className="py-12 mx-14">
                <div className="">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {categories.map((category, index) => (
                            <div key={index} className="bg-white rounded-lg p-4">
                                <a href="#" className="text-base font-semibold text-gray-900 mb-3 hover:text-stone-600 transition-colors">{category.name}</a>
                                <ul className="space-y-2">
                                    {category.subcategories.map((subcategory, subIndex) => (
                                        <li key={subIndex}>
                                            <a 
                                                href="#" 
                                                className="text-gray-600 hover:text-stone-600 transition-colors text-xs"
                                            >
                                                {subcategory}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="text-stone-800" />

            {/* Footer */}
            <footer className="bg-olive-100 px-16">
                <div className="pt-16 pb-8 mx-3">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-6">
                        <div>
                            <div className="flex-shrink-0 flex items-center">
                                <img className="h-10 w-10" src="/src/assets/logo.png" alt="ReuseMart" />
                                <span className="ml-5 text-3xl font-bold text-stone-600">ReuseMart</span>
                            </div>
                            <p className="flex mt-4 text-base max-w-md leading-relaxed text-gray-500 text-justify mr-8">
                                ReuseMart adalah platform jual beli barang bekas terpercaya di Yogyakarta. Kami mendukung transaksi yang mudah, aman, dan ramah lingkungan untuk memberikan kehidupan baru pada barang bekas.
                            </p>
                            
                            <ul className="mt-6 flex space-x-4">
                                <li>
                                    <a
                                        href="#"
                                        rel="noreferrer"
                                        target="_blank"
                                        className="text-stone-700 transition hover:text-stone-700/75"
                                    >
                                        <span className="sr-only">Facebook</span>
                                        <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path
                                                fillRule="evenodd"
                                                d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </a>
                                </li>

                                <li>
                                    <a
                                        href="#"
                                        rel="noreferrer"
                                        target="_blank"
                                        className="text-stone-700 transition hover:text-stone-700/75"
                                    >
                                        <span className="sr-only">Instagram</span>
                                        <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path
                                                fillRule="evenodd"
                                                d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </a>
                                </li>

                                <li>
                                    <a
                                        href="#"
                                        rel="noreferrer"
                                        target="_blank"
                                        className="text-stone-700 transition hover:text-stone-700/75"
                                    >
                                        <span className="sr-only">Twitter</span>
                                        <svg className="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path
                                                d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
                                            />
                                        </svg>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:col-span-2">
                            <div>
                                <p className="text-lg font-medium text-gray-900">Tentang Kami</p>

                                <ul className="mt-6 space-y-4">
                                    <li>
                                        <a className="text-gray-700 transition hover:text-stone-600" href="/about">
                                            Sejarah Perusahaan
                                        </a>
                                    </li>

                                    <li>
                                        <a className="text-gray-700 transition hover:text-stone-600" href="/about">
                                            Tim Kami
                                        </a>
                                    </li>

                                    <li>
                                        <a className="text-gray-700 transition hover:text-stone-600" href="/about">
                                            Visi & Misi
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <p className="text-lg font-medium text-gray-900">Layanan Kami</p>

                                <ul className="mt-6 space-y-4">
                                    <li>
                                        <a className="text-gray-700 transition hover:text-stone-600" href="/about">
                                            Jual Barang Bekas
                                        </a>
                                    </li>

                                    <li>
                                        <a className="text-gray-700 transition hover:text-stone-600" href="#">
                                            Beli Barang Bekas
                                        </a>
                                    </li>

                                    <li>
                                        <a className="text-gray-700 transition hover:text-stone-600" href="/about">
                                            Request Donasi
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <p className="text-lg font-medium text-gray-900">Bantuan</p>

                                <ul className="mt-6 space-y-4">
                                    <li>
                                        <a className="text-gray-700 transition hover:text-stone-600" href="/about">
                                            Tanya Jawab
                                        </a>
                                    </li>

                                    <li>
                                        <a className="text-gray-700 transition hover:text-stone-600" href="/about">
                                            Pusat Bantuan
                                        </a>
                                    </li>

                                    <li>
                                        <a className="group flex items-center gap-1.5" href="#">
                                            <span className="text-gray-700 transition group-hover:text-stone-600">
                                                Lokasi Kami
                                            </span>

                                            <span className="relative flex size-2">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-stone-400 opacity-75"></span>
                                                <span className="relative inline-flex size-2 rounded-full bg-stone-500"></span>
                                            </span>
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <p className="text-lg font-medium text-gray-900">Kontak Kami</p>

                                <ul className="mt-6 space-y-4">
                                    <li>
                                        <a className="flex items-center gap-1.5" href="/about">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="size-5 shrink-0 text-gray-900"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                />
                                            </svg>

                                            <span className="text-gray-700">reusemart@gmail.com</span>
                                        </a>
                                    </li>

                                    <li>
                                        <a className="flex items-center gap-1.5" href="/about">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="size-5 shrink-0 text-gray-900"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                />
                                            </svg>

                                            <span className="text-gray-700">0123456789</span>
                                        </a>
                                    </li>

                                    <li className="flex items-start gap-1.5">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="size-5 shrink-0 text-gray-900"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>

                                        <address className="not-italic text-gray-700">
                                            Barbarsari, Sleman, Yogyakarta, Indonesia
                                        </address>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-7">
                        <div className="text-center sm:flex sm:justify-between sm:text-left">
                            <p className="text-gray-500">
                                <span className="block sm:inline">Hak cipta dilindungi. </span>

                                <a className="inline-block text-stone-600 underline transition hover:text-stone-600/75" href="#">
                                    Syarat & Ketentuan
                                </a>

                                <span>·</span>

                                <a className="inline-block text-stone-600 underline transition hover:text-stone-600/75" href="#">
                                    Kebijakan Privasi
                                </a>
                            </p>

                            <p className="mt-4 text-gray-500 sm:order-first sm:mt-0">© 2025 ReuseMart</p>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;