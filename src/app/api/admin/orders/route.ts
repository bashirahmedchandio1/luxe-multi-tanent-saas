import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { order } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");

  const orders = await db
    .select()
    .from(order)
    .where(status ? eq(order.status, status) : undefined)
    .orderBy(desc(order.createdAt));

  return Response.json({ orders });
}
