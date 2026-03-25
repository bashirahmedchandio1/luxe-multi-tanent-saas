import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { role } = body;

  if (role !== "buyer" && role !== "seller") {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  await db
    .update(user)
    .set({ role })
    .where(eq(user.id, session.user.id));

  return Response.json({ success: true });
}
