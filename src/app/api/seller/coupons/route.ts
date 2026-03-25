import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { coupon } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const coupons = await db
    .select()
    .from(coupon)
    .where(eq(coupon.sellerId, session.user.id))
    .orderBy(coupon.createdAt);

  return Response.json({ coupons });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { code, discountType, discountValue, expiryDate, minOrderValue } =
    await request.json();

  if (!code || discountValue === undefined) {
    return Response.json({ error: "code and discountValue are required" }, { status: 400 });
  }

  const [created] = await db
    .insert(coupon)
    .values({
      sellerId: session.user.id,
      code: code.trim().toUpperCase(),
      discountType: discountType ?? "percentage",
      discountValue: Math.round(discountValue),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      minOrderValue: minOrderValue ? Math.round(minOrderValue * 100) : 0,
    })
    .returning();

  return Response.json({ coupon: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const payload: Record<string, unknown> = {};
  if (updates.code !== undefined) payload.code = updates.code.trim().toUpperCase();
  if (updates.discountType !== undefined) payload.discountType = updates.discountType;
  if (updates.discountValue !== undefined) payload.discountValue = Math.round(updates.discountValue);
  if (updates.expiryDate !== undefined) payload.expiryDate = updates.expiryDate ? new Date(updates.expiryDate) : null;
  if (updates.minOrderValue !== undefined) payload.minOrderValue = Math.round(updates.minOrderValue * 100);
  if (updates.isActive !== undefined) payload.isActive = updates.isActive;

  const [updated] = await db
    .update(coupon)
    .set(payload)
    .where(and(eq(coupon.id, id), eq(coupon.sellerId, session.user.id)))
    .returning();

  return Response.json({ coupon: updated });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  await db
    .delete(coupon)
    .where(and(eq(coupon.id, id), eq(coupon.sellerId, session.user.id)));

  return Response.json({ success: true });
}
