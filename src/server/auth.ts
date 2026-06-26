import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../infra/db/client";
import { account, session, user, verification } from "../infra/db/schema";
import { env } from "./env";

// S1 — Identity & Access. BetterAuth owns users, sessions, and credential
// handling; it persists through the shared Drizzle/SQLite database. The domain
// only ever consumes the stable BetterAuth user id as `ownerId` (see
// docs/specs/ddd/identity-access.md). Email + password is the dev-phase method;
// Google OAuth is added later as an additive `socialProviders` entry.
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  // The base URL origin is trusted implicitly; add the dev client origin so the
  // Vite SPA on :5273 can drive the auth API during development.
  trustedOrigins: env.AUTH_TRUSTED_ORIGINS,
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { user, session, account, verification },
  }),
});

export type Auth = typeof auth;
