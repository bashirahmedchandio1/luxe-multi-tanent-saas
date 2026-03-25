"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

// Maps display title → exact category name stored in the DB
const categories = [
  {
    id: 1,
    title: "Electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800&auto=format&fit=crop",
    category: "Electronics",
    colSpan: "col-span-1 md:col-span-2 row-span-2",
  },
  {
    id: 2,
    title: "Women's Fashion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop",
    category: "Women's Fashion",
    colSpan: "col-span-1",
  },
  {
    id: 3,
    title: "Men's Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
    category: "Men's Fashion",
    colSpan: "col-span-1",
  },
  {
    id: 4,
    title: "Health & Beauty",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
    category: "Health & Beauty",
    colSpan: "col-span-1 md:col-span-2",
  },
];

export function CategoryGrid() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Shop by Category</h2>
          <p className="text-muted-foreground mt-2">Discover our most popular collections</p>
        </div>
        <Link
          href="/store/products"
          className="hidden sm:flex items-center text-primary font-medium hover:underline group"
        >
          View All Products
          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/store/products?category=${encodeURIComponent(category.category)}`}
            className={`group relative rounded-2xl overflow-hidden block ${category.colSpan}`}
          >
            {/* Background Image */}
            <div className="absolute inset-0 bg-gray-200">
              <img
                src={category.image}
                alt={category.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  {category.title}
                </h3>
                <span className="inline-flex items-center text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                  Shop Now
                  <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </span>
              </motion.div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
