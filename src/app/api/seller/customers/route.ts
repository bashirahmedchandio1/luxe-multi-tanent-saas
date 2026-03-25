import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { crmContact } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const contacts = await db
    .select()
    .from(crmContact)
    .where(eq(crmContact.sellerId, session.user.id))
    .orderBy(crmContact.createdAt);

  return Response.json({ contacts });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, email, phone, company, status, notes } = body;

  if (!name) return Response.json({ error: "name is required" }, { status: 400 });

  const [created] = await db
    .insert(crmContact)
    .values({
      sellerId: session.user.id,
      name,
      email: email ?? null,
      phone: phone ?? null,
      company: company ?? null,
      status: status ?? "lead",
      notes: notes ?? null,
    })
    .returning();

  return Response.json({ contact: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const [updated] = await db
    .update(crmContact)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(crmContact.id, id), eq(crmContact.sellerId, session.user.id)))
    .returning();

  return Response.json({ contact: updated });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  await db
    .delete(crmContact)
    .where(and(eq(crmContact.id, id), eq(crmContact.sellerId, session.user.id)));

  return Response.json({ success: true });
}
