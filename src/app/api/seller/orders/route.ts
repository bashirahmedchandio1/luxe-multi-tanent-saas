import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { order } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");

  const conditions = [eq(order.sellerId, session.user.id)];
  if (status) conditions.push(eq(order.status, status));

  const orders = await db
    .select()
    .from(order)
    .where(and(...conditions))
    .orderBy(order.createdAt);

  return Response.json({ orders });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, status } = body;
  if (!id || !status) return Response.json({ error: "id and status are required" }, { status: 400 });

  const [updated] = await db
    .update(order)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(order.id, id), eq(order.sellerId, session.user.id)))
    .returning();

  return Response.json({ order: updated });
}
