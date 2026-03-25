"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Smartphone, Laptop, Watch, Camera, Shirt, Home, Gamepad, Gift } from "lucide-react";
import Link from "next/link";

// Each entry maps to a real DB category via the `category` field
const sidebarCategories = [
  { name: "Smartphones", icon: Smartphone, category: "Electronics" },
  { name: "Laptops & Computers", icon: Laptop, category: "Electronics" },
  { name: "Watches & Accessories", icon: Watch, category: "Health & Beauty" },
  { name: "Cameras & Photo", icon: Camera, category: "Electronics" },
  { name: "Fashion & Clothing", icon: Shirt, category: "Women's Fashion" },
  { name: "Home & Garden", icon: Home, category: "Home & Lifestyle" },
  { name: "Gaming & Consoles", icon: Gamepad, category: "Electronics" },
  { name: "Gifts & Toys", icon: Gift, category: "Baby's & Toys" },
];

const banners = [
  {
    id: 1,
    title: "Summer Tech Sale",
    description: "Up to 50% off on selected electronics and gadgets. Upgrade your workspace today.",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1200&auto=format&fit=crop",
    cta: "Shop Electronics",
    category: "Electronics",
    color: "from-blue-900/90 to-blue-600/80",
  },
  {
    id: 2,
    title: "New Premium Collection",
    description: "Discover our latest arrival of high-end fashion and luxury accessories.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
    cta: "Explore Collection",
    category: "Women's Fashion",
    color: "from-rose-900/90 to-rose-600/80",
  },
  {
    id: 3,
    title: "Smart Home Devices",
    description: "Make your home smarter with our wide range of intelligent living solutions.",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1200&auto=format&fit=crop",
    cta: "View Devices",
    category: "Home & Lifestyle",
    color: "from-emerald-900/90 to-emerald-600/80",
  },
];

export function HeroSection() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentBanner((prev) => (prev + newDirection + banners.length) % banners.length);
  };

  const banner = banners[currentBanner];

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6 h-[500px]">
        {/* Left Sidebar - Categories */}
        <div className="hidden md:flex flex-col w-64 bg-white rounded-2xl border shadow-sm shrink-0 overflow-y-auto overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/20 font-semibold text-sm">
            Top Categories
          </div>
          <ul className="flex-1 py-2">
            {sidebarCategories.map((cat) => (
              <li key={cat.name}>
                <Link
                  href={`/store/products?category=${encodeURIComponent(cat.category)}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-primary hover:bg-muted/50 transition-colors group"
                >
                  <cat.icon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  <span className="flex-1">{cat.name}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Carousel - Banners */}
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-gray-100 group">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentBanner}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) paginate(1);
                else if (swipe > swipeConfidenceThreshold) paginate(-1);
              }}
              className="absolute inset-0 w-full h-full"
            >
              <div className="relative w-full h-full">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} mix-blend-multiply`} />

                <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-2xl text-white">
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
                  >
                    {banner.title}
                  </motion.h2>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg md:text-xl mb-8 text-gray-200"
                  >
                    {banner.description}
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link
                      href={`/store/products?category=${encodeURIComponent(banner.category)}`}
                      className="inline-block bg-white text-gray-900 hover:bg-gray-100 rounded-full px-8 py-3 font-semibold transition-colors"
                    >
                      {banner.cta}
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="absolute inset-x-0 h-full flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
            <button
              className="pointer-events-auto bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full p-2 text-white transition-colors"
              onClick={() => paginate(-1)}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              className="pointer-events-auto bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full p-2 text-white transition-colors"
              onClick={() => paginate(1)}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dots */}
          <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentBanner ? 1 : -1);
                  setCurrentBanner(index);
                }}
                className={`transition-all duration-300 rounded-full ${
                  index === currentBanner
                    ? "w-8 h-2.5 bg-white"
                    : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
