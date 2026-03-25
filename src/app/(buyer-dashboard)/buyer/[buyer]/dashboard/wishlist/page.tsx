"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2, Package, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  images: string | null;
  image: string | null;
  price: number;
  salePrice: number | null;
  saleStartDate: string | null;
  saleEndDate: string | null;
  stock: number;
  status: string;
  category: string | null;
  slug: string | null;
}

function parseImages(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

function isOnSale(item: Pick<WishlistItem, "salePrice" | "saleStartDate" | "saleEndDate">) {
  if (!item.salePrice) return false;
  const now = Date.now();
  const start = item.saleStartDate ? new Date(item.saleStartDate).getTime() : 0;
  const end = item.saleEndDate ? new Date(item.saleEndDate).getTime() : Infinity;
  return now >= start && now <= end;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const fetchWishlist = async () => {
    const res = await fetch("/api/buyer/wishlist");
    const data = await res.json();
    setItems(data.items ?? []);
  };

  useEffect(() => {
    fetchWishlist().finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    await fetch("/api/buyer/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchWishlist();
    setRemovingId(null);
  };

  const handleAddToCart = async (item: WishlistItem) => {
    if (item.stock === 0) return;
    setAddingToCartId(item.id);
    await fetch("/api/buyer/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: item.productId, quantity: 1 }),
    });
    setAddedIds((prev) => new Set([...prev, item.id]));
    setAddingToCartId(null);
    // Clear the "Added" state after 2s
    setTimeout(() => setAddedIds((prev) => { const n = new Set(prev); n.delete(item.id); return n; }), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
        <Heart className="h-16 w-16 opacity-20" />
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">Your wishlist is empty</p>
          <p className="text-sm mt-1">Save items you love by clicking the heart icon on any product.</p>
        </div>
        <Button asChild>
          <Link href="/store/products">
            <ShoppingBag className="mr-2 h-4 w-4" /> Browse Products
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
          <p className="text-muted-foreground">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/store/products">
            <ShoppingBag className="mr-2 h-4 w-4" /> Browse More
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const imgs = parseImages(item.images);
          const thumb = imgs[0] ?? item.image;
          const sale = isOnSale(item);
          const displayPrice = sale ? item.salePrice! : item.price;
          const discount = sale ? Math.round(100 - (item.salePrice! / item.price) * 100) : 0;
          const isAdded = addedIds.has(item.id);

          return (
            <div key={item.id} className="group bg-white rounded-xl border border-border/60 overflow-hidden hover:shadow-md transition-all">
              {/* Image */}
              <Link href={`/store/products/${item.productId}`} className="block relative overflow-hidden bg-muted/20">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={item.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center bg-muted/30">
                    <Package className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                {sale && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    -{discount}%
                  </div>
                )}
                {item.stock === 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white text-xs font-semibold px-2.5 py-1 rounded-full">Out of Stock</span>
                  </div>
                )}
                {/* Remove button */}
                <button
                  onClick={(e) => { e.preventDefault(); handleRemove(item.id); }}
                  disabled={removingId === item.id}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                  title="Remove from wishlist"
                >
                  {removingId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              </Link>

              {/* Info */}
              <div className="p-3 space-y-2">
                {item.category && (
                  <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wide truncate">{item.category}</p>
                )}
                <Link href={`/store/products/${item.productId}`}>
                  <p className="text-sm font-semibold line-clamp-2 hover:text-primary transition-colors leading-snug">{item.name}</p>
                </Link>

                <div className="flex items-baseline gap-1.5">
                  <span className={`font-bold text-sm ${sale ? "text-primary" : ""}`}>
                    ${(displayPrice / 100).toFixed(2)}
                  </span>
                  {sale && <span className="text-xs text-muted-foreground line-through">${(item.price / 100).toFixed(2)}</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 pt-0.5">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => handleAddToCart(item)}
                    disabled={item.stock === 0 || addingToCartId === item.id || isAdded}
                    variant={isAdded ? "secondary" : "default"}
                  >
                    {addingToCartId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                    )}
                    {isAdded ? "Added!" : item.stock === 0 ? "Sold Out" : "Add to Cart"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    title="Remove"
                  >
                    {removingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
