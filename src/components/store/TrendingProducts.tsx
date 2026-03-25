"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard, type Product } from "./ProductCard";

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[] | null;
  image: string | null;
  slug: string | null;
}

function toProduct(p: ApiProduct): Product {
  const img = (Array.isArray(p.images) && p.images[0]) || p.image || "";
  const price = p.salePrice ? p.salePrice / 100 : p.price / 100;
  const originalPrice = p.salePrice ? p.price / 100 : undefined;
  return {
    id: p.id,
    name: p.name,
    price,
    originalPrice,
    rating: 0,
    reviews: 0,
    image: img,
    href: `/store/products/${p.id}`,
  };
}

export function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/store/products?sort=newest&page=1")
      .then((r) => r.json())
      .then((d) => setProducts((d.products ?? []).slice(0, 10).map(toProduct)))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;
  if (products.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Trending Now</h2>
          <p className="text-muted-foreground mt-2">Discover the most sought-after products this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.slice(0, 5).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length > 5 && (
        <div className="mt-10 flex justify-center">
          <Link
            href="/store/products"
            className="px-8 py-3 rounded-full border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-colors"
          >
            Load More Products
          </Link>
        </div>
      )}
    </section>
  );
}
