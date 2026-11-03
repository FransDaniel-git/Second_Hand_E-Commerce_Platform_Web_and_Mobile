import { motion } from "framer-motion";

const HeroSection = () => {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1, ease: "easeOut" },
    },
  };

  const slideUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const statsAnimation = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <>
      <motion.header
        initial="hidden"
        animate="visible"
        className="relative h-[calc(100vh-80px)] bg-[url('/src/assets/hero-bg.png')] bg-cover bg-no-repeat bg-center overflow-hidden"
      >
        {/* Gradient Overlay with animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-olive-900 via-olive-500/80 to-olive-500/20 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />

        {/* Content */}
        <div className="relative z-20 h-full flex items-center justify-center px-4 sm:px-8">
          <motion.div
            className="max-w-3xl text-center"
            variants={staggerContainer}
          >
            <motion.h2
              className="text-3xl text-white sm:text-5xl md:text-6xl font-bold"
              variants={slideUp}
            >
              Temukan{" "}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Kesempatan Baru
              </motion.span>{" "}
              dalam{" "}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                Barang Lama
              </motion.span>
            </motion.h2>

            <motion.p
              className="mt-6 text-lg md:text-xl text-gray-100"
              variants={slideUp}
            >
              Jual dan beli barang bekas kini lebih mudah dan terpercaya bersama{" "}
              <motion.span
                className="font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                ReuseMart
              </motion.span>
            </motion.p>

            <motion.div
              className="mt-10 flex items-center justify-center gap-x-6"
              variants={fadeIn}
            >
              <motion.a
                href="/catalogue"
                className="rounded-md bg-olive-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                whileHover={{ scale: 1.05, backgroundColor: "#2d3022" }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                Temukan Barangmu
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      <motion.div
        className="grid grid-cols-1 gap-8 px-4 sm:px-8 lg:px-16 py-10 sm:grid-cols-2 lg:grid-cols-4 bg-olive-300 justify-items-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
      >
        <StatsItem number="200+" text="Transaksi Berhasil" />
        <StatsItem number="300+" text="Dipercaya Oleh 300+ Penitip" />
        <StatsItem number="100%" text="Barang Layak Pakai" />
        <StatsItem number="Kurasi" text="Melalui Proses Pengecekan Ketat" />
      </motion.div>
    </>
  );
};

// Extracted component for each stats item with counter animation
const StatsItem = ({ number, text }) => {
  const statsItemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const counterVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      className="flex flex-col-reverse gap-1 items-center"
      variants={statsItemVariants}
    >
      <motion.dt
        className="text-lg text-olive-900 text-center"
        variants={statsItemVariants}
      >
        {text}
      </motion.dt>
      <motion.dd
        className="text-5xl font-semibold tracking-tight text-olive-500"
        variants={counterVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {number}
      </motion.dd>
    </motion.div>
  );
};

export default HeroSection;
