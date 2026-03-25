"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, Trash2, Loader2, Package, ArrowRight,
  Plus, Minus, ShoppingBag,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";

interface CartItem {
  id: string;
  quantity: number;
  variantId: string | null;
  variantOptions: string | null;
  variantPrice: number | null;
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
  slug: string | null;
}

function parseImages(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

function isOnSale(item: Pick<CartItem, "salePrice" | "saleStartDate" | "saleEndDate">) {
  if (!item.salePrice) return false;
  const now = Date.now();
  const start = item.saleStartDate ? new Date(item.saleStartDate).getTime() : 0;
  const end = item.saleEndDate ? new Date(item.saleEndDate).getTime() : Infinity;
  return now >= start && now <= end;
}

function unitPrice(item: CartItem): number {
  if (item.variantPrice) return item.variantPrice;
  return isOnSale(item) ? (item.salePrice ?? item.price) : item.price;
}

function parseOptions(val: string | null): Record<string, string> {
  try { return val ? JSON.parse(val) : {}; } catch { return {}; }
}

export default function CartPage() {
  const { data: session } = useSession();
  const params = useParams();
  const slug = session?.user?.name ? slugify(session.user.name) : (params.buyer as string);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchCart = async () => {
    const res = await fetch("/api/buyer/cart");
    const data = await res.json();
    setItems(data.items ?? []);
  };

  useEffect(() => {
    fetchCart().finally(() => setLoading(false));
  }, []);

  const handleQtyChange = async (id: string, qty: number) => {
    setUpdatingId(id);
    await fetch("/api/buyer/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity: qty }),
    });
    await fetchCart();
    setUpdatingId(null);
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    await fetch("/api/buyer/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchCart();
    setRemovingId(null);
  };

  const subtotal = items.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 499; // free shipping over $50
  const total = subtotal + shipping;

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
        <ShoppingCart className="h-16 w-16 opacity-20" />
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">Your cart is empty</p>
          <p className="text-sm mt-1">Browse products and add items to get started.</p>
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        <p className="text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const imgs = parseImages(item.images);
            const thumb = imgs[0] ?? item.image;
            const price = unitPrice(item);
            const lineTotal = price * item.quantity;
            const onSale = isOnSale(item) && !item.variantPrice;
            const options = parseOptions(item.variantOptions);
            const optEntries = Object.entries(options);

            return (
              <div key={item.id} className="flex gap-4 bg-white rounded-xl border p-4">
                {/* Thumbnail */}
                <Link href={`/store/products/${item.productId}`} className="shrink-0">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={item.name} className="h-20 w-20 rounded-lg object-cover border" />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <Link href={`/store/products/${item.productId}`} className="hover:text-primary transition-colors">
                    <p className="font-semibold text-sm leading-snug line-clamp-2">{item.name}</p>
                  </Link>

                  {/* Variant options */}
                  {optEntries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {optEntries.map(([k, v]) => (
                        <Badge key={k} variant="secondary" className="text-[10px] px-2 py-0.5">{k}: {v}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-sm font-semibold ${onSale ? "text-primary" : ""}`}>
                      ${(price / 100).toFixed(2)}
                    </span>
                    {onSale && (
                      <span className="text-xs text-muted-foreground line-through">${(item.price / 100).toFixed(2)}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-1">each</span>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        className="px-2.5 py-1 hover:bg-muted transition-colors disabled:opacity-40"
                        onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                        disabled={updatingId === item.id || item.quantity <= 1}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium min-w-[2.5rem] text-center">
                        {updatingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : item.quantity}
                      </span>
                      <button
                        className="px-2.5 py-1 hover:bg-muted transition-colors disabled:opacity-40"
                        onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                        disabled={updatingId === item.id || item.quantity >= item.stock}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm">${(lineTotal / 100).toFixed(2)}</span>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removingId === item.id}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove"
                      >
                        {removingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <Link href="/store/products">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                ← Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-5 space-y-4 sticky top-6">
            <h2 className="font-bold text-base">Order Summary</h2>
            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                {shipping === 0 ? (
                  <span className="text-green-600 font-medium">Free</span>
                ) : (
                  <span className="font-medium">${(shipping / 100).toFixed(2)}</span>
                )}
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">
                  Add ${((5000 - subtotal) / 100).toFixed(2)} more for free shipping
                </p>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>${(total / 100).toFixed(2)}</span>
            </div>

            <Button className="w-full h-11" size="lg" asChild>
              <Link href={`/buyer/${slug}/dashboard/checkout`}>
                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}
