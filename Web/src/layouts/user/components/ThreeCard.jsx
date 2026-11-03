import { motion } from 'framer-motion';
import React from 'react';

export default function ThreeHorizontalCardsWithContent() {
  // Data untuk masing-masing kartu
  const cardsData = [
    {
      id: 1,
      title: "Ramah Lingkungan",
      description: "Berbelanja barang bekas mengurangi limbah dan jejak karbon. Setiap transaksi di ReuseMart adalah langkah kecil untuk bumi yang lebih sehat.",
      icon: "🌱",
      backgroundImage: "/api/placeholder/400/600",
    },
    {
      id: 2,
      title: "Hemat Biaya",
      description: "Dapatkan barang berkualitas dengan harga lebih terjangkau. Mengapa membeli baru jika barang bekas masih berfungsi dengan baik?",
      icon: "💰",
      backgroundImage: "/api/placeholder/400/600",
    },
    {
      id: 3,
      title: "Transaksi Aman",
      description: "Sistem verifikasi penjual dan pembeli menjamin keamanan transaksi Anda. Beli dan jual dengan tenang tanpa khawatir.",
      icon: "🛡️",
      backgroundImage: "/api/placeholder/400/600",
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 50, 
      opacity: 0 
    },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0 },
    visible: { 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        delay: 0.4
      }
    }
  };

  return (
    <div className='py-20 bg-olive-300'>
      <motion.h2 
        className="text-4xl font-bold text-olive-500 text-center mb-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={titleVariants}
      >
        Mengapa Memilih ReuseMart?
      </motion.h2>
      
      <motion.div 
        className="flex flex-wrap justify-center gap-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {cardsData.map((card, index) => (
          <motion.div 
            key={card.id} 
            className="relative w-80 h-96 overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
            variants={itemVariants}
            whileHover={{ 
              scale: 1.03,
              transition: { duration: 0.3 }
            }}
            // Custom viewport threshold for each card to create a cascade effect
            viewport={{ 
              once: true,
              margin: `0px 0px -100px 0px`
            }}
          >
            <div 
              className="absolute inset-0 w-full h-full overflow-hidden bg-cover bg-center" 
              style={{backgroundImage: `url('${card.backgroundImage}')`}}
            >
              <div className="absolute inset-0 h-full w-full bg-gradient-to-t from-olive-900 to-olive-500 opacity-90"></div>
            </div>
            
            <div className="relative text-center p-6 flex flex-col items-center h-full justify-between pb-8">
              <motion.div 
                className="text-6xl mb-4"
                variants={iconVariants}
              >
                {card.icon}
              </motion.div>
              
              <div>
                <motion.h2 
                  className="mb-4 text-2xl font-bold text-white"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: 0.2, duration: 0.5 }
                    }
                  }}
                >
                  {card.title}
                </motion.h2>
                
                <motion.p 
                  className="mb-6 text-base text-white opacity-90"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { 
                      opacity: 0.9,
                      transition: { delay: 0.3, duration: 0.7 }
                    }
                  }}
                >
                  {card.description}
                </motion.p>
                
                <motion.a
                  href="/about" 
                  className="px-6 py-2 bg-white text-olive-700 rounded-full font-medium hover:bg-olive-100 transition-colors"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: 0.5, duration: 0.5 }
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Pelajari Lebih Lanjut
                </motion.a>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}