import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Hero from "../../../assets/hero-bg.jpg";
import Hero2 from "../../../assets/kami.png";

const Invitation = () => {
  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const imageAnimation = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.2 }
    }
  };

  return (
    <div className="bg-olive-100 py-16 px-8 lg:px-40 space-y-20">
      {/* Section untuk Pembeli */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerChildren}
      >
        {/* Text */}
        <motion.div variants={fadeInUp}>
          <motion.h2 
            className="text-xl md:text-3xl font-bold text-olive-700 mb-4"
            variants={fadeInUp}
          >
            Temukan Barang Bekas Berkualitas dengan Mudah
          </motion.h2>
          <motion.p 
            className="text-gray-600 mb-6 text-lg"
            variants={fadeInUp}
          >
            Daftar sekarang sebagai pembeli dan jelajahi ribuan produk preloved yang telah dikurasi.
            Hemat lebih banyak, temukan lebih cepat.
          </motion.p>
          <motion.ul 
            className="list-disc pl-10 space-y-5 mt-5 text-lg text-olive-500"
            variants={staggerChildren}
          >
            <motion.li variants={fadeInUp}>Transaksi aman dan cepat</motion.li>
            <motion.li variants={fadeInUp}>Ribuan produk terpercaya</motion.li>
            <motion.li variants={fadeInUp}>Rekomendasi personal</motion.li>
          </motion.ul>
          <motion.p 
            className="my-5 text-gray-500 text-lg"
            variants={fadeInUp}
          >
            Bergabunglah hari ini dan mulai pengalaman belanja yang lebih bijak.
          </motion.p>
          <motion.div 
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a href="/register" className="mt-10 bg-olive-500 text-white text-md px-6 py-3 rounded-lg hover:bg-olive-600 transition inline-block">
              Daftar Sebagai Pembeli
            </a>
          </motion.div>
        </motion.div>
        {/* Gambar */}
        <motion.div
          variants={imageAnimation}
        >
          <img
            src={Hero}
            alt="Pembeli"
            className="rounded-xl shadow-md h-[70vh] object-cover w-full justify-center"
          />
        </motion.div>
      </motion.div>

      {/* Section untuk Penjual */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerChildren}
      >
        {/* Gambar */}
        <motion.div 
          className="order-last lg:order-first"
          variants={imageAnimation}
        >
          <img
            src={Hero2}
            alt="Penjual"
            className="rounded-xl shadow-md h-[70vh] object-cover w-full justify-center"
          />
        </motion.div>
        {/* Text */}
        <motion.div variants={fadeInUp}>
          <motion.h2 
            className="text-xl md:text-3xl font-bold text-olive-700 mb-4"
            variants={fadeInUp}
          >
            Jadikan Barang Lama Anda Lebih Bernilai
          </motion.h2>
          <motion.p 
            className="text-gray-600 mb-6 text-lg"
            variants={fadeInUp}
          >
            Daftar sebagai penjual dan titipkan barang Anda untuk dijual dengan sistem yang praktis dan transparan.
          </motion.p>
          <motion.ul 
            className="list-disc pl-10 space-y-5 mt-5 text-lg text-olive-500"
            variants={staggerChildren}
          >
            <motion.li variants={fadeInUp}>Proses titip jual mudah</motion.li>
            <motion.li variants={fadeInUp}>Dikurasi dan dipasarkan secara profesional</motion.li>
            <motion.li variants={fadeInUp}>Potensi pendapatan dari barang yang sudah tidak terpakai</motion.li>
          </motion.ul>
          <motion.p 
            className="my-5 text-gray-500 text-lg"
            variants={fadeInUp}
          >
            Mulai sekarang dan biarkan Reusemart membantu menjual barang Anda.
          </motion.p>
          <motion.div 
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a href="/about" className="mt-16 bg-olive-500 text-white text-md px-6 py-3 rounded-lg hover:bg-olive-600 transition inline-block">
              Kunjungi Gudang Kami
            </a>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Invitation;