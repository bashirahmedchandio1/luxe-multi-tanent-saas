import { db } from "@/lib/db";
import { sellerSubscription } from "@/lib/schema";
import { getStripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const subscription = event.data.object as Stripe.Subscription;

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const sellerId = subscription.metadata?.sellerId;
    if (!sellerId) return Response.json({ received: true });

    const existing = await db
      .select()
      .from(sellerSubscription)
      .where(eq(sellerSubscription.sellerId, sellerId));

    const data = {
      sellerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      status: subscription.status === "active" ? "active" : subscription.status,
      currentPeriodStart: new Date((subscription.items.data[0]?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000),
      currentPeriodEnd: new Date((subscription.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000),
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(sellerSubscription)
        .set(data)
        .where(eq(sellerSubscription.sellerId, sellerId));
    } else {
      await db.insert(sellerSubscription).values(data);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sellerId = subscription.metadata?.sellerId;
    if (sellerId) {
      await db
        .update(sellerSubscription)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(sellerSubscription.sellerId, sellerId));
    }
  }

  return Response.json({ received: true });
}
