"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, Loader2, Package, ArrowLeft, CheckCircle2, ShieldCheck, Truck,
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

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    addressLine: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });

  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({
        ...f,
        customerName: session.user.name || "",
        customerEmail: session.user.email || "",
      }));
    }
  }, [session]);

  useEffect(() => {
    fetch("/api/buyer/cart")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const subtotal = items.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 499;
  const total = subtotal + shipping;

  const shippingAddress = [
    form.addressLine,
    form.city,
    form.state,
    form.zip,
    form.country,
  ]
    .filter(Boolean)
    .join(", ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/buyer/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          shippingAddress,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        const slug = session?.user?.name ? slugify(session.user.name) : params.buyer as string;
        setTimeout(() => router.push(`/buyer/${slug}/dashboard/history`), 2500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0 && !success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
        <ShoppingCart className="h-16 w-16 opacity-20" />
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">Your cart is empty</p>
          <p className="text-sm mt-1">Add items to your cart before checking out.</p>
        </div>
        <Button asChild>
          <Link href="/store/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">Order Placed!</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Thank you for your order. Redirecting to your order history…
          </p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const slug = session?.user?.name ? slugify(session.user.name) : params.buyer as string;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/buyer/${slug}/dashboard/cart`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Cart
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground text-sm">{items.length} item{items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — shipping form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <h2 className="font-semibold text-base">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    required
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                    placeholder="jane@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <h2 className="font-semibold text-base">Shipping Address</h2>
              <div className="space-y-1.5">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={form.addressLine}
                  onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
                  required
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    required
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">State / Province</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    placeholder="NY"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="zip">ZIP / Postal Code *</Label>
                  <Input
                    id="zip"
                    value={form.zip}
                    onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                    required
                    placeholder="10001"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 text-xs text-muted-foreground px-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-green-500" /> Secure Checkout
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-blue-500" />
                {shipping === 0 ? "Free Shipping" : "Standard Shipping $4.99"}
              </span>
            </div>
          </div>

          {/* Right — order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border p-5 space-y-4 sticky top-6">
              <h2 className="font-bold text-base">Order Summary</h2>
              <Separator />

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => {
                  const imgs = parseImages(item.images);
                  const thumb = imgs[0] ?? item.image;
                  const price = unitPrice(item);
                  const options = parseOptions(item.variantOptions);
                  const optEntries = Object.entries(options);

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative shrink-0">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={item.name}
                            className="h-14 w-14 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                        <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        {optEntries.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {optEntries.map(([k, v]) => (
                              <Badge key={k} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {k}: {v}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-sm font-semibold mt-0.5">
                          ${((price * item.quantity) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
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
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                size="lg"
                disabled={submitting || items.length === 0}
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing Order…</>
                ) : (
                  <>Place Order · ${(total / 100).toFixed(2)}</>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By placing your order you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
