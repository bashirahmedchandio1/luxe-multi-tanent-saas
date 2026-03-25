"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Package,
  ArrowLeft,
  Upload,
  X,
  Star,
  Tag,
  RefreshCw,
  AlertCircle,
  Ticket,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  GripVertical,
} from "lucide-react";
import { slugify } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  tags: string | null;
  images: string | null;
  image: string | null;
  price: number;
  salePrice: number | null;
  saleStartDate: string | null;
  saleEndDate: string | null;
  costPrice: number | null;
  stock: number;
  lowStockThreshold: number | null;
  category: string | null;
  subcategory: string | null;
  status: string;
  weight: string | null;
  dimensions: string | null;
  shippingClass: string | null;
  deliveryEstimate: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  slug: string | null;
  publishDate: string | null;
  description: string | null;
  createdAt: string;
}

interface VariantOption {
  name: string;
  values: string[];
  valueInput: string;
}

interface VariantRow {
  combo: Record<string, string>;
  sku: string;
  price: string;
  stock: string;
  image: string;
}

interface CouponType {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  expiryDate: string | null;
  minOrderValue: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Record<string, string[]> = {
  "Women's Fashion": ["Tops", "Dresses", "Pants", "Skirts", "Outerwear", "Shoes", "Accessories"],
  "Men's Fashion": ["T-Shirts", "Shirts", "Pants", "Suits", "Outerwear", "Shoes", "Accessories"],
  "Electronics": ["Smartphones", "Laptops", "Tablets", "Audio & Headphones", "Cameras", "Gaming", "TV & Home Theater", "Accessories"],
  "Home & Lifestyle": ["Furniture", "Bedding & Bath", "Kitchen & Dining", "Home Decor", "Lighting", "Storage"],
  "Medicine": ["Vitamins & Supplements", "First Aid", "Personal Care", "OTC Medications"],
  "Sports & Outdoor": ["Fitness Equipment", "Team Sports", "Outdoor & Camping", "Cycling", "Swimming", "Sportswear"],
  "Baby's & Toys": ["Baby Clothing", "Toys & Games", "Baby Gear", "Educational", "Nursery"],
  "Groceries & Pets": ["Fresh Produce", "Pantry Staples", "Snacks & Beverages", "Pet Food", "Pet Accessories"],
  "Health & Beauty": ["Skincare", "Makeup", "Hair Care", "Fragrances", "Bath & Body", "Nail Care"],
};

const SHIPPING_CLASSES = ["standard", "express", "overnight", "free", "pickup"];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  draft: "secondary",
  archived: "destructive",
};

const EMPTY_FORM = {
  name: "", brand: "", description: "", sku: "",
  tagInput: "", tags: [] as string[],
  images: [] as string[], primaryImageIndex: 0,
  price: "", salePrice: "", hasSale: false,
  saleStartDate: "", saleEndDate: "", costPrice: "",
  stock: "0", lowStockThreshold: "5",
  category: "", subcategory: "",
  variantOptions: [] as VariantOption[],
  variants: [] as VariantRow[],
  weight: "", dimL: "", dimW: "", dimH: "", dimUnit: "cm",
  shippingClass: "standard", deliveryEstimate: "",
  metaTitle: "", metaDescription: "", slug: "",
  status: "draft", publishDate: "",
};

