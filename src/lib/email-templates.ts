const PLATFORM_NAME = "Luxe";

export interface EmailTemplate {
  key: string;
  name: string;
  description: string;
  defaultSubject: string;
  variables: string[];
  generateHtml: (vars: Record<string, string>) => string;
}

function replaceVars(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (str, [key, value]) => str.replaceAll(`{{${key}}}`, value ?? ""),
    template
  );
}

function wrapInLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#18181b;padding:24px 32px;">
    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${PLATFORM_NAME}</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    ${content}
  </td></tr>
  <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;">
    <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">&copy; ${new Date().getFullYear()} ${PLATFORM_NAME}. All rights reserved.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    key: "welcome",
    name: "Welcome Email",
    description: "Sent to new users after registration",
    defaultSubject: `Welcome to ${PLATFORM_NAME}!`,
    variables: ["userName"],
    generateHtml: (vars) =>
      wrapInLayout(
        replaceVars(
          `<h2 style="margin:0 0 16px;color:#18181b;font-size:22px;">Welcome, {{userName}}!</h2>
<p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
  We're thrilled to have you on ${PLATFORM_NAME}. Your account is set up and ready to go.
</p>
<p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.6;">
  Browse our curated marketplace, discover unique products, and enjoy a seamless shopping experience.
</p>
<a href="#" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Start Shopping</a>`,
          vars
        )
      ),
  },
  {
    key: "order_confirmation",
    name: "Order Confirmation",
    description: "Sent when a buyer places an order",
    defaultSubject: `Order Confirmed — #{{orderId}}`,
    variables: ["userName", "orderId", "orderTotal"],
    generateHtml: (vars) =>
      wrapInLayout(
        replaceVars(
          `<h2 style="margin:0 0 16px;color:#18181b;font-size:22px;">Order Confirmed</h2>
<p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
  Hi {{userName}}, your order <strong>#{{orderId}}</strong> has been placed successfully.
</p>
<table width="100%" style="margin:0 0 24px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr style="background:#fafafa;">
    <td style="padding:12px 16px;font-size:13px;color:#71717a;font-weight:500;">Order ID</td>
    <td style="padding:12px 16px;font-size:13px;color:#18181b;text-align:right;">{{orderId}}</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:#71717a;font-weight:500;border-top:1px solid #e4e4e7;">Total</td>
    <td style="padding:12px 16px;font-size:13px;color:#18181b;text-align:right;border-top:1px solid #e4e4e7;">{{orderTotal}}</td>
  </tr>
</table>
<p style="margin:0;color:#3f3f46;font-size:15px;line-height:1.6;">
  You'll receive a shipping confirmation once your order is on its way.
</p>`,
          vars
        )
      ),
  },
  {
    key: "promotion",
    name: "Platform Promotion",
    description: "Announce sales, discounts, or special events",
    defaultSubject: `{{title}}`,
    variables: ["title", "description", "ctaText", "ctaUrl"],
    generateHtml: (vars) =>
      wrapInLayout(
        replaceVars(
          `<h2 style="margin:0 0 16px;color:#18181b;font-size:22px;">{{title}}</h2>
<p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.6;">{{description}}</p>
<a href="{{ctaUrl}}" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">{{ctaText}}</a>`,
          vars
        )
      ),
  },
  {
    key: "account_warning",
    name: "Account Warning",
    description: "Warn users about policy violations or account issues",
    defaultSubject: `Important: Action Required on Your ${PLATFORM_NAME} Account`,
    variables: ["userName", "reason"],
    generateHtml: (vars) =>
      wrapInLayout(
        replaceVars(
          `<h2 style="margin:0 0 16px;color:#dc2626;font-size:22px;">Account Notice</h2>
<p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
  Hi {{userName}}, we're reaching out regarding your ${PLATFORM_NAME} account.
</p>
<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px;margin:0 0 24px;">
  <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.5;"><strong>Reason:</strong> {{reason}}</p>
</div>
<p style="margin:0;color:#3f3f46;font-size:15px;line-height:1.6;">
  Please review our community guidelines. If you believe this was a mistake, reply to this email or contact our support team.
</p>`,
          vars
        )
      ),
  },
  {
    key: "seller_approval",
    name: "Seller Approval",
    description: "Notify a seller that their account has been approved",
    defaultSubject: `Your Seller Account on ${PLATFORM_NAME} is Approved!`,
    variables: ["userName", "storeName"],
    generateHtml: (vars) =>
      wrapInLayout(
        replaceVars(
          `<h2 style="margin:0 0 16px;color:#16a34a;font-size:22px;">You're Approved!</h2>
<p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
  Congratulations {{userName}}! Your seller account <strong>{{storeName}}</strong> has been approved on ${PLATFORM_NAME}.
</p>
<p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.6;">
  You can now start listing products and reaching customers on our marketplace.
</p>
<a href="#" style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Go to Seller Dashboard</a>`,
          vars
        )
      ),
  },
];

export function getTemplate(key: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.key === key);
}

export function renderTemplate(
  key: string,
  vars: Record<string, string>
): { subject: string; html: string } | null {
  const template = getTemplate(key);
  if (!template) return null;
  return {
    subject: replaceVars(template.defaultSubject, vars),
    html: template.generateHtml(vars),
  };
}
