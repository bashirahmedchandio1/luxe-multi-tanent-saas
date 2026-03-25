import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { order, product, user } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await db
    .select({
      id: order.id,
      quantity: order.quantity,
      total: order.total,
      status: order.status,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      productId: order.productId,
      productName: product.name,
      productImage: product.image,
      productImages: product.images,
      sellerName: user.name,
    })
    .from(order)
    .leftJoin(product, eq(order.productId, product.id))
    .leftJoin(user, eq(order.sellerId, user.id))
    .where(eq(order.buyerId, session.user.id))
    .orderBy(desc(order.createdAt));

  return NextResponse.json({ orders });
}
