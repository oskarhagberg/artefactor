import { beforeEach, describe, expect, it } from "vitest";
import { loadOwnActiveArtefact } from "./get-own-artefact";
import { createArtefact } from "../../domain/artefact/artefact";
import { InMemoryArtefactRepository } from "../../domain/artefact/in-memory-artefact-repository";
import { ArtefactNotFound } from "../../domain/artefact/errors";

const OWNER = "owner-1";

describe("loadOwnActiveArtefact (S4)", () => {
  let repo: InMemoryArtefactRepository;
  beforeEach(async () => {
    repo = new InMemoryArtefactRepository();
    await repo.save(
      createArtefact({
        id: "a1",
        ownerId: OWNER,
        title: "Mine",
        kind: "prototype",
        payload: { ref: "r", bytes: 10, hash: "h" },
      }),
    );
  });

  it("returns the owner's own active artefact", async () => {
    const a = await loadOwnActiveArtefact(repo, { id: "a1", ownerId: OWNER });
    expect(a.id).toBe("a1");
  });

  it("rejects a non-owner as not-found (AH8)", async () => {
    await expect(
      loadOwnActiveArtefact(repo, { id: "a1", ownerId: "intruder" }),
    ).rejects.toBeInstanceOf(ArtefactNotFound);
  });

  it("rejects an unknown id as not-found", async () => {
    await expect(
      loadOwnActiveArtefact(repo, { id: "missing", ownerId: OWNER }),
    ).rejects.toBeInstanceOf(ArtefactNotFound);
  });

  it("rejects an archived artefact as not-found, even for the owner (AH7)", async () => {
    await repo.save({
      ...createArtefact({
        id: "arch",
        ownerId: OWNER,
        title: "Old",
        kind: "form",
        payload: { ref: "r2", bytes: 5, hash: "h2" },
      }),
      status: "archived",
    });
    await expect(
      loadOwnActiveArtefact(repo, { id: "arch", ownerId: OWNER }),
    ).rejects.toBeInstanceOf(ArtefactNotFound);
  });
});
