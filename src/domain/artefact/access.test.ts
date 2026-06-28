import { describe, expect, it } from "vitest";
import { canViewArtefact, type ViewableArtefact } from "./access";

const OWNER = "owner-1";
const OTHER = "user-2";
const MEMBER = "member-3";

function artefact(
  visibility: ViewableArtefact["visibility"],
  status: ViewableArtefact["status"] = "active",
  sharedWith: string[] = [],
): ViewableArtefact {
  return { visibility, status, ownerId: OWNER, sharedWith };
}

describe("canViewArtefact — access matrix (S6, AH8)", () => {
  it("public is viewable by anyone, including the unauthenticated", () => {
    expect(canViewArtefact(artefact("public"), null)).toBe(true);
    expect(canViewArtefact(artefact("public"), OTHER)).toBe(true);
    expect(canViewArtefact(artefact("public"), OWNER)).toBe(true);
  });

  it("authenticated is viewable by any signed-in user, not the anonymous", () => {
    expect(canViewArtefact(artefact("authenticated"), null)).toBe(false);
    expect(canViewArtefact(artefact("authenticated"), OTHER)).toBe(true);
    expect(canViewArtefact(artefact("authenticated"), OWNER)).toBe(true);
  });

  it("selected is viewable by the owner and members only (AH8/13)", () => {
    const a = artefact("selected", "active", [MEMBER]);
    expect(canViewArtefact(a, OWNER)).toBe(true); // owner always
    expect(canViewArtefact(a, MEMBER)).toBe(true); // granted member
    expect(canViewArtefact(a, OTHER)).toBe(false); // signed-in non-member
    expect(canViewArtefact(a, null)).toBe(false); // anonymous
  });

  it("selected with an empty access list is owner-only (AH13)", () => {
    const a = artefact("selected", "active", []);
    expect(canViewArtefact(a, OWNER)).toBe(true);
    expect(canViewArtefact(a, OTHER)).toBe(false);
  });

  it("private is viewable only by the owner", () => {
    expect(canViewArtefact(artefact("private"), null)).toBe(false);
    expect(canViewArtefact(artefact("private"), OTHER)).toBe(false);
    expect(canViewArtefact(artefact("private"), OWNER)).toBe(true);
  });

  it("archived is never viewable, owner included (AH7)", () => {
    expect(canViewArtefact(artefact("public", "archived"), OWNER)).toBe(false);
    expect(canViewArtefact(artefact("public", "archived"), null)).toBe(false);
    expect(canViewArtefact(artefact("private", "archived"), OWNER)).toBe(false);
  });
});
