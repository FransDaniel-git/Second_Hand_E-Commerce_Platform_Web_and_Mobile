import { motion } from "framer-motion";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import Footer from "../components/Footer";
import { useState } from "react";

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "Apa itu ReuseMart?",
      answer: "ReuseMart adalah platform jual beli barang bekas berkualitas di Yogyakarta yang mendukung gaya hidup berkelanjutan. Kami memfasilitasi transaksi barang bekas layak pakai, seperti pakaian, perabot, dan elektronik, dengan proses yang mudah dan terpercaya."
    },
    {
      question: "Bagaimana cara menitipkan barang di ReuseMart?",
      answer: "Untuk menitipkan barang, Anda perlu datang ke gudang kami di Yogyakarta, mendaftar sebagai penitip, lalu barang akan diperiksa oleh tim kami. Jika memenuhi syarat, barang akan difoto dan diunggah ke platform. Anda akan menerima notifikasi saat barang terjual."
    },
    {
      question: "Apakah ada biaya untuk menitipkan barang?",
      answer: "Kami mengenakan biaya penitipan yang kompetitif, yang akan dijelaskan saat Anda mendaftar sebagai penitip. Biaya ini mencakup pemeriksaan, fotografi, dan promosi barang Anda."
    },
    {
      question: "Bagaimana ReuseMart memastikan kualitas barang bekas?",
      answer: "Setiap barang yang dititipkan diperiksa secara menyeluruh oleh tim kami untuk memastikan kondisi dan fungsionalitasnya. Kami hanya menerima barang bekas yang masih layak pakai dan sesuai dengan standar kualitas kami."
    },
    {
      question: "Apakah ReuseMart ramah lingkungan?",
      answer: "Ya, ReuseMart berkomitmen pada keberlanjutan. Dengan memfasilitasi jual beli barang bekas, kami mengurangi limbah, mendorong ekonomi sirkular, dan meningkatkan kesadaran akan pentingnya daur ulang."
    },
    {
      question: "Bagaimana cara menghubungi tim ReuseMart?",
      answer: "Anda dapat menghubungi kami melalui email di reusemart@gmail.com, telepon di 0123456789, atau datang langsung ke gudang kami di Babarsari, Sleman, Yogyakarta. Kami juga menyediakan obrolan langsung di platform kami."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="mt-40">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className=" flex flex-row my-20 justify-center"
      >
        <div className="w-2/6 mx-auto max-w-10 mr-40 flex justify-end items-center">
            <h1 className="text-xl flex font-extrabold text-gray-800 mb-4">Tentang Kami.</h1>
        </div>
        <div className="w-4/6">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4 uppercase">Tentang Reusemart.</h1>
            <p className="text-gray-600 max-w-2xl text-md text-justify mb-4">
            Reusemart adalah platform penjualan dan distribusi barang bekas berkualitas yang berbasis di Yogyakarta. Berdiri sejak tahun 2020, Reusemart hadir sebagai solusi untuk masyarakat yang ingin menjalani gaya hidup berkelanjutan dengan cara yang mudah dan terjangkau. Kami memfasilitasi proses jual beli barang bekas layak pakai, mulai dari pakaian, perabot rumah tangga, hingga barang elektronik, yang semuanya dikurasi untuk memastikan kualitas dan fungsionalitasnya.
            </p>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sejarah Singkat</h2>
            <p className="text-gray-600 max-w-2xl text-md text-justify mb-4">
            Reusemart berawal dari sebuah komunitas kecil pecinta barang vintage dan antik di Yogyakarta. Berkat semangat kolektif untuk menjaga keberlanjutan lingkungan dan menciptakan ekonomi sirkular, komunitas ini mulai mengadakan bazar barang bekas secara rutin. Antusiasme masyarakat yang terus meningkat mendorong pendirian Reusemart sebagai platform digital yang lebih luas dan mudah diakses.
            </p>
        </div>        
      </motion.div>

      <header className="relative h-[50vh] bg-[url('/src/assets/kami.png')] bg-cover bg-no-repeat bg-center overflow-hidden pb-5">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-olive-900/80 via-olive-500/70 to-olive-500/20 z-10" />

        {/* Content */}
        <div className="relative z-20 h-full flex items-center justify-between px-8">
          {/* Left side: CTA */}
          <div className="w-full flex flex-col justify-center items-center">
            <div className="mx-auto max-w-5xl text-center lg:mx-16 lg:flex-auto lg:py-20">
              <h2 className="text-3xl text-white sm:text-6xl">" Menemukan Nilai Lebih di Setiap Barang Bekas - Hemat, Andal, dan Bertanggung Jawab "</h2>
            </div>
          </div>
        </div>
      </header>

      <h2 className="text-3xl font-bold text-olive-500 mt-20 text-center">Visi & Misi Reusemart</h2>
      {/* Company Story Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid md:grid-cols-2 gap-16 max-w-4xl justify-center mx-auto p-16 mb-16"
      >
        {/* Visi Card */}
        <motion.div 
          className="bg-gradient-to-br from-white to-olive-300 rounded-2xl shadow-xl p-8 space-y-4 overflow-hidden relative"
          whileHover={{ 
            scale: 1.03, 
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
          }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-olive-500"></div>
          <div className="bg-olive-300 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-olive-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center">Visi</h2>
          <p className="text-gray-600 text-center">
            Menjadi platform barang bekas terpercaya di Indonesia yang mendorong gaya hidup berkelanjutan.
          </p>
        </motion.div>

        {/* Misi Card */}
        <motion.div 
          className="bg-gradient-to-br from-white to-olive-300 rounded-2xl shadow-xl p-8 space-y-4 overflow-hidden relative"
          whileHover={{ 
            scale: 1.03, 
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
          }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-olive-500"></div>
          <div className="bg-olive-300 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-olive-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center">Misi</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="bg-olive-300 p-1 rounded-full mr-3 mt-1 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-olive-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-gray-600">Mendorong gaya hidup sirkular dan ramah lingkungan</span>
            </li>
            <li className="flex items-start">
              <span className="bg-olive-300 p-1 rounded-full mr-3 mt-1 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-olive-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-gray-600">Membantu masyarakat memperoleh penghasilan tambahan</span>
            </li>
            <li className="flex items-start">
              <span className="bg-olive-300 p-1 rounded-full mr-3 mt-1 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-olive-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-gray-600">Meningkatkan kesadaran akan pentingnya daur ulang</span>
            </li>
          </ul>
        </motion.div>
      </motion.div>

      <section className="relative h-[70vh] bg-[url('/src/assets/kami2.png')] bg-cover bg-no-repeat bg-center overflow-hidden pb-5">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-olive-900 via-olive-500/40 to-olive-500/20 z-10" />
        <div className="relative z-20 h-full flex">
          <div className="w-full flex flex-row justify-end items-end">
            <div className="mx-auto text-start lg:mx-16 lg:flex-auto lg:py-10">
              <h2 className="text-3xl text-white sm:text-6xl">Tim ReuseMart.</h2>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-12 mx-16 mb-16"
      >
        <h2 className="text-3xl font-bold text-olive-500 mb-12 text-center">Alur Penitipan Barang</h2>
        
        <div className="grid md:grid-cols-5 gap-6 text-center text-gray-600 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/4 left-0 right-0 h-1 bg-gray-200 z-0"></div>
          
          {/* Step 1 */}
          <motion.div 
            className="relative z-10"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="bg-olive-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-olive-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-xl font-semibold text-olive-500 mb-2">1</div>
              <p>Datang ke gudang Yogyakarta</p>
            </div>
          </motion.div>
          
          {/* Step 2 */}
          <motion.div 
            className="relative z-10"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="bg-olive-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-olive-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-xl font-semibold text-olive-500 mb-2">2</div>
              <p>Daftar sebagai penitip</p>
            </div>
          </motion.div>
          
          {/* Step 3 */}
          <motion.div 
            className="relative z-10"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="bg-olive-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-olive-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-xl font-semibold text-olive-500 mb-2">3</div>
              <p>Pemeriksaan barang oleh tim</p>
            </div>
          </motion.div>
          
          {/* Step 4 */}
          <motion.div 
            className="relative z-10"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="bg-olive-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-olive-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-xl font-semibold text-olive-500 mb-2">4</div>
              <p>Barang difoto dan diunggah</p>
            </div>
          </motion.div>
          
          {/* Step 5 */}
          <motion.div 
            className="relative z-10"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="bg-olive-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-olive-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-xl font-semibold text-olive-500 mb-2">5</div>
              <p>Penitip menerima notifikasi saat terjual</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <section className="relative h-[50vh] bg-[url('/src/assets/gudang.png')] bg-cover bg-no-repeat bg-center overflow-hidden pb-5">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-olive-900 via-olive-500/40 to-olive-500/20 z-10" />
        <div className="relative z-20 h-full flex">
          <div className="w-full flex flex-row justify-end items-end">
            <div className="mx-auto text-start lg:mx-16 lg:flex-auto lg:py-10">
              <h2 className="text-3xl text-white sm:text-6xl">Gudang ReuseMart.</h2>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="space-y-4 text-center p-16"
      >
        <h2 className="text-3xl font-bold text-olive-500">Lokasi Kami</h2>
        <div className="flex justify-center items-center space-x-2 text-gray-600">
          <MapPin className="text-red-500" />
          <span>Gudang ReuseMart - Babarsari, Sleman, Yogyakarta, Indonesia</span>
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.068604042374!2d110.41405471477486!3d-7.781056994405318!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a578e1b7e6b7b%3A0x1e2b1a8b6e7c4a3d!2sUniversitas%20Atma%20Jaya%20Yogyakarta%20Kampus%203!5e0!3m2!1sen!2sid!4v1698765432100!5m2!1sen!2sid"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8, ease: "easeInOut" }}
        className="space-y-8 text-center p-16 mb-16"
      >
        <h2 className="text-3xl font-bold text-olive-500">Pertanyaan yang Sering Diajukan</h2>
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 text-left overflow-hidden"
              initial={{ maxHeight: "60px" }}
              animate={{ maxHeight: openFaq === index ? "300px" : "60px" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleFaq(index)}
              >
                <h3 className="text-lg font-semibold text-gray-800">{faq.question}</h3>
                <motion.div
                  animate={{ rotate: openFaq === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {openFaq === index ? (
                    <ChevronUp className="text-olive-500" />
                  ) : (
                    <ChevronDown className="text-olive-500" />
                  )}
                </motion.div>
              </div>
              {openFaq === index && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: "easeInOut" }}
                  className="text-gray-600 mt-4"
                >
                  {faq.answer}
                </motion.p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}