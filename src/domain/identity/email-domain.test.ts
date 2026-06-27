import { describe, expect, it } from "vitest";
import { emailDomain, isEmailDomainAllowed } from "./email-domain";

// IA invariant 4 — account creation is restricted to allowed email domains.
const ALLOWED = ["humly.io", "humly.co.uk"];

describe("emailDomain", () => {
  it("extracts the lowercased domain", () => {
    expect(emailDomain("alice@Humly.IO")).toBe("humly.io");
    expect(emailDomain("a.b+tag@humly.co.uk")).toBe("humly.co.uk");
  });

  it("returns null for malformed emails", () => {
    for (const bad of ["", "no-at", "@humly.io", "x@", "@", "  "]) {
      expect(emailDomain(bad)).toBeNull();
    }
  });
});

describe("isEmailDomainAllowed", () => {
  it("accepts the allowed domains, case-insensitively", () => {
    expect(isEmailDomainAllowed("alice@humly.io", ALLOWED)).toBe(true);
    expect(isEmailDomainAllowed("Bob@HUMLY.CO.UK", ALLOWED)).toBe(true);
  });

  it("rejects any other domain", () => {
    expect(isEmailDomainAllowed("mallory@gmail.com", ALLOWED)).toBe(false);
    expect(isEmailDomainAllowed("evil@example.com", ALLOWED)).toBe(false);
  });

  it("rejects subdomains and look-alikes (exact match only)", () => {
    expect(isEmailDomainAllowed("x@sub.humly.io", ALLOWED)).toBe(false);
    expect(isEmailDomainAllowed("x@humly.io.evil.com", ALLOWED)).toBe(false);
    expect(isEmailDomainAllowed("x@nothumly.io", ALLOWED)).toBe(false);
  });

  it("rejects malformed emails", () => {
    expect(isEmailDomainAllowed("not-an-email", ALLOWED)).toBe(false);
    expect(isEmailDomainAllowed("@humly.io", ALLOWED)).toBe(false);
  });

  it("rejects everything when the allowlist is empty", () => {
    expect(isEmailDomainAllowed("alice@humly.io", [])).toBe(false);
  });
});
