"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Package, ShoppingBag, MapPin, Store, Calendar,
  XCircle, Truck, CheckCircle2, PhoneCall, RotateCcw,
} from "lucide-react";

interface Order {
  id: string;
  quantity: number;
  total: number;
  status: string;
  shippingAddress: string | null;
  createdAt: string;
  productId: string | null;
  productName: string | null;
  productImage: string | null;
  productImages: string | null;
  sellerName: string | null;
}

function parseImages(val: string | null): string[] {
  try { return val ? JSON.parse(val) : []; } catch { return []; }
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// What action/hint to show per status
function CancelHint({ status, orderId, onCancelled }: {
  status: string;
  orderId: string;
  onCancelled: (id: string) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    const res = await fetch(`/api/buyer/orders/${orderId}`, { method: "PATCH" });
    if (res.ok) onCancelled(orderId);
    setCancelling(false);
    setConfirmOpen(false);
  };

  if (status === "pending") {
    return confirmOpen ? (
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-muted-foreground">Cancel this order?</span>
        <Button
          size="sm"
          variant="destructive"
          className="h-7 text-xs px-3"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, cancel"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setConfirmOpen(false)}>
          Keep order
        </Button>
      </div>
    ) : (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs px-3 mt-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel Order
      </Button>
    );
  }

  if (status === "processing") {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
        <PhoneCall className="h-3.5 w-3.5 shrink-0" />
        <span>Order is being processed — contact support to cancel</span>
      </div>
    );
  }

  if (status === "shipped") {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-600">
        <Truck className="h-3.5 w-3.5 shrink-0" />
        <span>Already shipped — cancellation not available. Refuse delivery to return.</span>
      </div>
    );
  }

  if (status === "delivered") {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
        <RotateCcw className="h-3.5 w-3.5 shrink-0" />
        <span>Delivered — contact support within 30 days to request a return</span>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Order was cancelled</span>
      </div>
    );
  }

  return null;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/buyer/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelled = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
        <Package className="h-16 w-16 opacity-20" />
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">No orders yet</p>
          <p className="text-sm mt-1">Your completed orders will appear here.</p>
        </div>
        <Button asChild>
          <Link href="/store/products">
            <ShoppingBag className="mr-2 h-4 w-4" /> Browse Products
          </Link>
        </Button>
      </div>
    );
  }

  // Group orders by date (day) for a timeline feel
  const grouped = orders.reduce<Record<string, Order[]>>((acc, o) => {
    const day = new Date(o.createdAt).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
    (acc[day] ??= []).push(o);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
        <p className="text-muted-foreground">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </p>
      </div>

      {Object.entries(grouped).map(([day, dayOrders]) => (
        <div key={day}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{day}</span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-3">
            {dayOrders.map((o) => {
              const imgs = parseImages(o.productImages);
              const thumb = imgs[0] ?? o.productImage;
              const statusStyle = STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-700 border-gray-200";

              return (
                <div key={o.id} className="bg-white rounded-xl border p-4 flex gap-4">
                  {/* Thumbnail */}
                  <Link
                    href={o.productId ? `/store/products/${o.productId}` : "#"}
                    className="shrink-0"
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={o.productName ?? "Product"}
                        className="h-20 w-20 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={o.productId ? `/store/products/${o.productId}` : "#"}
                          className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1"
                        >
                          {o.productName ?? "Product no longer available"}
                        </Link>
                        <p className="text-xs text-muted-foreground">Qty: {o.quantity}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs font-medium ${statusStyle}`}
                      >
                        {statusLabel(o.status)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {o.sellerName && (
                        <span className="flex items-center gap-1">
                          <Store className="h-3 w-3" /> {o.sellerName}
                        </span>
                      )}
                      {o.shippingAddress && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{o.shippingAddress}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="font-bold text-sm">${(o.total / 100).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">
                        Order #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <CancelHint
                      status={o.status}
                      orderId={o.id}
                      onCancelled={handleCancelled}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
