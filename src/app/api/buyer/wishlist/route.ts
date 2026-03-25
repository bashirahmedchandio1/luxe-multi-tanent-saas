import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wishlistItem, product } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db
    .select({
      id: wishlistItem.id,
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
      category: product.category,
      slug: product.slug,
      createdAt: wishlistItem.createdAt,
    })
    .from(wishlistItem)
    .innerJoin(product, eq(wishlistItem.productId, product.id))
    .where(eq(wishlistItem.userId, session.user.id));

  return Response.json({ items, count: items.length });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await request.json();
  if (!productId) return Response.json({ error: "productId is required" }, { status: 400 });

  // Check if already wishlisted
  const existing = await db
    .select()
    .from(wishlistItem)
    .where(and(eq(wishlistItem.userId, session.user.id), eq(wishlistItem.productId, productId)))
    .limit(1);

  if (existing.length > 0) {
    // Toggle off
    await db.delete(wishlistItem).where(eq(wishlistItem.id, existing[0].id));
    return Response.json({ wishlisted: false });
  }

  await db.insert(wishlistItem).values({ userId: session.user.id, productId });
  return Response.json({ wishlisted: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  await db.delete(wishlistItem).where(and(eq(wishlistItem.id, id), eq(wishlistItem.userId, session.user.id)));
  return Response.json({ success: true });
}
