import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";
import { slugify } from "@/lib/utils";
import { headers } from "next/headers";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerId = await getOrCreateStripeCustomer(
    session.user.id,
    session.user.email,
    session.user.name
  );

  const slug = slugify(session.user.name);

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.BETTER_AUTH_URL}/buyer/${slug}/dashboard/billing`,
  });

  return Response.json({ url: portalSession.url });
}
