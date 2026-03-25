import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupon, product } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { code, productId, subtotal } = await req.json() as {
    code: string;
    productId: string;
    subtotal: number; // in cents
  };

  if (!code || !productId || !subtotal) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Get the product to find the seller
  const [prod] = await db.select({ sellerId: product.sellerId }).from(product).where(eq(product.id, productId));
  if (!prod) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Find the coupon by code (case-insensitive) belonging to this seller
  const [found] = await db
    .select()
    .from(coupon)
    .where(
      and(
        eq(coupon.code, code.toUpperCase()),
        eq(coupon.sellerId, prod.sellerId),
        eq(coupon.isActive, true)
      )
    );

  if (!found) {
    return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 });
  }

  // Check expiry
  if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
    return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
  }

  // Check minimum order value
  if (found.minOrderValue && subtotal < found.minOrderValue) {
    return NextResponse.json({
      error: `Minimum order of $${(found.minOrderValue / 100).toFixed(2)} required for this coupon`,
    }, { status: 400 });
  }

  // Calculate discount
  let discountAmount: number;
  if (found.discountType === "percentage") {
    discountAmount = Math.round((subtotal * found.discountValue) / 100);
  } else {
    discountAmount = Math.min(found.discountValue, subtotal);
  }

  const finalPrice = subtotal - discountAmount;

  return NextResponse.json({
    valid: true,
    code: found.code,
    discountType: found.discountType,
    discountValue: found.discountValue,
    discountAmount,
    finalPrice,
  });
}
