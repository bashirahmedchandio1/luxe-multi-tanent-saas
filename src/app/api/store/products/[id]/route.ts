import { db } from "@/lib/db";
import { product, productVariant, user } from "@/lib/schema";
import { eq, and, ne, or, desc } from "drizzle-orm";

// GET /api/store/products/[id]
// Public — resolves by UUID or slug. Returns product, variants, seller, recommendations.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [found] = await db
    .select()
    .from(product)
    .where(
      and(
        eq(product.status, "active"),
        or(eq(product.id, id), eq(product.slug, id))
      )
    )
    .limit(1);

  if (!found) return Response.json({ error: "Not found" }, { status: 404 });

  // Seller info
  const [seller] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.id, found.sellerId));

  // Variants
  const variants = await db
    .select()
    .from(productVariant)
    .where(eq(productVariant.productId, found.id));

  // Recommendations — same category (or same seller as fallback), limit 8
  const recommendations = await db
    .select({
      id: product.id,
      name: product.name,
      images: product.images,
      image: product.image,
      price: product.price,
      salePrice: product.salePrice,
      saleStartDate: product.saleStartDate,
      saleEndDate: product.saleEndDate,
      category: product.category,
      slug: product.slug,
      sellerName: user.name,
    })
    .from(product)
    .innerJoin(user, eq(product.sellerId, user.id))
    .where(
      and(
        eq(product.status, "active"),
        ne(product.id, found.id),
        found.category
          ? eq(product.category, found.category)
          : eq(product.sellerId, found.sellerId)
      )
    )
    .orderBy(desc(product.createdAt))
    .limit(8);

  return Response.json({ product: found, variants, seller, recommendations });
}
