import { db } from "@/lib/db";
import { productReview, user, product } from "@/lib/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

// GET /api/store/products/[id]/reviews
// Returns reviews list + aggregate stats for a product.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Resolve by UUID or slug
  const [found] = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.id, id))
    .limit(1);

  const productId = found?.id ?? id;

  const reviews = await db
    .select({
      id: productReview.id,
      rating: productReview.rating,
      title: productReview.title,
      body: productReview.body,
      createdAt: productReview.createdAt,
      userName: user.name,
      userId: productReview.userId,
    })
    .from(productReview)
    .innerJoin(user, eq(productReview.userId, user.id))
    .where(eq(productReview.productId, productId))
    .orderBy(desc(productReview.createdAt));

  const [stats] = await db
    .select({
      total: count(productReview.id),
      average: avg(productReview.rating),
    })
    .from(productReview)
    .where(eq(productReview.productId, productId));

  // Distribution: count per star value (1–5)
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    const s = Math.min(5, Math.max(1, r.rating));
    distribution[s] = (distribution[s] ?? 0) + 1;
  });

  return Response.json({
    reviews,
    stats: {
      total: Number(stats?.total ?? 0),
      average: stats?.average ? parseFloat(Number(stats.average).toFixed(1)) : 0,
      distribution,
    },
  });
}

// POST /api/store/products/[id]/reviews
// Authenticated users submit a review. One per user per product.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rating = Number(body.rating);
  if (!rating || rating < 1 || rating > 5) {
    return Response.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  // Resolve product
  const [found] = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.id, id))
    .limit(1);

  if (!found) return Response.json({ error: "Product not found" }, { status: 404 });

  // One review per user per product
  const [existing] = await db
    .select({ id: productReview.id })
    .from(productReview)
    .where(
      and(
        eq(productReview.productId, found.id),
        eq(productReview.userId, session.user.id)
      )
    )
    .limit(1);

  if (existing) {
    return Response.json({ error: "You have already reviewed this product" }, { status: 409 });
  }

  const [review] = await db
    .insert(productReview)
    .values({
      productId: found.id,
      userId: session.user.id,
      rating: Math.round(rating),
      title: body.title?.trim() || null,
      body: body.body?.trim() || null,
    })
    .returning();

  return Response.json({ review }, { status: 201 });
}
