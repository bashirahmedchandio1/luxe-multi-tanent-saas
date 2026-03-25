"use client";

import { useEffect, useState, useRef } from "react";
import { ProductCard, type Product } from "./ProductCard";

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[] | null;
  image: string | null;
  slug: string | null;
  createdAt: string;
}

function toProduct(p: ApiProduct, isNew = false): Product {
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
    isNew: isNew || undefined,
    href: `/store/products/${p.id}`,
  };
}

const TABS = ["Best Sellers", "New Arrivals", "Top Rated"] as const;
type Tab = (typeof TABS)[number];

const TAB_SORT: Record<Tab, string> = {
  "Best Sellers": "newest",
  "New Arrivals": "newest",
  "Top Rated": "price-desc",
};

export function BestSellers() {
  const [activeTab, setActiveTab] = useState<Tab>("Best Sellers");
  const [products, setProducts] = useState<Product[]>([]);
  const cache = useRef<Partial<Record<Tab, Product[]>>>({});

  useEffect(() => {
    if (cache.current[activeTab]) {
      setProducts(cache.current[activeTab]!);
      return;
    }
    const sort = TAB_SORT[activeTab];
    fetch(`/api/store/products?sort=${sort}&page=1`)
      .then((r) => r.json())
      .then((d) => {
        const raw: ApiProduct[] = d.products ?? [];
        const mapped = raw.slice(0, 4).map((p) =>
          toProduct(p, activeTab === "New Arrivals")
        );
        cache.current[activeTab] = mapped;
        setProducts(mapped);
      });
  }, [activeTab]);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
          Recommended For You
        </h2>

        <div className="inline-flex bg-gray-100/80 p-1.5 rounded-full">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, idx) => (
          <div
            key={activeTab + product.id + idx}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
