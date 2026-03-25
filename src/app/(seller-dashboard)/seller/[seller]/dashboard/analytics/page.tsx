"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";

interface AnalyticsData {
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  statusCounts: Record<string, number>;
  recentOrders: unknown[];
}

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-400",
  processing: "bg-yellow-400",
  shipped: "bg-blue-400",
  delivered: "bg-green-500",
  cancelled: "bg-red-400",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seller/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const grossRevenue = (data?.totalRevenue ?? 0) / 100;
  const fees = grossRevenue * 0.025;
  const netRevenue = grossRevenue - fees;
  const totalOrders = data?.totalOrders ?? 0;
  const counts = data?.statusCounts ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into your store performance.</p>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gross Revenue</CardDescription>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {grossRevenue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All non-cancelled orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Platform Fees (2.5%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              -{fees.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Estimated processing fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {netRevenue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">After fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalProducts ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>CRM Contacts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalCustomers ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Order Pipeline</CardTitle>
          <CardDescription>Orders by fulfillment status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalOrders === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orders yet.</p>
          ) : (
            STATUSES.map((s) => {
              const count = counts[s] ?? 0;
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={s} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize font-medium w-28">{s}</span>
                    <span className="text-muted-foreground">
                      {count} order{count !== 1 ? "s" : ""} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${STATUS_COLORS[s]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
