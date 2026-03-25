"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StoreNavbar } from "@/components/store/StoreNavbar";
import { StoreFooter } from "@/components/store/StoreFooter";
import { ProductReviews } from "@/components/store/ProductReviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Heart, ShoppingCart, Truck, ShieldCheck, ArrowLeft,
  Package, Star, Loader2, Store, ChevronRight, Check, Tag, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth-client";
import { slugify } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductVariant {
  id: string;
  options: string; // JSON
  sku: string | null;
  price: number;
  stock: number;
  image: string | null;
}

interface ProductDetail {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  description: string | null;
  images: string | null;
  image: string | null;
  price: number;
  salePrice: number | null;
  saleStartDate: string | null;
  saleEndDate: string | null;
  category: string | null;
  subcategory: string | null;
  weight: string | null;
  deliveryEstimate: string | null;
  stock: number;
  lowStockThreshold: number | null;
  tags: string | null;
  sellerId: string;
  slug: string | null;
}

interface Recommendation {
  id: string;
  name: string;
  images: string | null;
  image: string | null;
  price: number;
  salePrice: number | null;
  saleStartDate: string | null;
  saleEndDate: string | null;
  category: string | null;
  slug: string | null;
  sellerName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseImages(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

function parseTags(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

function isOnSale(p: { salePrice: number | null; saleStartDate: string | null; saleEndDate: string | null }) {
  if (!p.salePrice) return false;
  const now = Date.now();
  const start = p.saleStartDate ? new Date(p.saleStartDate).getTime() : 0;
  const end = p.saleEndDate ? new Date(p.saleEndDate).getTime() : Infinity;
  return now >= start && now <= end;
}

function getVariantOptions(variants: ProductVariant[]): Record<string, string[]> {
  const opts: Record<string, string[]> = {};
  variants.forEach((v) => {
    try {
      const parsed = JSON.parse(v.options) as Record<string, string>;
      Object.entries(parsed).forEach(([k, val]) => {
        if (!opts[k]) opts[k] = [];
        if (!opts[k].includes(val)) opts[k].push(val);
      });
    } catch { /* noop */ }
  });
  return opts;
}

function findVariant(variants: ProductVariant[], selected: Record<string, string>): ProductVariant | null {
  const keys = Object.keys(selected);
  return variants.find((v) => {
    try {
      const parsed = JSON.parse(v.options) as Record<string, string>;
      return keys.every((k) => parsed[k] === selected[k]);
    } catch { return false; }
  }) ?? null;
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

function RecCard({ r }: { r: Recommendation }) {
  const imgs = parseImages(r.images);
  const thumb = imgs[0] ?? r.image;
  const sale = isOnSale(r);
  const price = sale ? r.salePrice! : r.price;
  return (
    <Link href={`/store/products/${r.id}`} className="group bg-white rounded-xl border border-border/60 overflow-hidden hover:shadow-md hover:border-primary/20 transition-all">
      <div className="relative overflow-hidden bg-muted/20">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={r.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center bg-muted/30">
            <Package className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        {sale && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            SALE
          </div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{r.name}</p>
        <p className="text-xs text-muted-foreground">{r.sellerName}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-sm text-primary">${(price / 100).toFixed(2)}</span>
          {sale && <span className="text-xs text-muted-foreground line-through">${(r.price / 100).toFixed(2)}</span>}
        </div>
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const slug = user?.name ? slugify(user.name) : "";

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [seller, setSeller] = useState<{ id: string; name: string } | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // UI state
  const [mainImgIdx, setMainImgIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/store/products/${productId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(({ product: p, variants: v, seller: s, recommendations: r }) => {
        setProduct(p);
        setVariants(v ?? []);
        setSeller(s);
        setRecs(r ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [productId]);

  // Check wishlist status
  useEffect(() => {
    if (!user || !product) return;
    fetch("/api/buyer/wishlist")
      .then((r) => r.json())
      .then((d) => {
        const ids: string[] = (d.items ?? []).map((i: { productId: string }) => i.productId);
        setWishlisted(ids.includes(product.id));
      });
  }, [user, product]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <StoreFooter />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreNavbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Package className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-xl font-semibold">Product not found</p>
          <Button asChild variant="outline"><Link href="/store/products"><ArrowLeft className="mr-2 h-4 w-4" />Back to Products</Link></Button>
        </div>
        <StoreFooter />
      </div>
    );
  }

  const images = parseImages(product.images);
  if (product.image && !images.includes(product.image)) images.unshift(product.image);
  const mainImg = images[mainImgIdx] ?? null;

  const sale = isOnSale(product);
  const variantOptions = getVariantOptions(variants);
  const optionNames = Object.keys(variantOptions);
  const allSelected = optionNames.length > 0 && optionNames.every((k) => selectedOptions[k]);
  const activeVariant = allSelected ? findVariant(variants, selectedOptions) : null;

  const displayPrice = activeVariant
    ? activeVariant.price
    : sale ? product.salePrice! : product.price;
  const basePrice = product.price;
  const activeStock = activeVariant ? activeVariant.stock : product.stock;

  // Final price after coupon (cents)
  const subtotal = displayPrice * quantity;
  const finalTotal = appliedCoupon ? appliedCoupon.finalPrice : subtotal;
  const tags = parseTags(product.tags);
  const discount = sale && !activeVariant ? Math.round(100 - (product.salePrice! / product.price) * 100) : 0;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setAppliedCoupon(null);
    const subtotal = displayPrice * quantity;
    const res = await fetch("/api/store/coupon/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode.trim(), productId: product.id, subtotal }),
    });
    const data = await res.json();
    if (res.ok && data.valid) {
      setAppliedCoupon(data);
    } else {
      setCouponError(data.error ?? "Invalid coupon");
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleAddToCart = async () => {
    if (!user) { router.push("/store/auth"); return; }
    if (optionNames.length > 0 && !allSelected) return;
    setAddingToCart(true);
    await fetch("/api/buyer/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, variantId: activeVariant?.id ?? null, quantity }),
    });
    setAddingToCart(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleWishlist = async () => {
    if (!user) { router.push("/store/auth"); return; }
    setTogglingWishlist(true);
    const res = await fetch("/api/buyer/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    const data = await res.json();
    setWishlisted(data.wishlisted);
    setTogglingWishlist(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <StoreNavbar />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/store" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/store/products" className="hover:text-primary transition-colors">Products</Link>
              {product.category && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <Link href={`/store/products?category=${encodeURIComponent(product.category)}`} className="hover:text-primary transition-colors">
                    {product.category}
                  </Link>
                </>
              )}
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Product section */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white rounded-2xl border p-6 lg:p-8">

            {/* Left: Image gallery */}
            <div className="space-y-3">
              {/* Main image */}
              <div className="relative rounded-xl overflow-hidden bg-muted/20 aspect-square">
                {mainImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mainImg} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-20 w-20 text-muted-foreground/20" />
                  </div>
                )}
                {sale && !activeVariant && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    -{discount}% OFF
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImgIdx(i)}
                      className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${i === mainImgIdx ? "border-primary" : "border-transparent hover:border-border"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product info */}
            <div className="space-y-5">
              {/* Category */}
              <div className="flex items-center gap-2 flex-wrap">
                {product.category && (
                  <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                )}
                {product.subcategory && (
                  <Badge variant="outline" className="text-xs">{product.subcategory}</Badge>
                )}
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold leading-tight">{product.name}</h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                  {product.brand && <span>{product.brand}</span>}
                  {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
                </div>
              </div>

              {/* Reviews link */}
              <a href="#reviews" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-primary underline underline-offset-2">See reviews</span>
              </a>

              <Separator />

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">
                    ${(displayPrice / 100).toFixed(2)}
                  </span>
                  {(sale && !activeVariant) && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">${(basePrice / 100).toFixed(2)}</span>
                      <Badge className="bg-red-500 text-white text-xs px-2">-{discount}%</Badge>
                    </>
                  )}
                </div>
                {sale && product.saleEndDate && (
                  <p className="text-xs text-orange-600 font-medium">
                    Sale ends {new Date(product.saleEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                )}
              </div>

              {/* Coupon */}
              <div className="space-y-2">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <Tag className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-semibold">{appliedCoupon.code}</span>
                      <span className="text-sm">
                        —{" "}
                        {appliedCoupon.discountType === "percentage"
                          ? `${appliedCoupon.discountValue}% off`
                          : `$${(appliedCoupon.discountValue / 100).toFixed(2)} off`}
                      </span>
                    </div>
                    <button onClick={removeCoupon} className="text-green-600 hover:text-green-800 transition-colors ml-2">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        placeholder="Enter coupon code"
                        className="pl-9 uppercase tracking-widest text-sm"
                        maxLength={32}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="shrink-0"
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <X className="h-3 w-3" /> {couponError}
                  </p>
                )}
              </div>

              {/* Final total with coupon breakdown */}
              {appliedCoupon && (
                <div className="rounded-lg border border-green-200 bg-green-50/60 px-4 py-3 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({quantity}×)</span>
                    <span>${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Coupon discount</span>
                    <span>−${(appliedCoupon.discountAmount / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-green-200">
                    <span>Total</span>
                    <span className="text-primary">${(finalTotal / 100).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Variant selectors */}
              {optionNames.map((optName) => (
                <div key={optName} className="space-y-2">
                  <p className="text-sm font-semibold">
                    {optName}
                    {selectedOptions[optName] && <span className="font-normal text-muted-foreground ml-2">{selectedOptions[optName]}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variantOptions[optName].map((val) => {
                      const isSelected = selectedOptions[optName] === val;
                      return (
                        <button
                          key={val}
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [optName]: val }))}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary hover:text-primary bg-white"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Stock indicator */}
              <div>
                {activeStock === 0 ? (
                  <p className="text-sm font-medium text-red-500">Out of stock</p>
                ) : activeStock <= (product.lowStockThreshold ?? 5) ? (
                  <p className="text-sm font-medium text-orange-500">Only {activeStock} left!</p>
                ) : (
                  <p className="text-sm text-green-600 font-medium">In Stock</p>
                )}
              </div>

              {/* Quantity + Add to Cart */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted transition-colors text-lg font-medium">−</button>
                    <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
                    <button onClick={() => setQuantity((q) => Math.min(activeStock, q + 1))} className="px-3 py-2 hover:bg-muted transition-colors text-lg font-medium" disabled={quantity >= activeStock}>+</button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 h-12 text-base"
                    onClick={handleAddToCart}
                    disabled={activeStock === 0 || addingToCart || (optionNames.length > 0 && !allSelected)}
                  >
                    {addingToCart ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : addedToCart ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    {addedToCart ? "Added to Cart!" : activeStock === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-12 w-12 shrink-0 ${wishlisted ? "text-red-500 border-red-200 bg-red-50 hover:bg-red-100" : ""}`}
                    onClick={handleWishlist}
                    disabled={togglingWishlist}
                    title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {togglingWishlist ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Heart className="h-5 w-5" fill={wishlisted ? "currentColor" : "none"} />
                    )}
                  </Button>
                </div>

                {optionNames.length > 0 && !allSelected && (
                  <p className="text-xs text-muted-foreground">Please select all options to add to cart.</p>
                )}

                {addedToCart && user && (
                  <Link href={`/buyer/${slug}/dashboard/cart`}>
                    <p className="text-xs text-primary font-medium hover:underline">View cart →</p>
                  </Link>
                )}
              </div>

              <Separator />

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4 shrink-0 text-primary" />
                  <span>{product.deliveryEstimate || "Standard Delivery"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                  <span>Secure Checkout</span>
                </div>
              </div>

              {/* Seller */}
              {seller && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Sold by</p>
                    <p className="font-semibold text-sm truncate">{seller.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description + Tags */}
          {(product.description || tags.length > 0) && (
            <div className="mt-6 bg-white rounded-2xl border p-6 lg:p-8 space-y-5">
              {product.description && (
                <div>
                  <h2 className="text-lg font-bold mb-3">Description</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>
              )}
              {tags.length > 0 && (
                <>
                  {product.description && <Separator />}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <Link key={t} href={`/store/products?search=${encodeURIComponent(t)}`}>
                          <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                            {t}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="container mx-auto px-4">
          <ProductReviews productId={productId} />
        </div>

        {/* Recommendations */}
        {recs.length > 0 && (
          <div className="bg-white border-t">
            <div className="container mx-auto px-4 py-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">You Might Also Like</h2>
                <Link href={product.category ? `/store/products?category=${encodeURIComponent(product.category)}` : "/store/products"}>
                  <Button variant="ghost" size="sm" className="text-primary">
                    See all <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {recs.slice(0, 8).map((r) => <RecCard key={r.id} r={r} />)}
              </div>
            </div>
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
