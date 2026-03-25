import { db } from "@/lib/db";
import { product, user } from "@/lib/schema";
import { eq, and, desc, asc, ilike } from "drizzle-orm";
import { NextRequest } from "next/server";

// GET /api/store/products?category=&search=&sort=newest&page=1
// Public — no auth required. Returns only active products.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const search = searchParams.get("search")?.trim();
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 24;
  const offset = (page - 1) * limit;

  type SQL = Parameters<typeof and>[0];
  const conditions: SQL[] = [eq(product.status, "active")];

  if (category) conditions.push(eq(product.category, category));
  if (search) conditions.push(ilike(product.name, `%${search}%`));

  const orderBy =
    sort === "price-asc"
      ? asc(product.price)
      : sort === "price-desc"
      ? desc(product.price)
      : sort === "name-asc"
      ? asc(product.name)
      : desc(product.createdAt); // default: newest

  const products = await db
    .select({
      id: product.id,
      name: product.name,
      brand: product.brand,
      images: product.images,
      image: product.image,
      price: product.price,
      salePrice: product.salePrice,
      saleStartDate: product.saleStartDate,
      saleEndDate: product.saleEndDate,
      category: product.category,
      subcategory: product.subcategory,
      status: product.status,
      slug: product.slug,
      stock: product.stock,
      sellerId: product.sellerId,
      sellerName: user.name,
      createdAt: product.createdAt,
    })
    .from(product)
    .innerJoin(user, eq(product.sellerId, user.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return Response.json({ products, page, limit });
}
