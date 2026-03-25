import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { order } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [found] = await db
    .select({ status: order.status, buyerId: order.buyerId })
    .from(order)
    .where(and(eq(order.id, id), eq(order.buyerId, session.user.id)));

  if (!found) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (found.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot cancel an order with status "${found.status}"` },
      { status: 400 }
    );
  }

  await db
    .update(order)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(order.id, id));

  return NextResponse.json({ success: true });
}
