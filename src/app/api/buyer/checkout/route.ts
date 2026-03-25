import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cartItem, product, order, productVariant } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

function isOnSale(p: {
  salePrice: number | null;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
}) {
  if (!p.salePrice) return false;
  const now = Date.now();
  const start = p.saleStartDate ? p.saleStartDate.getTime() : 0;
  const end = p.saleEndDate ? p.saleEndDate.getTime() : Infinity;
  return now >= start && now <= end;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json();
  const { customerName, customerEmail, shippingAddress } = body as {
    customerName: string;
    customerEmail: string;
    shippingAddress: string;
  };

  if (!customerName || !shippingAddress) {
    return NextResponse.json({ error: "Name and shipping address are required" }, { status: 400 });
  }

  // Fetch all cart items
  const cartItems = await db.select().from(cartItem).where(eq(cartItem.userId, userId));

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Fetch all products in cart
  const productIds = [...new Set(cartItems.map((c) => c.productId))];
  const products = await db.select().from(product).where(inArray(product.id, productIds));
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  // Fetch variants for items that have variantId
  const variantIds = cartItems.map((c) => c.variantId).filter(Boolean) as string[];
  const variants =
    variantIds.length > 0
      ? await db.select().from(productVariant).where(inArray(productVariant.id, variantIds))
      : [];
  const variantMap = Object.fromEntries(variants.map((v) => [v.id, v]));

  // Build orders — one per cart item
  const orders: (typeof order.$inferInsert)[] = [];

  for (const item of cartItems) {
    const prod = productMap[item.productId];
    if (!prod) continue;

    let unitPrice: number;
    if (item.variantId && variantMap[item.variantId]) {
      unitPrice = variantMap[item.variantId].price;
    } else if (isOnSale(prod)) {
      unitPrice = prod.salePrice!;
    } else {
      unitPrice = prod.price;
    }

    orders.push({
      sellerId: prod.sellerId,
      buyerId: userId,
      productId: item.productId,
      quantity: item.quantity,
      total: unitPrice * item.quantity,
      status: "pending",
      customerName,
      customerEmail: customerEmail || session.user.email,
      shippingAddress,
    });
  }

  if (orders.length === 0) {
    return NextResponse.json({ error: "No valid items to order" }, { status: 400 });
  }

  // Insert all orders
  await db.insert(order).values(orders);

  // Clear the cart
  await db.delete(cartItem).where(eq(cartItem.userId, userId));

  return NextResponse.json({ success: true, orderCount: orders.length });
}
