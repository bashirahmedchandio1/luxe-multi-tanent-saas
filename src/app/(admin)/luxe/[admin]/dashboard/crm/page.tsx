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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Store, Users, Search } from "lucide-react";

interface StatsData {
  totalSellers: number;
  totalBuyers: number;
}

interface Seller {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  subscriptionStatus: string;
  orderCount: number;
  productCount: number;
}

interface Buyer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  orderCount: number;
}

const SUB_BADGE: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  inactive: "secondary",
  cancelled: "destructive",
  past_due: "outline",
};

export default function AdminCRMPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/users/sellers").then((r) => r.json()),
      fetch("/api/admin/users/buyers").then((r) => r.json()),
    ]).then(([statsData, sellersData, buyersData]) => {
      setStats(statsData);
      setSellers(sellersData.sellers ?? []);
      setBuyers(buyersData.buyers ?? []);
      setLoading(false);
    });
  }, []);

  const filteredSellers = sellers.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const filteredBuyers = buyers.filter((b) => {
    const q = search.toLowerCase();
    return !q || b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform CRM</h1>
        <p className="text-muted-foreground">
          Unified view of all platform users.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Users</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalSellers ?? 0) + (stats?.totalBuyers ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Sellers + Buyers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Sellers</CardDescription>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalSellers ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Registered sellers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Buyers</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalBuyers ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Registered buyers</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="sellers">
        <TabsList>
          <TabsTrigger value="sellers">
            Sellers ({filteredSellers.length})
          </TabsTrigger>
          <TabsTrigger value="buyers">
            Buyers ({filteredBuyers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sellers">
          <Card>
            <CardContent className="pt-6">
              {filteredSellers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Store className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No sellers found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellers.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              SUB_BADGE[s.subscriptionStatus] ?? "secondary"
                            }
                            className={
                              s.subscriptionStatus === "active"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : ""
                            }
                          >
                            {s.subscriptionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{s.orderCount}</TableCell>
                        <TableCell>{s.productCount}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(s.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buyers">
          <Card>
            <CardContent className="pt-6">
              {filteredBuyers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No buyers found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuyers.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {b.email}
                        </TableCell>
                        <TableCell>{b.orderCount}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(b.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
