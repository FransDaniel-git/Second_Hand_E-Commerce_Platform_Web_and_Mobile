import React from "react";
import Hero from "../../../assets/hero-bg.jpg";
import Hero2 from "../../../assets/hero-bg.png";
import CategoryGallery from "../components/CategoryGallery";
import Footer from "../components/Footer";
import RecommendedProducts from "../components/RecommendedProduct";
import ThreeHorizontalCard from "../components/ThreeCard";
import { Link } from "react-router-dom";
import Invitation from "../components/Invitation";
import HeroSection from "../components/HeroSection";

const HomePage = () => {
  return (
    <div className="min-h-screen">

      <HeroSection/>
      

      <RecommendedProducts />

      {/* <div className="flex flex-col px-6 md:px-16 py-20 bg-olive-50">
        <h2 className="text-3xl md:text-4xl font-bold text-olive-500 mb-12">
          Barang Terbaru dari Katalog Kami
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="col-span-1 lg:col-span-2 h-[50vh] bg-amber-100 rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-1">
            
          </div>
          <div className="h-96 bg-amber-100 rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-1"></div>
          <div className="h-96 bg-amber-100 rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-1"></div>
        </div>
      </div> */}


      <CategoryGallery />

      <ThreeHorizontalCard />

      <Invitation />

      <section className="relative h-[60vh] bg-[url('/src/assets/kami2.png')] bg-cover bg-no-repeat bg-center overflow-hidden pb-5">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-olive-900/80 via-olive-500/60 to-olive-500/20 z-10" />

        {/* Content */}
        <div className="relative z-20 h-full flex items-center justify-center px-8">
          {/* Left side: CTA */}
          <div className="w-full flex flex-col items-center justify-center">
            <div className="mx-auto text-center lg:mx-16 lg:flex-auto lg:py-20">
              <h2 className="text-3xl text-white sm:text-5xl">Ingin tahu lebih banyak tentang kami?</h2>
              
              <p className="mt-6 text-lg md:text-xl text-pretty text-gray-100">
              Cari tau lebih dalam tentang kami!     
              </p>
              <div className="mt-5 flex items-center justify-center gap-x-6">
                <a
                  href="/about"
                  className="rounded-md bg-olive-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Tentang Kami
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;