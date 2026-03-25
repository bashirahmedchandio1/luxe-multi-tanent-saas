import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportTicket } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const tickets = await db
    .select()
    .from(supportTicket)
    .orderBy(desc(supportTicket.createdAt));

  return Response.json({ tickets });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { subject, message } = body;

  if (!subject || !message) {
    return Response.json(
      { error: "subject and message are required" },
      { status: 400 }
    );
  }

  const [ticket] = await db
    .insert(supportTicket)
    .values({
      userId: session.user.id,
      userRole: session.user.role,
      subject,
      message,
    })
    .returning();

  return Response.json({ ticket }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const body = await request.json();
  const { id, status, adminReply } = body;

  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const [updated] = await db
    .update(supportTicket)
    .set({ status, adminReply, updatedAt: new Date() })
    .where(eq(supportTicket.id, id))
    .returning();

  return Response.json({ ticket: updated });
}
