import Stripe from "stripe";

let stripeInstance: Stripe | undefined;

export function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeInstance ??= new Stripe(apiKey, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });

  return stripeInstance;
}
