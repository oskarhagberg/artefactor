# Bounded Context: Identity & Access

Authentication and machine credentials. **Largely delegated to [BetterAuth](https://www.better-auth.com/).**
Artefactor does not hand-roll user/session/password handling.

## Delegation boundary

- **BetterAuth owns:** user records, sessions, social-provider (OAuth) linkage, and the
  login/logout flow. It persists its own tables via the **Drizzle adapter** on the shared
  SQLite database.
- **The domain owns:** the *meaning* of an account as an artefact **Owner**. The domain
  refers to a user only by their stable BetterAuth **user id** (`ownerId`). It does not
  duplicate profile/auth data.

This keeps Identity thin: there is no rich `Account` aggregate to invariant-check beyond
"this user id exists and the request is authenticated as them."

## Authentication

Phased, both via BetterAuth:

1. **During development:** **email + password** (BetterAuth credential provider). Simplest
   to run locally with no external setup.
2. **Then add:** **Google OAuth** (BetterAuth social sign-in). Additive — both methods can
   coexist, linked to the same user.

- Sessions are issued and validated by BetterAuth and surfaced to the Hono BFF as the
  current authenticated user.
- Every BFF endpoint that mutates or reads non-public artefacts (or writes data) requires
  an authenticated session and authorizes against `ownerId` / the access matrix.

## API keys (programmatic push)

Use **BetterAuth's API-key plugin** rather than a custom credential aggregate.

- An API key belongs to exactly one Account (user id).
- A key authenticates **API push** ingestion as its owning Account — artefacts created via
  API push are owned by that Account, with identical invariants to UI uploads.
- Keys can be **issued** and **revoked**. A revoked key cannot authenticate.
- Key secrets are stored hashed (handled by the plugin); the plaintext is shown once at
  issuance.

## Invariants

1. A private artefact is readable/mutable only by a request authenticated as its `ownerId`.
2. An API key maps to exactly one Account; ingestion via that key is attributed to it.
3. A revoked key authenticates nothing.

## Open questions

- API keys: scopes/expiry beyond issue/revoke. Default: **no** scopes, revisit if needed.
- OAuth providers beyond Google (e.g. GitHub). Default: Google only at launch.
