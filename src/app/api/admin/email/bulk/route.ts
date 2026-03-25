import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { sendBulkEmails } from "@/lib/email";
import { renderTemplate } from "@/lib/email-templates";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();

  const body = await request.json();
  const { recipientType, subject, html, templateKey, templateVars } = body;

  if (!recipientType) {
    return Response.json(
      { error: "recipientType is required (buyers | sellers | all)" },
      { status: 400 }
    );
  }

  // Resolve email content from template or raw html
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

  if (!finalSubject || !finalHtml) {
    return Response.json(
      { error: "subject and html (or a valid templateKey) are required" },
      { status: 400 }
    );
  }

  // Fetch recipients
  const conditions = [eq(user.banned, false)];
  if (recipientType === "buyers") {
    conditions.push(eq(user.role, "buyer"));
  } else if (recipientType === "sellers") {
    conditions.push(eq(user.role, "seller"));
  }
  // "all" sends to everyone (buyers + sellers, excluding admins and banned)

  const recipients = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(and(...conditions));

  if (recipients.length === 0) {
    return Response.json({ error: "No recipients found" }, { status: 404 });
  }

  const result = await sendBulkEmails({
    recipients,
    subject: finalSubject,
    html: finalHtml,
    templateUsed: templateKey,
    recipientType,
  });

  return Response.json(result);
}
