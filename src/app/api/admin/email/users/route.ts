import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { ilike, or, eq, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const role = searchParams.get("role");
  const countOnly = searchParams.get("countOnly") === "true";

  const conditions = [];

  if (q) {
    conditions.push(
      or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`))
    );
  }

  if (role && role !== "all") {
    conditions.push(eq(user.role, role));
  }

  // Exclude banned users by default
  conditions.push(eq(user.banned, false));

  if (countOnly) {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return Response.json({ count: result.count });
  }

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(20);

  return Response.json({ users });
}
