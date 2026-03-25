import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Server-side admin guard.
 * Returns the session if the request comes from the designated admin email
 * (ADMIN_EMAIL env var) AND the user has the "admin" role.
 * Returns null otherwise.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) return null;

  const adminEmail = process.env.ADMIN_EMAIL;
  const isAuthorized =
    session.user.role === "admin" &&
    adminEmail &&
    session.user.email === adminEmail;

  return isAuthorized ? session : null;
}

/**
 * Standard JSON responses for failed admin checks.
 */
export const UNAUTHORIZED = () =>
  Response.json({ error: "Unauthorized" }, { status: 401 });

export const FORBIDDEN = () =>
  Response.json({ error: "Forbidden" }, { status: 403 });
