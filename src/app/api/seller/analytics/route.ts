import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { product, order, crmContact } from "@/lib/schema";
import { eq, ne, and, sum, count, desc } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sellerId = session.user.id;

  const [productCount] = await db
    .select({ count: count() })
    .from(product)
    .where(eq(product.sellerId, sellerId));

  const [totalRevenue] = await db
    .select({ total: sum(order.total) })
    .from(order)
    .where(and(eq(order.sellerId, sellerId), ne(order.status, "cancelled")));

  const [customerCount] = await db
    .select({ count: count() })
    .from(crmContact)
    .where(eq(crmContact.sellerId, sellerId));

  const allOrders = await db
    .select()
    .from(order)
    .where(eq(order.sellerId, sellerId));

  const statusCounts = allOrders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const recentOrders = await db
    .select()
    .from(order)
    .where(eq(order.sellerId, sellerId))
    .orderBy(desc(order.createdAt))
    .limit(5);

  return Response.json({
    totalProducts: productCount?.count ?? 0,
    totalRevenue: Number(totalRevenue?.total ?? 0),
    totalOrders: allOrders.length,
    totalCustomers: customerCount?.count ?? 0,
    statusCounts,
    recentOrders,
  });
}
