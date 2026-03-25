import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user, sellerSubscription, order, product } from "@/lib/schema";
import { eq, count } from "drizzle-orm";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const sellers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.role, "seller"));

  const enriched = await Promise.all(
    sellers.map(async (s) => {
      const [sub] = await db
        .select()
        .from(sellerSubscription)
        .where(eq(sellerSubscription.sellerId, s.id));

      const [orderCount] = await db
        .select({ count: count() })
        .from(order)
        .where(eq(order.sellerId, s.id));

      const [productCount] = await db
        .select({ count: count() })
        .from(product)
        .where(eq(product.sellerId, s.id));

      return {
        ...s,
        subscriptionStatus: sub?.status ?? "inactive",
        orderCount: orderCount.count,
        productCount: productCount.count,
      };
    })
  );

  return Response.json({ sellers: enriched });
}
