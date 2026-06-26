import { describe, expect, it } from "vitest";
import { createArtefact, MAX_PAYLOAD_BYTES } from "./artefact";
import { InMemoryArtefactRepository } from "./in-memory-artefact-repository";
import { InvariantViolation } from "./errors";

const base = {
  id: "a1",
  ownerId: "u1",
  title: "Demo artefact",
  kind: "prototype" as const,
  payload: { ref: "r1", bytes: 1024, hash: "deadbeef" },
};

describe("createArtefact", () => {
  it("creates an active, private artefact with no slug", () => {
    const a = createArtefact(base);
    expect(a.status).toBe("active");
    expect(a.visibility).toBe("private");
    expect(a.publicSlug).toBeNull();
    expect(a.payloadBytes).toBe(1024);
  });

  it("trims and rejects an empty title (AH3)", () => {
    expect(() => createArtefact({ ...base, title: "   " })).toThrow(
      InvariantViolation,
    );
  });

  it("rejects an empty payload (AH2)", () => {
    expect(() =>
      createArtefact({ ...base, payload: { ref: "r", bytes: 0, hash: "h" } }),
    ).toThrow(InvariantViolation);
  });

  it("rejects a payload over the 100 MB cap (AH2)", () => {
    expect(() =>
      createArtefact({
        ...base,
        payload: { ref: "r", bytes: MAX_PAYLOAD_BYTES + 1, hash: "h" },
      }),
    ).toThrow(InvariantViolation);
  });

  it("requires an owner (AH1)", () => {
    expect(() => createArtefact({ ...base, ownerId: "" })).toThrow(
      InvariantViolation,
    );
  });
});

describe("InMemoryArtefactRepository", () => {
  it("persists and retrieves an artefact by id", async () => {
    const repo = new InMemoryArtefactRepository();
    await repo.save(createArtefact(base));
    expect(await repo.findById("a1")).toMatchObject({
      id: "a1",
      title: "Demo artefact",
    });
    expect(await repo.findById("missing")).toBeNull();
  });

  describe("listByOwner (S10)", () => {
    it("returns only the owner's active artefacts, newest first", async () => {
      const repo = new InMemoryArtefactRepository();
      const t0 = new Date("2026-01-01T00:00:00Z");
      const t1 = new Date("2026-01-02T00:00:00Z");
      await repo.save(createArtefact({ ...base, id: "old", now: t0 }));
      await repo.save(createArtefact({ ...base, id: "new", now: t1 }));
      await repo.save(createArtefact({ ...base, id: "other", ownerId: "u2" }));
      // An archived artefact of the same owner is hidden by default (AH7).
      const archived = {
        ...createArtefact({ ...base, id: "arch" }),
        status: "archived" as const,
      };
      await repo.save(archived);

      const list = await repo.listByOwner("u1");
      expect(list.map((a) => a.id)).toEqual(["new", "old"]);
    });

    it("includes archived artefacts when asked", async () => {
      const repo = new InMemoryArtefactRepository();
      await repo.save(createArtefact(base));
      await repo.save({
        ...createArtefact({ ...base, id: "arch" }),
        status: "archived" as const,
      });
      const list = await repo.listByOwner("u1", { includeArchived: true });
      expect(list.map((a) => a.id).sort()).toEqual(["a1", "arch"]);
    });
  });
});
