import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { kanbanBoard, kanbanColumn, kanbanCard } from "@/lib/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { headers } from "next/headers";

const DEFAULT_COLUMNS = [
  { name: "To Do", color: "#6366f1", position: 0 },
  { name: "In Progress", color: "#f59e0b", position: 1 },
  { name: "Review", color: "#8b5cf6", position: 2 },
  { name: "Done", color: "#10b981", position: 3 },
];

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let [board] = await db
    .select()
    .from(kanbanBoard)
    .where(eq(kanbanBoard.sellerId, session.user.id))
    .limit(1);

  if (!board) {
    [board] = await db
      .insert(kanbanBoard)
      .values({ sellerId: session.user.id, name: "My Board" })
      .returning();

    for (const col of DEFAULT_COLUMNS) {
      await db.insert(kanbanColumn).values({ boardId: board.id, ...col });
    }
  }

  const columns = await db
    .select()
    .from(kanbanColumn)
    .where(eq(kanbanColumn.boardId, board.id))
    .orderBy(asc(kanbanColumn.position));

  const columnIds = columns.map((c) => c.id);
  const cards =
    columnIds.length > 0
      ? await db
          .select()
          .from(kanbanCard)
          .where(inArray(kanbanCard.columnId, columnIds))
          .orderBy(asc(kanbanCard.position))
      : [];

  const columnsWithCards = columns.map((col) => ({
    ...col,
    cards: cards.filter((c) => c.columnId === col.id),
  }));

  return Response.json({ board: { ...board, columns: columnsWithCards } });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.type === "column") {
    const { boardId, name, color } = body;
    const cols = await db
      .select()
      .from(kanbanColumn)
      .where(eq(kanbanColumn.boardId, boardId));

    const [created] = await db
      .insert(kanbanColumn)
      .values({ boardId, name, color: color ?? "#6366f1", position: cols.length })
      .returning();

    return Response.json({ column: created }, { status: 201 });
  }

  // type === "card"
  const { columnId, title, description, priority, dueDate } = body;
  if (!columnId || !title) {
    return Response.json({ error: "columnId and title are required" }, { status: 400 });
  }

  const existingCards = await db
    .select()
    .from(kanbanCard)
    .where(eq(kanbanCard.columnId, columnId));

  const [created] = await db
    .insert(kanbanCard)
    .values({
      columnId,
      title,
      description: description ?? null,
      priority: priority ?? "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      position: existingCards.length,
    })
    .returning();

  return Response.json({ card: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, id, ...updates } = body;

  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  if (type === "card") {
    const [updated] = await db
      .update(kanbanCard)
      .set(updates)
      .where(eq(kanbanCard.id, id))
      .returning();
    return Response.json({ card: updated });
  }

  if (type === "column") {
    const [updated] = await db
      .update(kanbanColumn)
      .set(updates)
      .where(eq(kanbanColumn.id, id))
      .returning();
    return Response.json({ column: updated });
  }

  return Response.json({ error: "Unknown type" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, id } = body;

  if (type === "card") {
    await db.delete(kanbanCard).where(eq(kanbanCard.id, id));
    return Response.json({ success: true });
  }

  if (type === "column") {
    // Delete all cards in the column first
    await db.delete(kanbanCard).where(eq(kanbanCard.columnId, id));
    await db.delete(kanbanColumn).where(eq(kanbanColumn.id, id));
    return Response.json({ success: true });
  }

  return Response.json({ error: "Unknown type" }, { status: 400 });
}
