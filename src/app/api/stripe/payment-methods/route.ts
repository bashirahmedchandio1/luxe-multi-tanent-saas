import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerId = await getOrCreateStripeCustomer(
    session.user.id,
    session.user.email,
    session.user.name
  );

  const paymentMethods = await getStripe().paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  return Response.json({ paymentMethods: paymentMethods.data });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paymentMethodId } = await request.json();
  if (!paymentMethodId) {
    return Response.json({ error: "Missing paymentMethodId" }, { status: 400 });
  }

  await getStripe().paymentMethods.detach(paymentMethodId);

  return Response.json({ success: true });
}
