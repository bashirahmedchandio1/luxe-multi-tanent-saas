"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ExternalLink, Store } from "lucide-react";
import Link from "next/link";

const PLATFORM_PRICE = 40;

export default function SettingsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const slug = params.admin as string;
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setActiveSubscriptions(d.activeSubscriptions ?? 0))
      .finally(() => setLoading(false));
  }, []);

  const mrr = activeSubscriptions * PLATFORM_PRICE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Platform configuration and billing.
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Platform information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Platform Name</p>
              <p className="font-medium mt-0.5">Luxe</p>
            </div>
            <div>
              <p className="text-muted-foreground">Admin Email</p>
              <p className="font-medium mt-0.5">
                {session?.user?.email || "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <Badge variant="outline" className="mt-0.5">
                {session?.user?.role || "admin"}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Platform URL</p>
              <p className="font-medium mt-0.5">
                {typeof window !== "undefined" ? window.location.origin : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Overview</CardTitle>
          <CardDescription>
            Seller subscription revenue — $40/month per seller
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold mt-0.5">
                  {activeSubscriptions}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold mt-0.5">
                  ${mrr.toLocaleString("en-US")}
                </p>
              </div>
            </div>
          )}
          <Separator />
          <p className="text-sm text-muted-foreground">
            Seller subscriptions are managed via Stripe. Visit the Stripe
            dashboard to view invoices, refunds, and subscription details.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Stripe Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Management</CardTitle>
          <CardDescription>
            Manage seller subscriptions and platform users.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/luxe/${slug}/dashboard/users/sellers`}>
              <Store className="h-4 w-4 mr-2" />
              Manage Sellers
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
