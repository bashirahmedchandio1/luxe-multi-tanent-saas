"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Plus,
  Zap,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";

const CATEGORIES = [
  "Women's Fashion",
  "Men's Fashion",
  "Electronics",
  "Home & Lifestyle",
  "Medicine",
  "Sports & Outdoor",
  "Baby's & Toys",
  "Groceries & Pets",
  "Health & Beauty",
];

interface PlatformSale {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetType: string;
  targetCategory: string | null;
  createdAt: string;
}

const EMPTY_FORM = {
  name: "",
  discountType: "percentage",
  discountValue: "",
  startDate: "",
  endDate: "",
  isActive: true,
  targetType: "all",
  targetCategory: "",
};

function isLive(sale: PlatformSale) {
  const now = Date.now();
  return (
    sale.isActive &&
    new Date(sale.startDate).getTime() <= now &&
    new Date(sale.endDate).getTime() >= now
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SalesPage() {
  const [sales, setSales] = useState<PlatformSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PlatformSale | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSales = () => {
    setLoading(true);
    fetch("/api/admin/sales")
      .then((r) => r.json())
      .then((d) => setSales(d.sales ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (sale: PlatformSale) => {
    setEditing(sale);
    setForm({
      name: sale.name,
      discountType: sale.discountType,
      discountValue: String(sale.discountValue),
      startDate: sale.startDate.slice(0, 16), // datetime-local format
      endDate: sale.endDate.slice(0, 16),
      isActive: sale.isActive,
      targetType: sale.targetType,
      targetCategory: sale.targetCategory ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.discountValue || !form.startDate || !form.endDate)
      return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        targetCategory: form.targetType === "category" ? form.targetCategory : null,
      };

      const res = editing
        ? await fetch("/api/admin/sales", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editing.id, ...payload }),
          })
        : await fetch("/api/admin/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        setShowForm(false);
        fetchSales();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (sale: PlatformSale) => {
    await fetch("/api/admin/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sale.id, isActive: !sale.isActive }),
    });
    fetchSales();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch("/api/admin/sales", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    fetchSales();
  };

  const liveSales = sales.filter(isLive);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Sales</h1>
          <p className="text-muted-foreground">
            Create flash sales and promotions visible to all store visitors.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Sale
        </Button>
      </div>

      {/* Live sales banner */}
      {liveSales.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <Zap className="h-5 w-5 text-red-500 fill-red-500 animate-pulse shrink-0" />
          <div>
            <p className="font-semibold text-red-700">
              {liveSales.length} sale{liveSales.length > 1 ? "s" : ""} live right now
            </p>
            <p className="text-sm text-red-600">
              {liveSales.map((s) => s.name).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editing ? "Edit Sale" : "Create New Sale"}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Sale Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Summer Flash Sale"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Discount Type *</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.discountType}
                  onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (cents)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Discount Value *{" "}
                  <span className="text-muted-foreground font-normal">
                    {form.discountType === "percentage" ? "(0–100)" : "(in cents, e.g. 1000 = $10)"}
                  </span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={form.discountType === "percentage" ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                  placeholder={form.discountType === "percentage" ? "20" : "1000"}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Start Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>End Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Target</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.targetType}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      targetType: e.target.value,
                      targetCategory: "",
                    }))
                  }
                >
                  <option value="all">All Products</option>
                  <option value="category">Specific Category</option>
                </select>
              </div>

              {form.targetType === "category" && (
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={form.targetCategory}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, targetCategory: e.target.value }))
                    }
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (visible on store)
              </Label>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? "Save Changes" : "Create Sale"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
          <CardDescription>{sales.length} sale{sales.length !== 1 ? "s" : ""} created</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No sales created yet</p>
              <p className="text-sm mt-1">
                Click &ldquo;New Sale&rdquo; to launch your first promotion.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  const live = isLive(sale);
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {live && (
                            <Zap className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse shrink-0" />
                          )}
                          {sale.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sale.discountType === "percentage"
                            ? `${sale.discountValue}% off`
                            : `$${(sale.discountValue / 100).toFixed(2)} off`}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground text-sm">
                        {sale.targetType === "category" && sale.targetCategory
                          ? sale.targetCategory
                          : "All products"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {fmtDate(sale.startDate)} → {fmtDate(sale.endDate)}
                      </TableCell>
                      <TableCell>
                        {live ? (
                          <Badge className="bg-red-100 text-red-700 border-red-300">
                            Live
                          </Badge>
                        ) : sale.isActive ? (
                          <Badge variant="secondary">Scheduled</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleActive(sale)}
                            title={sale.isActive ? "Deactivate" : "Activate"}
                          >
                            {sale.isActive ? (
                              <ToggleRight className="h-4 w-4 text-primary" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(sale)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(sale.id)}
                            disabled={deleting === sale.id}
                          >
                            {deleting === sale.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
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
