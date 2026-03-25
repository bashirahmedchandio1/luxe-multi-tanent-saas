import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user, order } from "@/lib/schema";
import { eq, count } from "drizzle-orm";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const buyers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.role, "buyer"));

  const enriched = await Promise.all(
    buyers.map(async (b) => {
      const [orderCount] = await db
        .select({ count: count() })
        .from(order)
        .where(eq(order.buyerId, b.id));

      return {
        ...b,
        orderCount: orderCount.count,
      };
    })
  );

  return Response.json({ buyers: enriched });
}
