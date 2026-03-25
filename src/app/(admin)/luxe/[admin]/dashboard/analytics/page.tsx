"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface StatsData {
  totalSellers: number;
  totalBuyers: number;
  totalOrders: number;
  totalRevenue: number;
  activeSubscriptions: number;
  totalProducts: number;
  recentOrders: Array<{ status: string }>;
}

const PLATFORM_PRICE = 40_00; // $40.00 in cents

export default function AnalyticsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
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

  const grossRevenue = data?.totalRevenue ?? 0;
  const subscriptionRevenue = (data?.activeSubscriptions ?? 0) * PLATFORM_PRICE;
  const totalUsers = (data?.totalSellers ?? 0) + (data?.totalBuyers ?? 0);
  const paidRatio =
    data?.totalSellers
      ? Math.round(((data.activeSubscriptions ?? 0) / data.totalSellers) * 100)
      : 0;

  // Count order statuses from recentOrders (just a sample — full breakdown needs a dedicated endpoint)
  const statusGroups: Record<string, number> = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  (data?.recentOrders ?? []).forEach((o) => {
    if (o.status in statusGroups) statusGroups[o.status]++;
  });

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Platform Analytics
        </h1>
        <p className="text-muted-foreground">
          Revenue, user growth, and order pipeline.
        </p>
      </div>

      {/* Revenue */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Revenue</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gross Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(grossRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                All non-cancelled orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Subscription MRR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fmt(subscriptionRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data?.activeSubscriptions ?? 0} active × $40/mo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Platform Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fmt(grossRevenue + subscriptionRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Orders + subscriptions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Growth */}
      <div>
        <h2 className="text-lg font-semibold mb-3">User Growth</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sellers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.totalSellers ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Buyers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.totalBuyers ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform Health */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Platform Health</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Paid Seller Ratio</CardTitle>
              <CardDescription>
                {data?.activeSubscriptions ?? 0} of {data?.totalSellers ?? 0}{" "}
                sellers are on a paid plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${paidRatio}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-10 text-right">
                  {paidRatio}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Pipeline</CardTitle>
              <CardDescription>
                Last 5 orders status breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(statusGroups).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="capitalize text-sm w-24">{status}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full"
                      style={{
                        width: `${
                          (data?.recentOrders?.length ?? 0) > 0
                            ? (count / (data?.recentOrders?.length ?? 1)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-4 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
