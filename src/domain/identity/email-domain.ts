// Identity & Access (IA) — the account email-domain allowlist, as a pure
// predicate. Account creation is restricted to a configured set of email
// domains, regardless of auth provider (Google OAuth in production, or email +
// password in dev). See docs/specs/ddd/identity-access.md (IA invariant 4).
//
// Kept framework-free so it is unit-testable; the BetterAuth user-create hook
// (src/server/auth.ts) is the single call site that enforces it.

/** The lowercased domain part of an email, or `null` if `email` is malformed. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  // Reject "@x", "x@", "x" and empty: the local part and domain must be non-empty.
  if (at <= 0 || at === email.length - 1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return domain.length > 0 ? domain : null;
}

// The wildcard sentinel that opens sign-up to any valid email domain (S22 part C
// / IA5). A multi-tenant superset configures `AUTH_ALLOWED_EMAIL_DOMAINS=["*"]`
// for self-serve open sign-up (membership, not domain, gates access — T3); OSS
// keeps its explicit domains, so the default behaviour is unchanged.
export const ALLOW_ALL_DOMAINS = "*";

/**
 * Whether `email`'s domain is allowed. A domain matches when it is in
 * `allowedDomains` (exact, case-insensitive — a subdomain like
 * `x@sub.example.com` is NOT a match for `example.com`), **or** when the
 * allowlist contains the wildcard `*` (open sign-up, IA5). A malformed email is
 * always rejected — even under `*`, a real domain is required.
 */
export function isEmailDomainAllowed(
  email: string,
  allowedDomains: readonly string[],
): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  if (allowedDomains.includes(ALLOW_ALL_DOMAINS)) return true;
  return allowedDomains.some((d) => d.trim().toLowerCase() === domain);
}
