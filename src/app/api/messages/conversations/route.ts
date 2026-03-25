import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation, message, user } from "@/lib/schema";
import { eq, or, desc, and, count, ne } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/messages/conversations
// Returns all conversations for the current user, enriched with
// the other party's profile, last message, and unread count.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const conversations = await db
    .select()
    .from(conversation)
    .where(or(eq(conversation.buyerId, userId), eq(conversation.sellerId, userId)))
    .orderBy(desc(conversation.updatedAt));

  if (!conversations.length) return Response.json({ conversations: [] });

  // Enrich each conversation
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const otherUserId =
        conv.buyerId === userId ? conv.sellerId : conv.buyerId;

      const [otherUser] = await db
        .select({ id: user.id, name: user.name, email: user.email, role: user.role })
        .from(user)
        .where(eq(user.id, otherUserId));

      const [lastMsg] = await db
        .select()
        .from(message)
        .where(eq(message.conversationId, conv.id))
        .orderBy(desc(message.createdAt))
        .limit(1);

      const [{ unread }] = await db
        .select({ unread: count() })
        .from(message)
        .where(
          and(
            eq(message.conversationId, conv.id),
            ne(message.senderId, userId),
            ne(message.status, "seen")
          )
        );

      return {
        ...conv,
        otherUser: otherUser ?? null,
        lastMessage: lastMsg ?? null,
        unreadCount: Number(unread),
        myRole: conv.buyerId === userId ? "buyer" : "seller",
      };
    })
  );

  return Response.json({ conversations: enriched });
}

// POST /api/messages/conversations
// Creates a new conversation or returns existing one.
// Body: { sellerId } (called by buyer) or { buyerId } (called by seller)
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const userId = session.user.id;
  const role = (session.user as { role?: string }).role ?? "buyer";

  let buyerId: string;
  let sellerId: string;

  if (role === "buyer") {
    buyerId = userId;
    sellerId = body.sellerId;
  } else {
    sellerId = userId;
    buyerId = body.buyerId;
  }

  if (!buyerId || !sellerId) {
    return Response.json({ error: "buyerId and sellerId are required" }, { status: 400 });
  }

  // Check if conversation already exists
  const [existing] = await db
    .select()
    .from(conversation)
    .where(
      and(eq(conversation.buyerId, buyerId), eq(conversation.sellerId, sellerId))
    );

  if (existing) return Response.json({ conversation: existing });

  const [created] = await db
    .insert(conversation)
    .values({ buyerId, sellerId, subject: body.subject ?? null })
    .returning();

  return Response.json({ conversation: created }, { status: 201 });
}
