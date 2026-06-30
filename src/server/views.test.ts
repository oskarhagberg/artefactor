import { beforeAll, describe, expect, it } from "vitest";
import type { Hono } from "hono";
import type {
  ArtefactSummary,
  ArtefactViewersResponse,
} from "../shared/contracts";

// End-to-end S21: record a view when a signed-in viewer opens an artefact, and
// list "who has viewed" via the BFF. Drives the real app against a throwaway db
// + filesystem payload store.
describe("who has viewed (S21)", () => {
  let app: Hono;
  let ownerCookie: string;
  let otherCookie: string;
  let ownerId: string;
  let otherId: string;

  const HTML = "<!doctype html><h1>served</h1>";

  async function signUp(email: string): Promise<string> {
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "correct-horse-battery", name: email }),
    });
    return res.headers.get("set-cookie")!.split(";")[0]!;
  }

  async function meId(cookie: string): Promise<string> {
    return (
      (await (await app.request("/api/me", { headers: { cookie } })).json()) as {
        id: string;
      }
    ).id;
  }

  async function makePublicArtefact(): Promise<ArtefactSummary> {
    const form = new FormData();
    form.set("title", "viewable artefact");
    form.set("kind", "prototype");
    form.set("payload", new File([HTML], "a.html"));
    const created = (await (
      await app.request("/api/artefacts", {
        method: "POST",
        body: form,
        headers: { cookie: ownerCookie },
      })
    ).json()) as ArtefactSummary;
    const shared = await app.request(`/api/artefacts/${created.id}/visibility`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: ownerCookie },
      body: JSON.stringify({ visibility: "public" }),
    });
    return (await shared.json()) as ArtefactSummary;
  }

  function open(slug: string, cookie?: string) {
    return app.request(`/a/${slug}`, { headers: cookie ? { cookie } : {} });
  }

  async function viewers(
    ref: string,
    cookie?: string,
  ): Promise<{ status: number; body: ArtefactViewersResponse }> {
    const res = await app.request(`/api/artefacts/${ref}/viewers`, {
      headers: cookie ? { cookie } : {},
    });
    const body = res.status === 200 ? await res.json() : { viewers: [] };
    return { status: res.status, body: body as ArtefactViewersResponse };
  }

  beforeAll(async () => {
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    const { db } = await import("../infra/db/client");
    migrate(db, { migrationsFolder: "./src/infra/db/migrations" });
    const { createApp } = await import("./app");
    app = createApp();
    ownerCookie = await signUp("owner-s21@example.com");
    otherCookie = await signUp("other-s21@example.com");
    ownerId = await meId(ownerCookie);
    otherId = await meId(otherCookie);
  });

  it("renders the 'viewed by' widget (and its endpoint) only for signed-in viewers", async () => {
    const a = await makePublicArtefact();
    const signedIn = await (await open(a.publicSlug!, otherCookie)).text();
    expect(signedIn).toContain('id="ae-viewers"');
    expect(signedIn).toContain(`/api/artefacts/${a.publicSlug}/viewers`);
    // Anonymous viewers never get the host tools, so never the widget.
    const anon = await (await open(a.publicSlug!)).text();
    expect(anon).not.toContain('id="ae-viewers"');
  });

  it("records a signed-in view and lists it for another viewer, excluding the caller (VT1, VT4)", async () => {
    const a = await makePublicArtefact();
    // A signed-in non-owner opens it → a view is recorded.
    expect((await open(a.publicSlug!, otherCookie)).status).toBe(200);

    // The owner sees the other viewer (with display identity), not themselves.
    const seen = await viewers(a.publicSlug!, ownerCookie);
    expect(seen.status).toBe(200);
    expect(seen.body.viewers.map((v) => v.viewerId)).toEqual([otherId]);
    const who = seen.body.viewers[0]!;
    expect(who.email).toBe("other-s21@example.com");
    expect(who.name).toBe("other-s21@example.com");
    expect(Date.parse(who.viewedAt)).not.toBeNaN();
  });

  it("keeps latest view only — re-opening adds no second entry (VT1)", async () => {
    const a = await makePublicArtefact();
    await open(a.publicSlug!, otherCookie);
    await open(a.publicSlug!, otherCookie);
    const seen = await viewers(a.publicSlug!, ownerCookie);
    expect(seen.body.viewers).toHaveLength(1);
    expect(seen.body.viewers[0]!.viewerId).toBe(otherId);
  });

  it("excludes the owner's own view from their list", async () => {
    const a = await makePublicArtefact();
    // Only the owner opens it (via the shared link).
    await open(a.publicSlug!, ownerCookie);
    const seen = await viewers(a.publicSlug!, ownerCookie);
    expect(seen.body.viewers).toEqual([]);
  });

  it("does not record anonymous opens (VT2)", async () => {
    const a = await makePublicArtefact();
    // An anonymous visitor opens the public link — nothing is attributed.
    expect((await open(a.publicSlug!)).status).toBe(200);
    const seen = await viewers(a.publicSlug!, ownerCookie);
    expect(seen.body.viewers).toEqual([]);
  });

  it("requires auth to read the viewers list", async () => {
    const a = await makePublicArtefact();
    const res = await app.request(`/api/artefacts/${a.publicSlug}/viewers`);
    expect(res.status).toBe(401);
  });

  it("404s the viewers list for a viewer who cannot see the artefact (VT4/AH8)", async () => {
    // Share to mint a slug, then unshare → private but addressable by slug.
    const a = await makePublicArtefact();
    await app.request(`/api/artefacts/${a.id}/visibility`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: ownerCookie },
      body: JSON.stringify({ visibility: "private" }),
    });
    // A signed-in non-owner is denied (flat 404, no existence leak).
    expect((await viewers(a.publicSlug!, otherCookie)).status).toBe(404);
    // The owner can still read it.
    expect((await viewers(a.publicSlug!, ownerCookie)).status).toBe(200);
  });
});
