import { InvariantViolation } from "./errors";
import type { ArtefactKind } from "./kind";
import type { Status, Visibility } from "./visibility";
import type { StoredPayload } from "./ports";

// Invariant AH2: payload size cap.
export const MAX_PAYLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

export interface Artefact {
  id: string;
  ownerId: string;
  title: string;
  kind: ArtefactKind;
  visibility: Visibility;
  publicSlug: string | null;
  status: Status;
  payloadRef: string;
  payloadBytes: number;
  payloadHash: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface CreateArtefactInput {
  id: string;
  ownerId: string;
  title: string;
  kind: ArtefactKind;
  payload: StoredPayload;
  now?: Date;
}

// Factory enforcing the create-time invariants from the Artefact Hosting spec.
// A new artefact is always active + private with no slug.
export function createArtefact(input: CreateArtefactInput): Artefact {
  if (!input.ownerId) {
    throw new InvariantViolation("ownerId is required"); // AH1
  }
  const title = input.title.trim();
  if (title.length === 0) {
    throw new InvariantViolation("title must not be empty"); // AH3
  }
  if (input.payload.bytes <= 0) {
    throw new InvariantViolation("payload must not be empty"); // AH2
  }
  if (input.payload.bytes > MAX_PAYLOAD_BYTES) {
    throw new InvariantViolation("payload exceeds the 100 MB cap"); // AH2
  }

  const now = input.now ?? new Date();
  return {
    id: input.id,
    ownerId: input.ownerId,
    title,
    kind: input.kind,
    visibility: "private",
    publicSlug: null,
    status: "active",
    payloadRef: input.payload.ref,
    payloadBytes: input.payload.bytes,
    payloadHash: input.payload.hash,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
}
