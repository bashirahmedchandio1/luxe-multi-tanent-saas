import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cartItem, product, productVariant } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db
    .select({
      id: cartItem.id,
      quantity: cartItem.quantity,
      variantId: cartItem.variantId,
      productId: product.id,
      name: product.name,
      images: product.images,
      image: product.image,
      price: product.price,
      salePrice: product.salePrice,
      saleStartDate: product.saleStartDate,
      saleEndDate: product.saleEndDate,
      stock: product.stock,
      status: product.status,
      slug: product.slug,
      sellerId: product.sellerId,
    })
    .from(cartItem)
    .innerJoin(product, eq(cartItem.productId, product.id))
    .where(eq(cartItem.userId, session.user.id));

  // Attach variant info if present
  const enriched = await Promise.all(
    items.map(async (item) => {
      if (!item.variantId) return { ...item, variantOptions: null };
      const [variant] = await db
        .select({ options: productVariant.options, price: productVariant.price, stock: productVariant.stock })
        .from(productVariant)
        .where(eq(productVariant.id, item.variantId));
      return { ...item, variantOptions: variant?.options ?? null, variantPrice: variant?.price ?? null };
    })
  );

  return Response.json({ items: enriched, count: enriched.length });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, variantId, quantity = 1 } = await request.json();
  if (!productId) return Response.json({ error: "productId is required" }, { status: 400 });

  // Check if item already exists in cart
  const existing = await db
    .select()
    .from(cartItem)
    .where(
      and(
        eq(cartItem.userId, session.user.id),
        eq(cartItem.productId, productId),
        variantId ? eq(cartItem.variantId, variantId) : eq(cartItem.variantId, "")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update quantity
    const [updated] = await db
      .update(cartItem)
      .set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItem.id, existing[0].id))
      .returning();
    return Response.json({ item: updated });
  }

  const [created] = await db
    .insert(cartItem)
    .values({
      userId: session.user.id,
      productId,
      variantId: variantId ?? null,
      quantity,
    })
    .returning();

  return Response.json({ item: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, quantity } = await request.json();
  if (!id || quantity === undefined) return Response.json({ error: "id and quantity required" }, { status: 400 });

  if (quantity <= 0) {
    await db.delete(cartItem).where(and(eq(cartItem.id, id), eq(cartItem.userId, session.user.id)));
    return Response.json({ success: true });
  }

  const [updated] = await db
    .update(cartItem)
    .set({ quantity })
    .where(and(eq(cartItem.id, id), eq(cartItem.userId, session.user.id)))
    .returning();

  return Response.json({ item: updated });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  await db.delete(cartItem).where(and(eq(cartItem.id, id), eq(cartItem.userId, session.user.id)));
  return Response.json({ success: true });
}
