import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sellerSubscription } from "@/lib/schema";
import { getStripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";
import { slugify } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [sub] = await db
    .select()
    .from(sellerSubscription)
    .where(eq(sellerSubscription.sellerId, session.user.id));

  return Response.json({ subscription: sub ?? null });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await request.json();
  const stripe = getStripe();
  const slug = slugify(session.user.name);

  if (action === "subscribe") {
    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email,
      session.user.name
    );

    const price = await stripe.prices.create({
      unit_amount: 4000,
      currency: "usd",
      recurring: { interval: "month" },
      product_data: { name: "Seller Platform Plan" },
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/${slug}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/${slug}/dashboard/billing`,
      metadata: { sellerId: session.user.id },
    });

    return Response.json({ url: checkoutSession.url });
  }

  if (action === "cancel") {
    const [sub] = await db
      .select()
      .from(sellerSubscription)
      .where(eq(sellerSubscription.sellerId, session.user.id));

    if (!sub?.stripeSubscriptionId) {
      return Response.json({ error: "No active subscription" }, { status: 400 });
    }

    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);

    await db
      .update(sellerSubscription)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(sellerSubscription.sellerId, session.user.id));

    return Response.json({ success: true });
  }

  if (action === "portal") {
    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email,
      session.user.name
    );

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/${slug}/dashboard/billing`,
    });

    return Response.json({ url: portalSession.url });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