const EMPTY_COUPON = {
  code: "", discountType: "percentage", discountValue: "",
  expiryDate: "", minOrderValue: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSKU(name: string): string {
  const prefix = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X").padEnd(3, "X");
  const suffix = Math.floor(Math.random() * 90000 + 10000).toString();
  return `${prefix}-${suffix}`;
}

function generateVariantMatrix(options: VariantOption[], existing: VariantRow[]): VariantRow[] {
  const valid = options.filter((o) => o.name && o.values.length > 0);
  if (valid.length === 0) return [];
  const combos = valid.reduce<Record<string, string>[]>((acc, opt) => {
    if (acc.length === 0) return opt.values.map((v) => ({ [opt.name]: v }));
    return acc.flatMap((combo) => opt.values.map((v) => ({ ...combo, [opt.name]: v })));
  }, []);
  return combos.map((combo) => {
    const key = JSON.stringify(combo);
    const found = existing.find((r) => JSON.stringify(r.combo) === key);
    return found ?? { combo, sku: "", price: "", stock: "0", image: "" };
  });
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function parseImages(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

function parseTags(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

function isOnSale(p: Product): boolean {
  if (!p.salePrice) return false;
  const now = Date.now();
  const start = p.saleStartDate ? new Date(p.saleStartDate).getTime() : 0;
  const end = p.saleEndDate ? new Date(p.saleEndDate).getTime() : Infinity;
  return now >= start && now <= end;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form state
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Image upload
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragOverDrop, setDragOverDrop] = useState(false);
  const [dragImgIdx, setDragImgIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Coupons
  const [showCoupons, setShowCoupons] = useState(false);
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON);
  const [couponSaving, setCouponSaving] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchProducts = async () => {
    const res = await fetch("/api/seller/products");
    const data = await res.json();
    setProducts(data.products ?? []);
  };

  const fetchCoupons = async () => {
    const res = await fetch("/api/seller/coupons");
    const data = await res.json();
    setCoupons(data.coupons ?? []);
  };

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCoupons()]).finally(() => setLoading(false));
  }, []);

  // ── Form helpers ─────────────────────────────────────────────────────────────

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, tags: [], images: [], variants: [], variantOptions: [] });
    setView("form");
  };

  const openEdit = (p: Product) => {
    const imgs = parseImages(p.images);
    const tags = parseTags(p.tags);
    const dims = (() => { try { return p.dimensions ? JSON.parse(p.dimensions) : {}; } catch { return {}; } })();
    setEditingId(p.id);
    setForm({
      name: p.name,
      brand: p.brand ?? "",
      description: p.description ?? "",
      sku: p.sku ?? "",
      tagInput: "",
      tags,
      images: imgs,
      primaryImageIndex: 0,
      price: p.price ? (p.price / 100).toFixed(2) : "",
      salePrice: p.salePrice ? (p.salePrice / 100).toFixed(2) : "",
      hasSale: !!p.salePrice,
      saleStartDate: p.saleStartDate ? p.saleStartDate.split("T")[0] : "",
      saleEndDate: p.saleEndDate ? p.saleEndDate.split("T")[0] : "",
      costPrice: p.costPrice ? (p.costPrice / 100).toFixed(2) : "",
      stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold ?? 5),
      category: p.category ?? "",
      subcategory: p.subcategory ?? "",
      variantOptions: [],
      variants: [],
      weight: p.weight ?? "",
      dimL: dims.l ?? "",
      dimW: dims.w ?? "",
      dimH: dims.h ?? "",
      dimUnit: dims.unit ?? "cm",
      shippingClass: p.shippingClass ?? "standard",
      deliveryEstimate: p.deliveryEstimate ?? "",
      metaTitle: p.metaTitle ?? "",
      metaDescription: p.metaDescription ?? "",
      slug: p.slug ?? "",
      status: p.status,
      publishDate: p.publishDate ? p.publishDate.split("T")[0] : "",
    });
    setView("form");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(id);
    await fetch("/api/seller/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchProducts();
    setDeletingId(null);
  };

  // ── Image upload ────────────────────────────────────────────────────────────

  const uploadFiles = async (files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    if (valid.length === 0) return;
    setUploadingCount((n) => n + valid.length);
    await Promise.all(
      valid.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/seller/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) {
          setForm((prev) => ({ ...prev, images: [...prev.images, data.url] }));
        }
        setUploadingCount((n) => n - 1);
      })
    );
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDrop(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  const removeImage = (idx: number) => {
    setForm((prev) => {
      const imgs = prev.images.filter((_, i) => i !== idx);
      const pi = prev.primaryImageIndex === idx ? 0 : prev.primaryImageIndex > idx ? prev.primaryImageIndex - 1 : prev.primaryImageIndex;
      return { ...prev, images: imgs, primaryImageIndex: Math.min(pi, imgs.length - 1) };
    });
  };

  const handleImgDrop = (targetIdx: number) => {
    if (dragImgIdx === null || dragImgIdx === targetIdx) { setDragImgIdx(null); return; }
    setForm((prev) => {
      const imgs = [...prev.images];
      const [moved] = imgs.splice(dragImgIdx, 1);
      imgs.splice(targetIdx, 0, moved);
      let pi = prev.primaryImageIndex;
      if (dragImgIdx === pi) pi = targetIdx;
      else if (dragImgIdx < pi && targetIdx >= pi) pi--;
      else if (dragImgIdx > pi && targetIdx <= pi) pi++;
      return { ...prev, images: imgs, primaryImageIndex: Math.max(0, Math.min(pi, imgs.length - 1)) };
    });
    setDragImgIdx(null);
  };

  // ── Variant helpers ─────────────────────────────────────────────────────────

  const addVariantOption = () => {
    setForm((prev) => ({
      ...prev,
      variantOptions: [...prev.variantOptions, { name: "", values: [], valueInput: "" }],
    }));
  };

  const removeVariantOption = (idx: number) => {
    setForm((prev) => {
      const opts = prev.variantOptions.filter((_, i) => i !== idx);
      return { ...prev, variantOptions: opts, variants: generateVariantMatrix(opts, prev.variants) };
    });
  };

  const updateVariantOption = (idx: number, field: keyof VariantOption, val: string | string[]) => {
    setForm((prev) => {
      const opts = prev.variantOptions.map((o, i) => i === idx ? { ...o, [field]: val } : o);
      return { ...prev, variantOptions: opts, variants: generateVariantMatrix(opts, prev.variants) };
    });
  };

  const addVariantValue = (optIdx: number) => {
    const opt = form.variantOptions[optIdx];
    const val = opt.valueInput.trim();
    if (!val || opt.values.includes(val)) return;
    updateVariantOption(optIdx, "values", [...opt.values, val]);
    updateVariantOption(optIdx, "valueInput", "");
  };

  const removeVariantValue = (optIdx: number, val: string) => {
    updateVariantOption(optIdx, "values", form.variantOptions[optIdx].values.filter((v) => v !== val));
  };

  const updateVariantRow = (idx: number, field: keyof VariantRow, val: string) => {
    setForm((prev) => {
      const rows = prev.variants.map((r, i) => i === idx ? { ...r, [field]: val } : r);
      return { ...prev, variants: rows };
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSave = async (statusOverride?: string) => {
    if (!form.name.trim()) return;
    setSaving(true);
    const priceVal = parseFloat(form.price);
    if (isNaN(priceVal) || priceVal < 0) { setSaving(false); return; }

    const dims = (form.dimL || form.dimW || form.dimH)
      ? JSON.stringify({ l: form.dimL, w: form.dimW, h: form.dimH, unit: form.dimUnit })
      : null;

    const body = {
      name: form.name.trim(),
      brand: form.brand || null,
      description: form.description || null,
      sku: form.sku || null,
      tags: form.tags,
      images: form.images,
      price: Math.round(priceVal * 100),
      salePrice: form.hasSale && form.salePrice ? Math.round(parseFloat(form.salePrice) * 100) : null,
      saleStartDate: form.hasSale && form.saleStartDate ? form.saleStartDate : null,
      saleEndDate: form.hasSale && form.saleEndDate ? form.saleEndDate : null,
      costPrice: form.costPrice ? Math.round(parseFloat(form.costPrice) * 100) : null,
      stock: parseInt(form.stock) || 0,
      lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
      category: form.category || null,
      subcategory: form.subcategory || null,
      weight: form.weight || null,
      dimensions: dims,
      shippingClass: form.shippingClass || null,
      deliveryEstimate: form.deliveryEstimate || null,
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null,
      slug: form.slug || slugify(form.name),
      status: statusOverride ?? form.status,
      publishDate: form.publishDate || null,
      variants: form.variants.map((r) => ({
        options: r.combo,
        sku: r.sku || null,
        price: Math.round(parseFloat(r.price || String(priceVal)) * 100),
        stock: parseInt(r.stock) || 0,
        image: r.image || null,
      })),
    };

    if (editingId) {
      await fetch("/api/seller/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...body }),
      });
    } else {
      await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    await fetchProducts();
    setView("list");
    setSaving(false);
  };

  // ── Coupon handlers ─────────────────────────────────────────────────────────

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponSaving(true);
    const body = {
      code: couponForm.code,
      discountType: couponForm.discountType,
      discountValue: parseFloat(couponForm.discountValue),
      expiryDate: couponForm.expiryDate || null,
      minOrderValue: couponForm.minOrderValue ? parseFloat(couponForm.minOrderValue) : 0,
    };
    if (editingCouponId) {
      await fetch("/api/seller/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCouponId, ...body }),
      });
      setEditingCouponId(null);
    } else {
      await fetch("/api/seller/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    await fetchCoupons();
    setCouponForm(EMPTY_COUPON);
    setCouponSaving(false);
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    setDeletingCouponId(id);
    await fetch("/api/seller/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchCoupons();
    setDeletingCouponId(null);
  };

  const handleEditCoupon = (c: CouponType) => {
    setEditingCouponId(c.id);
    setCouponForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      expiryDate: c.expiryDate ? c.expiryDate.split("T")[0] : "",
      minOrderValue: c.minOrderValue ? String(c.minOrderValue / 100) : "",
    });
  };

  // ── Filtered products ────────────────────────────────────────────────────────

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === "active").length,
    draft: products.filter((p) => p.status === "draft").length,
    lowStock: products.filter((p) => p.stock <= (p.lowStockThreshold ?? 5) && p.stock > 0).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  };

  // ── Loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT FORM VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === "form") {
    const subcats = form.category ? (CATEGORIES[form.category] ?? []) : [];

    return (
      <div className="space-y-0">
        {/* Sticky form header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-0 py-4 -mt-2 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView("list")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Products
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <h2 className="font-semibold text-base">
              {editingId ? `Editing: ${form.name || "…"}` : "New Product"}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Draft
            </Button>
            <Button size="sm" onClick={() => handleSave("active")} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Publish
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="w-full justify-start h-10 bg-muted/50 p-1 rounded-lg overflow-x-auto">
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="media" className="text-xs">
              Media {form.images.length > 0 && <Badge className="ml-1.5 h-4 px-1.5 text-[10px]">{form.images.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs">Pricing</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs">Inventory</TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs">Shipping</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs">SEO & Status</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Details ─────────────────────────────────────────────── */}
          <TabsContent value="details">
            <div className="grid grid-cols-2 gap-6">
              <Card className="col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Product Title *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({
                          ...p, name: e.target.value,
                          slug: slugify(e.target.value),
                          metaTitle: e.target.value,
                        }))}
                        placeholder="e.g. Premium Cotton T-Shirt"
                        className="text-base font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Brand</Label>
                      <Input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} placeholder="Brand name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>SKU</Label>
                      <div className="flex gap-2">
                        <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} placeholder="Auto-generate or enter manually" />
                        <Button type="button" variant="outline" size="icon" title="Auto-generate SKU"
                          onClick={() => setForm((p) => ({ ...p, sku: generateSKU(p.name || "PRD") }))}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe your product in detail — materials, features, sizing, care instructions…"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                          {t}
                          <button onClick={() => setForm((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }))}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={form.tagInput}
                        onChange={(e) => setForm((p) => ({ ...p, tagInput: e.target.value }))}
                        placeholder="Add tag and press Enter"
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === ",") && form.tagInput.trim()) {
                            e.preventDefault();
                            const t = form.tagInput.trim().replace(/,$/, "");
                            if (!form.tags.includes(t)) setForm((p) => ({ ...p, tags: [...p.tags, t], tagInput: "" }));
                            else setForm((p) => ({ ...p, tagInput: "" }));
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm"
                        onClick={() => {
                          const t = form.tagInput.trim();
                          if (t && !form.tags.includes(t)) setForm((p) => ({ ...p, tags: [...p.tags, t], tagInput: "" }));
                        }}>
                        <Tag className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Press Enter or comma to add a tag</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab 2: Media ───────────────────────────────────────────────── */}
          <TabsContent value="media">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Product Images</CardTitle>
                <CardDescription>Upload up to 10 images. Drag to reorder. Click ★ to set primary.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drop zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOverDrop ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverDrop(true); }}
                  onDragLeave={() => setDragOverDrop(false)}
                  onDrop={handleDropFiles}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && uploadFiles(Array.from(e.target.files))}
                  />
                  {uploadingCount > 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Uploading {uploadingCount} image{uploadingCount > 1 ? "s" : ""}…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-sm">Drop images here or click to browse</p>
                      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF — max 5 MB each</p>
                    </div>
                  )}
                </div>

                {/* Image grid */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {form.images.map((url, idx) => (
                      <div
                        key={url + idx}
                        draggable
                        onDragStart={() => setDragImgIdx(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleImgDrop(idx)}
                        onDragEnd={() => setDragImgIdx(null)}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${idx === form.primaryImageIndex ? "border-primary" : "border-transparent hover:border-border"} ${dragImgIdx === idx ? "opacity-40" : ""}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full aspect-square object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="Set as primary"
                            onClick={() => setForm((p) => ({ ...p, primaryImageIndex: idx }))}
                            className={`p-1.5 rounded-full ${idx === form.primaryImageIndex ? "bg-yellow-400 text-black" : "bg-white/80 text-gray-700"}`}
                          >
                            <Star className="h-3.5 w-3.5" fill={idx === form.primaryImageIndex ? "currentColor" : "none"} />
                          </button>
                          <button
                            type="button"
                            title="Remove"
                            onClick={() => removeImage(idx)}
                            className="p-1.5 rounded-full bg-red-500 text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {idx === form.primaryImageIndex && (
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                            PRIMARY
                          </div>
                        )}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-4 w-4 text-white drop-shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: Pricing ─────────────────────────────────────────────── */}
          <TabsContent value="pricing">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Base Price ($) *</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Cost Price ($) <span className="text-muted-foreground text-xs">(hidden from customers)</span></Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={form.costPrice}
                      onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))}
                      placeholder="Your purchase cost"
                    />
                    {form.price && form.costPrice && (
                      <p className="text-xs text-green-600 font-medium">
                        Margin: {(((parseFloat(form.price) - parseFloat(form.costPrice)) / parseFloat(form.price)) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Sale toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Sale / Discount</p>
                      <p className="text-xs text-muted-foreground">Set a sale price with optional schedule</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, hasSale: !p.hasSale }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.hasSale ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.hasSale ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {form.hasSale && (
                    <div className="space-y-3 p-3 rounded-lg bg-muted/40 border">
                      <div className="space-y-1.5">
                        <Label>Sale Price ($)</Label>
                        <Input
                          type="number" min="0" step="0.01"
                          value={form.salePrice}
                          onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))}
                          placeholder="0.00"
                        />
                        {form.price && form.salePrice && (
                          <p className="text-xs text-orange-600 font-medium">
                            Discount: {(100 - (parseFloat(form.salePrice) / parseFloat(form.price)) * 100).toFixed(0)}% off
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Sale Start</Label>
                          <input type="date" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.saleStartDate} onChange={(e) => setForm((p) => ({ ...p, saleStartDate: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Sale End</Label>
                          <input type="date" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.saleEndDate} onChange={(e) => setForm((p) => ({ ...p, saleEndDate: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Price preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Price Preview</CardTitle>
                  <CardDescription>How the price appears to customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border p-5 space-y-2 bg-muted/20">
                    {form.hasSale && form.salePrice ? (
                      <>
                        <p className="text-2xl font-bold text-primary">${parseFloat(form.salePrice || "0").toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground line-through">${parseFloat(form.price || "0").toFixed(2)}</p>
                        <Badge className="bg-orange-500 text-white text-xs">
                          SAVE {(100 - (parseFloat(form.salePrice) / parseFloat(form.price || "1")) * 100).toFixed(0)}%
                        </Badge>
                        {form.saleStartDate && form.saleEndDate && (
                          <p className="text-xs text-muted-foreground pt-1">
                            Sale: {new Date(form.saleStartDate).toLocaleDateString()} – {new Date(form.saleEndDate).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-2xl font-bold">${parseFloat(form.price || "0").toFixed(2)}</p>
                    )}
                    {form.costPrice && form.price && (
                      <p className="text-xs text-green-600 pt-2 border-t mt-2">
                        Gross profit: ${(parseFloat(form.price) - parseFloat(form.costPrice)).toFixed(2)} per unit
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab 4: Inventory ───────────────────────────────────────────── */}
          <TabsContent value="inventory">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Stock */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Stock & Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Stock Quantity</Label>
                        <Input type="number" min="0" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Low Stock Alert</Label>
                        <Input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm((p) => ({ ...p, lowStockThreshold: e.target.value }))} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Category *</Label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={form.category}
                        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value, subcategory: "" }))}
                      >
                        <option value="">Select main category…</option>
                        {Object.keys(CATEGORIES).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {form.category && subcats.length > 0 && (
                      <div className="space-y-1.5">
                        <Label>Subcategory</Label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={form.subcategory}
                          onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))}
                        >
                          <option value="">All in {form.category}</option>
                          {subcats.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stock indicator */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Stock Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {parseInt(form.stock) === 0 ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-red-700">Out of Stock</p>
                            <p className="text-xs text-red-500">Product will be unavailable</p>
                          </div>
                        </div>
                      ) : parseInt(form.stock) <= parseInt(form.lowStockThreshold || "5") ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="text-sm font-medium text-yellow-700">Low Stock</p>
                            <p className="text-xs text-yellow-500">Only {form.stock} left</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                          <Package className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-green-700">In Stock</p>
                            <p className="text-xs text-green-500">{form.stock} units available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Variants */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Product Variants</CardTitle>
                      <CardDescription>Add Size, Color, Material, or any other variation</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addVariantOption}>
                      <Plus className="h-4 w-4 mr-1" /> Add Option
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.variantOptions.map((opt, optIdx) => (
                    <div key={optIdx} className="rounded-lg border p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Option name (e.g. Size, Color)"
                          value={opt.name}
                          className="flex-1"
                          onChange={(e) => updateVariantOption(optIdx, "name", e.target.value)}
                        />
                        <Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeVariantOption(optIdx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {opt.values.map((v) => (
                          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                            {v}
                            <button type="button" onClick={() => removeVariantValue(optIdx, v)}><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Add ${opt.name || "value"} and press Enter`}
                          value={opt.valueInput}
                          onChange={(e) => updateVariantOption(optIdx, "valueInput", e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVariantValue(optIdx); } }}
                          className="h-8 text-sm"
                        />
                        <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => addVariantValue(optIdx)}>Add</Button>
                      </div>
                    </div>
                  ))}

                  {/* Variant matrix */}
                  {form.variants.length > 0 && (
                    <div className="overflow-x-auto">
                      <p className="text-sm font-medium mb-2">{form.variants.length} variant{form.variants.length !== 1 ? "s" : ""} generated</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {form.variantOptions.map((o) => <TableHead key={o.name}>{o.name}</TableHead>)}
                            <TableHead>SKU</TableHead>
                            <TableHead>Price ($)</TableHead>
                            <TableHead>Stock</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {form.variants.map((row, rowIdx) => (
                            <TableRow key={rowIdx}>
                              {Object.values(row.combo).map((v, vi) => (
                                <TableCell key={vi} className="font-medium text-sm">{v}</TableCell>
                              ))}
                              <TableCell>
                                <Input value={row.sku} onChange={(e) => updateVariantRow(rowIdx, "sku", e.target.value)} placeholder="SKU" className="h-7 text-xs w-28" />
                              </TableCell>
                              <TableCell>
                                <Input type="number" min="0" step="0.01" value={row.price} onChange={(e) => updateVariantRow(rowIdx, "price", e.target.value)} placeholder={form.price || "0.00"} className="h-7 text-xs w-24" />
                              </TableCell>
                              <TableCell>
                                <Input type="number" min="0" value={row.stock} onChange={(e) => updateVariantRow(rowIdx, "stock", e.target.value)} className="h-7 text-xs w-20" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {form.variantOptions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Add options above to generate a variant matrix
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab 5: Shipping ────────────────────────────────────────────── */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Shipping Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Weight</Label>
                    <Input value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} placeholder="e.g. 1.5 kg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Shipping Class</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={form.shippingClass} onChange={(e) => setForm((p) => ({ ...p, shippingClass: e.target.value }))}>
                      {SHIPPING_CLASSES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Dimensions</Label>
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Length" type="number" min="0" step="0.1" value={form.dimL} onChange={(e) => setForm((p) => ({ ...p, dimL: e.target.value }))} />
                    <span className="text-muted-foreground text-sm shrink-0">×</span>
                    <Input placeholder="Width" type="number" min="0" step="0.1" value={form.dimW} onChange={(e) => setForm((p) => ({ ...p, dimW: e.target.value }))} />
                    <span className="text-muted-foreground text-sm shrink-0">×</span>
                    <Input placeholder="Height" type="number" min="0" step="0.1" value={form.dimH} onChange={(e) => setForm((p) => ({ ...p, dimH: e.target.value }))} />
                    <select className="rounded-md border border-input bg-background px-2 py-2 text-sm w-20 shrink-0"
                      value={form.dimUnit} onChange={(e) => setForm((p) => ({ ...p, dimUnit: e.target.value }))}>
                      <option value="cm">cm</option>
                      <option value="in">in</option>
                      <option value="mm">mm</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Delivery Estimate</Label>
                  <Input value={form.deliveryEstimate} onChange={(e) => setForm((p) => ({ ...p, deliveryEstimate: e.target.value }))} placeholder="e.g. 3–5 business days" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 6: SEO & Status ────────────────────────────────────────── */}
          <TabsContent value="seo">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">SEO Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>URL Slug</Label>
                    <div className="flex gap-2">
                      <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} placeholder="product-url-slug" />
                      <Button type="button" variant="outline" size="icon" title="Generate from title"
                        onClick={() => setForm((p) => ({ ...p, slug: slugify(p.name) }))}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    {form.slug && <p className="text-xs text-muted-foreground">/store/product/{form.slug}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meta Title <span className="text-xs text-muted-foreground">({(form.metaTitle || form.name).length}/60)</span></Label>
                    <Input
                      value={form.metaTitle}
                      maxLength={60}
                      onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))}
                      placeholder="SEO title shown in search results"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meta Description <span className="text-xs text-muted-foreground">({form.metaDescription.length}/160)</span></Label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      value={form.metaDescription}
                      maxLength={160}
                      onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))}
                      placeholder="Brief description for search engines…"
                    />
                  </div>
                  {/* OG preview */}
                  {(form.name || form.metaDescription) && (
                    <div className="rounded-lg border p-3 space-y-1 bg-muted/20">
                      <p className="text-xs text-muted-foreground">Search preview</p>
                      <p className="text-sm text-blue-600 font-medium truncate">{form.metaTitle || form.name}</p>
                      <p className="text-xs text-green-700">/store/product/{form.slug || slugify(form.name)}</p>
                      {form.metaDescription && <p className="text-xs text-muted-foreground line-clamp-2">{form.metaDescription}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                      <option value="draft">Draft</option>
                      <option value="active">Active (Published)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Schedule Publish Date</Label>
                    <input type="datetime-local"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={form.publishDate}
                      onChange={(e) => setForm((p) => ({ ...p, publishDate: e.target.value }))} />
                    <p className="text-xs text-muted-foreground">Leave blank to publish immediately</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => handleSave("active")} disabled={saving || !form.name.trim()}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Publish Now
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleSave("draft")} disabled={saving || !form.name.trim()}>
                      Save as Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your store listings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCoupons((v) => !v)}>
            <Ticket className="h-4 w-4 mr-1.5" />
            Coupons
            {coupons.filter((c) => c.isActive).length > 0 && (
              <Badge className="ml-1.5 h-4 px-1.5 text-[10px]">{coupons.filter((c) => c.isActive).length}</Badge>
            )}
            {showCoupons ? <ChevronUp className="h-3.5 w-3.5 ml-1.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-1.5" />}
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Active", value: stats.active, color: "text-green-600" },
          { label: "Drafts", value: stats.draft, color: "text-yellow-600" },
          { label: "Low Stock", value: stats.lowStock, color: "text-orange-500" },
          { label: "Out of Stock", value: stats.outOfStock, color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-3">
            <CardContent className="p-0">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coupons panel */}
      {showCoupons && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="h-4 w-4" /> Coupons & Discounts
            </CardTitle>
            <CardDescription>Create promo codes for your store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCouponSubmit} className="grid grid-cols-6 gap-3 items-end">
              <div className="col-span-1 space-y-1.5">
                <Label className="text-xs">Code</Label>
                <Input value={couponForm.code} onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SAVE10" required className="h-9 text-sm" />
              </div>
              <div className="col-span-1 space-y-1.5">
                <Label className="text-xs">Type</Label>
                <select className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm" value={couponForm.discountType} onChange={(e) => setCouponForm((p) => ({ ...p, discountType: e.target.value }))}>
                  <option value="percentage">% Off</option>
                  <option value="fixed">$ Off</option>
                </select>
              </div>
              <div className="col-span-1 space-y-1.5">
                <Label className="text-xs">Value</Label>
                <Input type="number" min="0" step="0.01" value={couponForm.discountValue} onChange={(e) => setCouponForm((p) => ({ ...p, discountValue: e.target.value }))} placeholder="10" required className="h-9 text-sm" />
              </div>
              <div className="col-span-1 space-y-1.5">
                <Label className="text-xs">Min Order ($)</Label>
                <Input type="number" min="0" step="0.01" value={couponForm.minOrderValue} onChange={(e) => setCouponForm((p) => ({ ...p, minOrderValue: e.target.value }))} placeholder="0" className="h-9 text-sm" />
              </div>
              <div className="col-span-1 space-y-1.5">
                <Label className="text-xs">Expires</Label>
                <input type="date" className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm" value={couponForm.expiryDate} onChange={(e) => setCouponForm((p) => ({ ...p, expiryDate: e.target.value }))} />
              </div>
              <div className="col-span-1 flex gap-1.5">
                <Button type="submit" size="sm" className="h-9 flex-1" disabled={couponSaving}>
                  {couponSaving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  {editingCouponId ? "Update" : "Add"}
                </Button>
                {editingCouponId && (
                  <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => { setEditingCouponId(null); setCouponForm(EMPTY_COUPON); }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>

            {coupons.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-semibold text-sm">{c.code}</TableCell>
                      <TableCell>
                        {c.discountType === "percentage" ? `${c.discountValue}%` : fmt(c.discountValue)} off
                      </TableCell>
                      <TableCell>{c.minOrderValue > 0 ? fmt(c.minOrderValue) : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "No expiry"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Active" : "Disabled"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditCoupon(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7"
                            onClick={() => fetch("/api/seller/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, isActive: !c.isActive }) }).then(fetchCoupons)}
                          >
                            {c.isActive ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 text-green-600" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteCoupon(c.id)} disabled={deletingCouponId === c.id}>
                            {deletingCouponId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Search products, SKU, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1">
          {["all", "active", "draft", "archived"].map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "ghost"} className="h-8 text-xs capitalize"
              onClick={() => setStatusFilter(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Products table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Products</CardTitle>
          <CardDescription>{filtered.length} of {products.length} listing{products.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{products.length === 0 ? "No products yet" : "No products match your search"}</p>
              {products.length === 0 && <p className="text-sm">Click &ldquo;Add Product&rdquo; to create your first listing.</p>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const imgs = parseImages(p.images);
                  const thumbnail = imgs[0] ?? p.image;
                  const onSale = isOnSale(p);
                  const lowStock = p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbnail} alt="" className="h-10 w-10 rounded-md object-cover border" />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{p.name}</p>
                        {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                        {(parseTags(p.tags)).slice(0, 2).map((t) => (
                          <span key={t} className="inline-block rounded-full bg-muted px-1.5 py-0 text-[10px] mr-1 mt-0.5">{t}</span>
                        ))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.category ? (
                          <span>{p.category}{p.subcategory ? ` / ${p.subcategory}` : ""}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <div>
                          {onSale && p.salePrice ? (
                            <>
                              <p className="font-semibold text-sm text-primary">{fmt(p.salePrice)}</p>
                              <p className="text-xs text-muted-foreground line-through">{fmt(p.price)}</p>
                            </>
                          ) : (
                            <p className="font-medium text-sm">{fmt(p.price)}</p>
                          )}
                          {p.salePrice && !onSale && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 mt-0.5">Sale scheduled</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${p.stock === 0 ? "text-red-500" : lowStock ? "text-orange-500" : "text-foreground"}`}>
                          {p.stock}
                        </span>
                        {lowStock && <p className="text-[10px] text-orange-500">Low stock</p>}
                        {p.stock === 0 && <p className="text-[10px] text-red-500">Out of stock</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}>
                            {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Missing import — add Check icon inline
function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
