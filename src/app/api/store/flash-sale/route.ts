import { db } from "@/lib/db";
import { platformSale, product, user } from "@/lib/schema";
import { and, eq, lte, gte } from "drizzle-orm";

/**
 * GET /api/store/flash-sale
 * Returns the first active platform sale whose window covers right now,
 * plus a list of discounted products for the carousel.
 */
export async function GET() {
  const now = new Date();

  // Find the first currently-active sale
  const [activeSale] = await db
    .select()
    .from(platformSale)
    .where(
      and(
        eq(platformSale.isActive, true),
        lte(platformSale.startDate, now),
        gte(platformSale.endDate, now)
      )
    )
    .limit(1);

  if (!activeSale) {
    return Response.json({ sale: null, products: [] });
  }

  // Fetch active products (filtered by category if the sale targets one)
  const conditions = [eq(product.status, "active") as ReturnType<typeof eq>];
  if (activeSale.targetType === "category" && activeSale.targetCategory) {
    conditions.push(eq(product.category, activeSale.targetCategory) as ReturnType<typeof eq>);
  }

  const products = await db
    .select({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      image: product.image,
      slug: product.slug,
      category: product.category,
      sellerName: user.name,
    })
    .from(product)
    .innerJoin(user, eq(product.sellerId, user.id))
    .where(and(...(conditions as [ReturnType<typeof eq>])))
    .limit(12);

  // Compute discounted prices
  const saleProducts = products.map((p) => {
    const original = p.price;
    const discounted =
      activeSale.discountType === "percentage"
        ? Math.round(original * (1 - activeSale.discountValue / 100))
        : Math.max(0, original - activeSale.discountValue);

    return {
      ...p,
      originalPrice: original,
      salePrice: discounted,
      discount:
        activeSale.discountType === "percentage"
          ? activeSale.discountValue
          : Math.round(((original - discounted) / original) * 100),
    };
  });

  return Response.json({ sale: activeSale, products: saleProducts });
}
