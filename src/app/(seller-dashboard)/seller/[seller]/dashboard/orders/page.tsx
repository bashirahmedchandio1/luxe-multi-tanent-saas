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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ShoppingBag } from "lucide-react";

interface Order {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  quantity: number;
  total: number;
  status: string;
  createdAt: string;
}

const STATUSES = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  processing: "outline",
  shipped: "outline",
  delivered: "default",
  cancelled: "destructive",
};

const STATUS_CLASS: Record<string, string> = {
  processing: "text-yellow-600",
  shipped: "text-blue-600",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async (status?: string) => {
    const url = status && status !== "all" ? `/api/seller/orders?status=${status}` : "/api/seller/orders";
    const res = await fetch(url);
    const data = await res.json();
    setOrders(data.orders ?? []);
  };

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
  }, []);

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    setLoading(true);
    await fetchOrders(tab === "all" ? undefined : tab);
    setLoading(false);
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    await fetch("/api/seller/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status }),
    });
    await fetchOrders(activeTab === "all" ? undefined : activeTab);
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Track and manage your customer orders.</p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleTabChange(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              activeTab === s
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "all" ? "All Orders" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Orders`}
          </CardTitle>
          <CardDescription>{orders.length} order{orders.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No orders found</p>
              <p className="text-sm">Orders will appear here when customers purchase.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Update Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}…</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{o.customerName || "—"}</p>
                        {o.customerEmail && (
                          <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{o.quantity}</TableCell>
                    <TableCell className="font-medium">
                      {(o.total / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[o.status]} className={STATUS_CLASS[o.status]}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(o.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {updatingId === o.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <select
                          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
