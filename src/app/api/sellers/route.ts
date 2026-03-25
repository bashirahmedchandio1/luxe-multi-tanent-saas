import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/sellers
// Returns all users with role "seller" for buyers to start conversations with.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sellers = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.role, "seller"));

  return Response.json({
    sellers: sellers.filter((s) => s.id !== session.user.id),
  });
}
