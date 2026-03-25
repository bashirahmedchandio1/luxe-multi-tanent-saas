import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { sendAndLogEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/email-templates";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/schema";
import { desc, eq, sql, and } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const status = searchParams.get("status");
  const offset = (page - 1) * limit;

  const conditions = status ? eq(emailLog.status, status) : undefined;

  const [logs, [countResult]] = await Promise.all([
    db
      .select()
      .from(emailLog)
      .where(conditions)
      .orderBy(desc(emailLog.sentAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailLog)
      .where(conditions),
  ]);

  return Response.json({
    logs,
    total: countResult.count,
    page,
    totalPages: Math.ceil(countResult.count / limit),
  });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const body = await request.json();
  const { to, subject, html, templateKey, templateVars } = body;

  // Resolve content from template or raw values
  let finalSubject = subject;
  let finalHtml = html;

  if (templateKey) {
    const rendered = renderTemplate(templateKey, templateVars ?? {});
    if (!rendered) {
      return Response.json({ error: "Invalid template key" }, { status: 400 });
    }
    finalSubject = finalSubject || rendered.subject;
    finalHtml = finalHtml || rendered.html;
  }

  if (!to || !finalSubject || !finalHtml) {
    return Response.json(
      { error: "to, subject, and html (or a valid templateKey) are required" },
      { status: 400 }
    );
  }

  const result = await sendAndLogEmail({
    to,
    subject: finalSubject,
    html: finalHtml,
    templateUsed: templateKey,
  });

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json({ success: true });
}
