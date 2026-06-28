import type { Artefact } from "./artefact";

// The fields the access matrix depends on — a viewer-facing slice of the
// aggregate. Keeping the input narrow makes the rule easy to reason about and
// reuse (slug serving in S6, "Shared with you" in S14, data access in S11/S12).
export type ViewableArtefact = Pick<
  Artefact,
  "visibility" | "status" | "ownerId" | "sharedWith"
>;

// The access matrix for serving an artefact (AH8), gated by archived-is-inert
// (AH7). `viewerId` is the authenticated user id, or null when unauthenticated.
//
//   visibility     | owner | member | other signed-in | unauthenticated
//   -------------- | ----- | ------ | --------------- | ---------------
//   private        |  yes  |   —    |       no        |       no
//   selected       |  yes  |  yes   |       no        |       no
//   authenticated  |  yes  |  yes   |       yes       |       no
//   public         |  yes  |  yes   |       yes       |       yes
//
// A `selected` artefact is visible to the owner and to any user in `sharedWith`
// (AH8/13); everyone else — signed-in or anonymous — gets a flat deny.
// An archived artefact is never served — it returns false to everyone, owner
// included (the owner reaches it only via the "Your artefacts" archived filter).
export function canViewArtefact(
  artefact: ViewableArtefact,
  viewerId: string | null,
): boolean {
  if (artefact.status !== "active") return false; // AH7

  switch (artefact.visibility) {
    case "public":
      return true;
    case "authenticated":
      return viewerId !== null;
    case "selected":
      return (
        viewerId !== null &&
        (viewerId === artefact.ownerId ||
          artefact.sharedWith.includes(viewerId))
      );
    case "private":
      return viewerId !== null && viewerId === artefact.ownerId;
  }
}
