import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { platformSale } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const sales = await db
    .select()
    .from(platformSale)
    .orderBy(desc(platformSale.createdAt));

  return Response.json({ sales });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const body = await request.json();
  const { name, discountType, discountValue, startDate, endDate, isActive, targetType, targetCategory } = body;

  if (!name || !discountType || discountValue == null || !startDate || !endDate) {
    return Response.json({ error: "name, discountType, discountValue, startDate, and endDate are required" }, { status: 400 });
  }

  const [sale] = await db
    .insert(platformSale)
    .values({
      name,
      discountType,
      discountValue: Number(discountValue),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive ?? true,
      targetType: targetType ?? "all",
      targetCategory: targetCategory ?? null,
    })
    .returning();

  return Response.json({ sale }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  // Coerce date strings to Date objects if present
  if (updates.startDate) updates.startDate = new Date(updates.startDate);
  if (updates.endDate) updates.endDate = new Date(updates.endDate);
  if (updates.discountValue != null) updates.discountValue = Number(updates.discountValue);

  const [updated] = await db
    .update(platformSale)
    .set(updates)
    .where(eq(platformSale.id, id))
    .returning();

  return Response.json({ sale: updated });
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const { id } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  await db.delete(platformSale).where(eq(platformSale.id, id));
  return Response.json({ success: true });
}
