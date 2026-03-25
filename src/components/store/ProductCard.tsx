"use client";

import { useState } from "react";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";

export interface Product {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  isNew?: boolean;
  discount?: number;
  /** Optional override — defaults to /store/products/{id} */
  href?: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const href = product.href ?? `/store/products/${product.id}`;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-white rounded-2xl border p-4 transition-all duration-300 hover:shadow-xl flex flex-col h-full"
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {product.discount && (
          <Badge className="bg-red-500 hover:bg-red-600 font-semibold px-2 py-1">
            -{product.discount}%
          </Badge>
        )}
        {product.isNew && (
          <Badge className="bg-blue-500 hover:bg-blue-600 font-semibold px-2 py-1">
            NEW
          </Badge>
        )}
      </div>

      {/* Wishlist Button */}
      <button className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 text-gray-400">
        <Heart className="w-5 h-5" />
      </button>

      {/* Image Container */}
      <Link href={href} className="block relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4 mix-blend-multiply">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
        />

        {/* Quick View overlay */}
        <div
          className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 flex justify-center gap-2 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="w-full text-center rounded-full bg-white text-black text-sm font-semibold py-1.5 shadow-md">
            Quick View
          </span>
        </div>
      </Link>

      {/* Product Details */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating) ? "fill-current" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({product.reviews})</span>
        </div>

        <Link href={href}>
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <Link href={href}>
            <Button
              size="icon"
              className="rounded-full shadow-md hover:scale-105 transition-transform bg-primary text-white"
              aria-label="View product"
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
