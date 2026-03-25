import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailLog)
    .where(
      and(eq(emailLog.status, "sent"), gte(emailLog.sentAt, firstOfMonth))
    );

  const monthlyCount = result.count;
  const limit = 3000;

  return Response.json({
    monthlyCount,
    limit,
    remaining: Math.max(0, limit - monthlyCount),
  });
}
