import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { product, productVariant } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const products = await db
    .select()
    .from(product)
    .where(eq(product.sellerId, session.user.id))
    .orderBy(product.createdAt);

  return Response.json({ products });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    name, description, brand, sku, tags, images,
    price, salePrice, saleStartDate, saleEndDate, costPrice,
    stock, lowStockThreshold, category, subcategory, status,
    weight, dimensions, shippingClass, deliveryEstimate,
    metaTitle, metaDescription, slug, publishDate,
    variants = [],
  } = body;

  if (!name || price === undefined) {
    return Response.json({ error: "name and price are required" }, { status: 400 });
  }

  const imagesList: string[] = Array.isArray(images) ? images : [];

  const [created] = await db
    .insert(product)
    .values({
      sellerId: session.user.id,
      name,
      description: description || null,
      brand: brand || null,
      sku: sku || null,
      tags: tags?.length ? JSON.stringify(tags) : null,
      images: imagesList.length ? JSON.stringify(imagesList) : null,
      image: imagesList[0] ?? null,
      price: Math.round(price),
      salePrice: salePrice ? Math.round(salePrice) : null,
      saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
      saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
      costPrice: costPrice ? Math.round(costPrice) : null,
      stock: stock ?? 0,
      lowStockThreshold: lowStockThreshold ?? 5,
      category: category || null,
      subcategory: subcategory || null,
      status: status ?? "draft",
      weight: weight || null,
      dimensions: dimensions || null,
      shippingClass: shippingClass || null,
      deliveryEstimate: deliveryEstimate || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      slug: slug || null,
      publishDate: publishDate ? new Date(publishDate) : null,
    })
    .returning();

  // Insert variants
  if (variants.length > 0) {
    await db.insert(productVariant).values(
      variants.map((v: { options: Record<string, string>; sku?: string; price: number; stock: number; image?: string }) => ({
        productId: created.id,
        options: JSON.stringify(v.options),
        sku: v.sku || null,
        price: Math.round(v.price || 0),
        stock: v.stock ?? 0,
        image: v.image || null,
      }))
    );
  }

  return Response.json({ product: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, variants, ...rest } = body;
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  // Prepare update payload
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const fieldMap: Record<string, string> = {
    saleStartDate: "saleStartDate",
    saleEndDate: "saleEndDate",
    publishDate: "publishDate",
  };

  for (const [key, val] of Object.entries(rest)) {
    if (key === "tags" || key === "images") {
      updates[key] = Array.isArray(val) && val.length > 0 ? JSON.stringify(val) : null;
    } else if (fieldMap[key]) {
      updates[key] = val ? new Date(val as string) : null;
    } else if (key === "price" || key === "salePrice" || key === "costPrice") {
      updates[key] = val !== undefined && val !== "" ? Math.round(Number(val)) : null;
    } else {
      updates[key] = val === "" ? null : val;
    }
  }

  // Keep image in sync with first of images[]
  if (Array.isArray(rest.images)) {
    updates.image = rest.images[0] ?? null;
  }

  const [updated] = await db
    .update(product)
    .set(updates)
    .where(and(eq(product.id, id), eq(product.sellerId, session.user.id)))
    .returning();

  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });

  // Replace variants atomically
  if (variants !== undefined) {
    await db.delete(productVariant).where(eq(productVariant.productId, id));
    if (Array.isArray(variants) && variants.length > 0) {
      await db.insert(productVariant).values(
        variants.map((v: { options: Record<string, string>; sku?: string; price: number; stock: number; image?: string }) => ({
          productId: id,
          options: JSON.stringify(v.options),
          sku: v.sku || null,
          price: Math.round(v.price || 0),
          stock: v.stock ?? 0,
          image: v.image || null,
        }))
      );
    }
  }

  return Response.json({ product: updated });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  await db
    .delete(product)
    .where(and(eq(product.id, id), eq(product.sellerId, session.user.id)));

  return Response.json({ success: true });
}
