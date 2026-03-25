"use client";

import { useCallback, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Receipt,
  AlertCircle,
} from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// ─── Types ──────────────────────────────────────────────────────────────────

interface PaymentMethod {
  id: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface Charge {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  created: number;
  payment_method_details?: {
    card?: {
      brand: string;
      last4: string;
    };
  };
}

// ─── Add Card Form (inside Elements) ────────────────────────────────────────

function AddCardForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/buyer/dashboard/billing`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Failed to add card.");
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Save Card
        </Button>
      </div>
    </form>
  );
}

// ─── Main Billing Page ──────────────────────────────────────────────────────

export default function BillingPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchPaymentMethods = useCallback(async () => {
    const res = await fetch("/api/stripe/payment-methods");
    const data = await res.json();
    if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
  }, []);

  const fetchCharges = useCallback(async () => {
    const res = await fetch("/api/stripe/payment-history");
    const data = await res.json();
    if (data.charges) setCharges(data.charges);
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    Promise.all([fetchPaymentMethods(), fetchCharges()]).finally(() =>
      setLoading(false)
    );
  }, [session, fetchPaymentMethods, fetchCharges]);

  const handleAddCard = async () => {
    setShowAddCard(true);
    const res = await fetch("/api/stripe/setup-intent", { method: "POST" });
    const data = await res.json();
    if (data.clientSecret) setClientSecret(data.clientSecret);
  };

  const handleRemoveCard = async (paymentMethodId: string) => {
    setRemovingId(paymentMethodId);
    await fetch("/api/stripe/payment-methods", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodId }),
    });
    await fetchPaymentMethods();
    setRemovingId(null);
  };

  const handleBillingPortal = async () => {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/billing-portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setPortalLoading(false);
  };

  const onCardAdded = async () => {
    setShowAddCard(false);
    setClientSecret(null);
    await fetchPaymentMethods();
  };

  const formatCardBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "Amex",
      discover: "Discover",
      diners: "Diners",
      jcb: "JCB",
      unionpay: "UnionPay",
    };
    return brands[brand] || brand;
  };

  if (sessionPending || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Please sign in to view billing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Manage your payment methods and view transaction history.
          </p>
        </div>
        <Button variant="outline" onClick={handleBillingPortal} disabled={portalLoading}>
          {portalLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Stripe Portal
        </Button>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Your saved cards for purchases.
              </CardDescription>
            </div>
            {!showAddCard && (
              <Button size="sm" onClick={handleAddCard}>
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.length === 0 && !showAddCard && (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No payment methods saved yet.</p>
              <p className="text-sm">Add a card to get started.</p>
            </div>
          )}

          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">
                    {formatCardBrand(pm.card?.brand || "card")} ending in{" "}
                    {pm.card?.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires {pm.card?.exp_month}/{pm.card?.exp_year}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleRemoveCard(pm.id)}
                disabled={removingId === pm.id}
              >
                {removingId === pm.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}

          {showAddCard && clientSecret && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Add a new card</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddCard(false);
                    setClientSecret(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      borderRadius: "8px",
                    },
                  },
                }}
              >
                <AddCardForm onSuccess={onCardAdded} />
              </Elements>
            </div>
          )}

          {showAddCard && !clientSecret && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Your recent transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {charges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No transactions yet.</p>
              <p className="text-sm">
                Your purchase history will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {charges.map((charge) => (
                <div
                  key={charge.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <Receipt className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {charge.description || "Payment"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(charge.created * 1000).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                        {charge.payment_method_details?.card && (
                          <>
                            {" "}&middot;{" "}
                            {formatCardBrand(
                              charge.payment_method_details.card.brand
                            )}{" "}
                            {charge.payment_method_details.card.last4}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {(charge.amount / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: charge.currency,
                      })}
                    </span>
                    <Badge
                      variant={
                        charge.status === "succeeded"
                          ? "default"
                          : charge.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {charge.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
