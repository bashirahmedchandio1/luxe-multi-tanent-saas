import { getStripe } from "./stripe";
import { db } from "./db";
import { user } from "./schema";
import { eq } from "drizzle-orm";

export async function getOrCreateStripeCustomer(userId: string, email: string, name: string) {
  const [dbUser] = await db.select().from(user).where(eq(user.id, userId));

  if (dbUser?.stripeCustomerId) {
    return dbUser.stripeCustomerId;
  }

  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: { userId },
  });

  await db
    .update(user)
    .set({ stripeCustomerId: customer.id })
    .where(eq(user.id, userId));

  return customer.id;
}
