import { InvariantViolation } from "./errors";
import type { Artefact } from "./artefact";

// Pure transitions for the `selected`-tier access list (AH13/14). The list is a
// **set** of user ids: granting an existing member or revoking a non-member is a
// no-op (returns the artefact unchanged). The owner is never a member — they
// always have access — so granting the owner is rejected. The list cannot be
// changed while archived (AH7). Owner authority (AH9) is enforced by the command.
//
// These operate on the full aggregate (not just the id list) so the command can
// `save` the result; `updatedAt` is bumped only when the set actually changes.

// Grant view access to a specific registered user.
export function grantAccess(
  a: Artefact,
  userId: string,
  now?: Date,
): Artefact {
  if (a.status === "archived") {
    throw new InvariantViolation("cannot change access of an archived artefact"); // AH7
  }
  if (userId === a.ownerId) {
    throw new InvariantViolation("the owner always has access"); // AH14
  }
  if (a.sharedWith.includes(userId)) return a; // set semantics — already a member
  return {
    ...a,
    sharedWith: [...a.sharedWith, userId],
    updatedAt: now ?? new Date(),
  };
}

// Revoke a user's access. A no-op if they were never a member.
export function revokeAccess(
  a: Artefact,
  userId: string,
  now?: Date,
): Artefact {
  if (a.status === "archived") {
    throw new InvariantViolation("cannot change access of an archived artefact"); // AH7
  }
  if (!a.sharedWith.includes(userId)) return a; // set semantics — not a member
  return {
    ...a,
    sharedWith: a.sharedWith.filter((id) => id !== userId),
    updatedAt: now ?? new Date(),
  };
}
