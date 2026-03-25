import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user, order, sellerSubscription, product } from "@/lib/schema";
import { eq, ne, count, sum, desc } from "drizzle-orm";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const [totalSellers] = await db
    .select({ count: count() })
    .from(user)
    .where(eq(user.role, "seller"));

  const [totalBuyers] = await db
    .select({ count: count() })
    .from(user)
    .where(eq(user.role, "buyer"));

  const [totalOrders] = await db.select({ count: count() }).from(order);

  const [totalRevenue] = await db
    .select({ total: sum(order.total) })
    .from(order)
    .where(ne(order.status, "cancelled"));

  const [activeSubscriptions] = await db
    .select({ count: count() })
    .from(sellerSubscription)
    .where(eq(sellerSubscription.status, "active"));

  const [totalProducts] = await db.select({ count: count() }).from(product);

  const recentOrders = await db
    .select()
    .from(order)
    .orderBy(desc(order.createdAt))
    .limit(5);

  return Response.json({
    totalSellers: totalSellers.count,
    totalBuyers: totalBuyers.count,
    totalOrders: totalOrders.count,
    totalRevenue: Number(totalRevenue.total ?? 0),
    activeSubscriptions: activeSubscriptions.count,
    totalProducts: totalProducts.count,
    recentOrders,
  });
}
