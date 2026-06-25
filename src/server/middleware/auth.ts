import { createMiddleware } from "hono/factory";
import { auth } from "../auth";

// The authenticated identity, as surfaced by BetterAuth's session lookup. The
// domain only cares about `user.id` — that is the stable `ownerId` (IA spec).
export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;

// Hono context bindings added by `attachSession`. `user` is null when the
// request carries no valid session.
export type AuthEnv = {
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
};

// Resolve the BetterAuth session for the request and expose it to downstream
// handlers. Runs on every BFF route except the BetterAuth handler itself.
export const attachSession = createMiddleware<AuthEnv>(async (c, next) => {
  const data = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", data?.user ?? null);
  c.set("session", data?.session ?? null);
  await next();
});

// Guard for protected endpoints: rejects unauthenticated requests with 401.
// Encodes IA invariant 1 — non-public access requires an authenticated session.
// Must run after `attachSession`.
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  if (!c.get("user")) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
});

// The owning user id for the current request. Call only behind `requireAuth`.
export function ownerId(c: { get: (k: "user") => AuthUser | null }): string {
  const user = c.get("user");
  if (!user) {
    throw new Error("ownerId() called without an authenticated session");
  }
  return user.id;
}
