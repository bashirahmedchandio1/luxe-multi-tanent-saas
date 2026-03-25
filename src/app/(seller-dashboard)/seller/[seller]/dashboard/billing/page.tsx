"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  CheckCircle,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  cancelled: "destructive",
  past_due: "outline",
};

const STATUS_CLASS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-300",
  past_due: "text-yellow-600 border-yellow-400",
};

const PLAN_FEATURES = [
  "Unlimited product listings",
  "Advanced analytics & reporting",
  "CRM with contact management",
  "Kanban project board",
  "Priority customer support",
  "Custom store branding",
];

export default function SellerBillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    const res = await fetch("/api/stripe/seller-subscription");
    const data = await res.json();
    setSubscription(data.subscription);
  }, []);

  useEffect(() => {
    // Check for success param from Stripe redirect
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        setSuccessMessage("Subscription activated! Welcome to the Seller Platform.");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
    fetchSubscription().finally(() => setLoading(false));
  }, [fetchSubscription]);

  const handleAction = async (action: string) => {
    setActionLoading(action);

    if (action === "cancel") {
      if (!window.confirm("Are you sure you want to cancel your subscription? You will lose access at the end of the billing period.")) {
        setActionLoading(null);
        return;
      }
    }

    const res = await fetch("/api/stripe/seller-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    if (data.success) {
      await fetchSubscription();
    }

    setActionLoading(null);
  };

  const isActive = subscription?.status === "active";

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
        <h1 className="text-3xl font-bold tracking-tight">Platform Billing</h1>
        <p className="text-muted-foreground">Manage your Seller Platform subscription.</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-800">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Seller Platform Plan
                </CardTitle>
                <CardDescription>$40 / month</CardDescription>
              </div>
              <Badge
                variant={STATUS_VARIANT[subscription?.status ?? "inactive"]}
                className={STATUS_CLASS[subscription?.status ?? ""] ?? ""}
              >
                {subscription?.status ?? "inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isActive && subscription?.currentPeriodStart && subscription?.currentPeriodEnd && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p className="font-medium">Current Period</p>
                <p className="text-muted-foreground">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  →{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            {!isActive && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>You don&apos;t have an active subscription. Subscribe to unlock all seller features.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!isActive ? (
                <Button
                  onClick={() => handleAction("subscribe")}
                  disabled={actionLoading === "subscribe"}
                >
                  {actionLoading === "subscribe" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Subscribe Now — $40/month
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleAction("portal")}
                    disabled={actionLoading === "portal"}
                  >
                    {actionLoading === "portal" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    Billing Portal
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleAction("cancel")}
                    disabled={actionLoading === "cancel"}
                  >
                    {actionLoading === "cancel" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Cancel Subscription
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Features */}
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s Included</CardTitle>
            <CardDescription>Everything in the Seller Platform Plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PLAN_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Cancel anytime. No hidden fees. Billed monthly via Stripe.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
