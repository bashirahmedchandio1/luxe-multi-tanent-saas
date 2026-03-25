"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StoreNavbar } from "@/components/store/StoreNavbar";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, Heart, ShoppingCart, Package, X } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  brand: string | null;
  images: string | null;
  image: string | null;
  price: number;
  salePrice: number | null;
  saleStartDate: string | null;
  saleEndDate: string | null;
  category: string | null;
  subcategory: string | null;
  slug: string | null;
  stock: number;
  sellerName: string;
  sellerId: string;
}

const CATEGORIES = [
  "Women's Fashion", "Men's Fashion", "Electronics", "Home & Lifestyle",
  "Medicine", "Sports & Outdoor", "Baby's & Toys", "Groceries & Pets", "Health & Beauty",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "name-asc", label: "Name A–Z" },
];

function parseImages(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

function isOnSale(p: Pick<Product, "salePrice" | "saleStartDate" | "saleEndDate">): boolean {
  if (!p.salePrice) return false;
  const now = Date.now();
  const start = p.saleStartDate ? new Date(p.saleStartDate).getTime() : 0;
  const end = p.saleEndDate ? new Date(p.saleEndDate).getTime() : Infinity;
  return now >= start && now <= end;
}

function ProductCard({ p, wishlistIds, onWishlist }: {
  p: Product;
  wishlistIds: Set<string>;
  onWishlist: (productId: string) => void;
}) {
  const imgs = parseImages(p.images);
  const thumb = imgs[0] ?? p.image;
  const sale = isOnSale(p);
  const displayPrice = sale ? p.salePrice! : p.price;
  const discount = sale ? Math.round(100 - (p.salePrice! / p.price) * 100) : 0;
  const wishlisted = wishlistIds.has(p.id);
  const href = `/store/products/${p.id}`;

  return (
    <div className="group bg-white rounded-2xl border border-border/60 overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200">
      <Link href={href} className="block relative overflow-hidden bg-muted/20">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={p.name}
            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center bg-muted/30">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {sale && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            -{discount}%
          </div>
        )}
        {p.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-xs font-semibold px-3 py-1.5 rounded-full">Out of Stock</span>
          </div>
        )}
      </Link>

      <div className="p-3.5 space-y-1.5">
        {p.category && (
          <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wide truncate">
            {p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}
          </p>
        )}
        <Link href={href}>
          <p className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {p.name}
          </p>
        </Link>
        {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
        <p className="text-[11px] text-muted-foreground">by {p.sellerName}</p>

        <div className="flex items-center justify-between pt-1">
          <div>
            {sale ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-primary">
                  ${(displayPrice / 100).toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  ${(p.price / 100).toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-sm">${(p.price / 100).toFixed(2)}</span>
            )}
          </div>

          <button
            onClick={(e) => { e.preventDefault(); onWishlist(p.id); }}
            className={`p-1.5 rounded-full transition-colors ${wishlisted ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"}`}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>

        <Link href={href}>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs mt-1 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
            disabled={p.stock === 0}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            {p.stock === 0 ? "Out of Stock" : "View Product"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function StoreProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <StoreProductsContent />
    </Suspense>
  );
}

function StoreProductsContent() {
  const { data: session } = useSession();
  const user = session?.user;
  const slug = user?.name ? slugify(user.name) : "";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (sort !== "newest") params.set("sort", sort);
    const res = await fetch(`/api/store/products?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }, [category, search, sort]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Fetch wishlist to highlight wishlisted items
  useEffect(() => {
    if (!user) return;
    fetch("/api/buyer/wishlist")
      .then((r) => r.json())
      .then((d) => setWishlistIds(new Set((d.items ?? []).map((i: { productId: string }) => i.productId))));
  }, [user]);

  const handleWishlist = async (productId: string) => {
    if (!user) { router.push("/store/auth"); return; }
    const res = await fetch("/api/buyer/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await res.json();
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (data.wishlisted) next.add(productId); else next.delete(productId);
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <StoreNavbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {category || "All Products"}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {loading ? "Loading…" : `${products.length} product${products.length !== 1 ? "s" : ""} found`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
                    placeholder="Search products…"
                    className="pl-9 w-56 h-9"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm h-9"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category filter chips */}
          <div className="container mx-auto px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              <button
                onClick={() => setCategory("")}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  category === ""
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(category === cat ? "" : cat)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    category === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-2xl" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-8 bg-muted rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Package className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-xl font-semibold">No products found</p>
              <p className="text-sm mt-1">
                {category || search ? "Try removing your filters." : "Sellers haven't listed any products yet."}
              </p>
              {(category || search) && (
                <Button variant="outline" className="mt-4" onClick={() => { setCategory(""); setSearch(""); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} wishlistIds={wishlistIds} onWishlist={handleWishlist} />
              ))}
            </div>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
