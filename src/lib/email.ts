import { Resend } from "resend";
import { db } from "./db";
import { emailLog } from "./schema";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const from = process.env.RESEND_FROM_ADDRESS ?? "onboarding@resend.dev";

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]*>/g, ""),
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function sendAndLogEmail(
  opts: SendEmailOptions & {
    templateUsed?: string;
    recipientType?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const from = process.env.RESEND_FROM_ADDRESS ?? "onboarding@resend.dev";
  try {
    await sendEmail(opts);
    await db.insert(emailLog).values({
      fromAddress: from,
      toAddress: opts.to,
      subject: opts.subject,
      body: opts.html,
      templateUsed: opts.templateUsed ?? null,
      status: "sent",
      recipientType: opts.recipientType ?? "individual",
      recipientCount: 1,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await db.insert(emailLog).values({
      fromAddress: from,
      toAddress: opts.to,
      subject: opts.subject,
      body: opts.html,
      templateUsed: opts.templateUsed ?? null,
      status: "failed",
      recipientType: opts.recipientType ?? "individual",
      recipientCount: 1,
      errorMessage: message,
    });
    return { success: false, error: message };
  }
}

const DELAY_MS = 100;

export async function sendBulkEmails(opts: {
  recipients: { email: string; name?: string }[];
  subject: string;
  html: string;
  templateUsed?: string;
  recipientType: string;
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of opts.recipients) {
    const result = await sendAndLogEmail({
      to: recipient.email,
      subject: opts.subject,
      html: opts.html,
      templateUsed: opts.templateUsed,
      recipientType: opts.recipientType,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${recipient.email}: ${result.error}`);
    }

    // Rate-limit: small delay between sends
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  return { sent, failed, errors };
}
