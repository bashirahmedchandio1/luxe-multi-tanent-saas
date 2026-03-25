import { requireAdmin, UNAUTHORIZED } from "@/lib/admin-auth";

/**
 * Called by the admin layout on mount to verify the current user
 * is the designated admin. The ADMIN_EMAIL env var stays server-side only —
 * it never reaches the client bundle.
 */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return UNAUTHORIZED();
  return Response.json({ authorized: true });
}
