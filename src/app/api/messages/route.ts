import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation, message } from "@/lib/schema";
import { eq, and, asc, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

// GET /api/messages?conversationId=X
// Returns all messages for a conversation (after marking them seen).
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const conversationId = request.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return Response.json({ error: "conversationId is required" }, { status: 400 });
  }

  const userId = session.user.id;

  // Verify the user is a participant
  const [conv] = await db
    .select()
    .from(conversation)
    .where(eq(conversation.id, conversationId));

  if (!conv || (conv.buyerId !== userId && conv.sellerId !== userId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark incoming messages as seen
  await db
    .update(message)
    .set({ status: "seen" })
    .where(
      and(
        eq(message.conversationId, conversationId),
        ne(message.senderId, userId),
        ne(message.status, "seen")
      )
    );

  const messages = await db
    .select()
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .orderBy(asc(message.createdAt));

  return Response.json({ messages });
}

// POST /api/messages
// Sends a new message. Body: { conversationId, text }
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, text } = await request.json();
  if (!conversationId || !text?.trim()) {
    return Response.json({ error: "conversationId and text are required" }, { status: 400 });
  }

  const userId = session.user.id;

  // Verify participation
  const [conv] = await db
    .select()
    .from(conversation)
    .where(eq(conversation.id, conversationId));

  if (!conv || (conv.buyerId !== userId && conv.sellerId !== userId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [created] = await db
    .insert(message)
    .values({ conversationId, senderId: userId, text: text.trim() })
    .returning();

  // Bump conversation updatedAt so it sorts to top
  await db
    .update(conversation)
    .set({ updatedAt: new Date() })
    .where(eq(conversation.id, conversationId));

  return Response.json({ message: created }, { status: 201 });
}
