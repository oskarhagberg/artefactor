import type { Artefact } from "../../domain/artefact/artefact";
import { ArtefactNotFound } from "../../domain/artefact/errors";
import type { ArtefactRepository } from "../../domain/artefact/artefact-repository";
import type { TenantScope } from "../../domain/artefact/tenant-scope";

// Load an artefact for owner-scoped viewing (S4). The requester must own it and
// it must be active. Missing, not-owned, archived, and **out-of-tenant-scope**
// all surface identically as not-found, so neither a private artefact's existence
// nor its archived state leaks (AH7/AH8) and a cross-tenant probe reveals nothing
// (S22/T2). The owner reaches archived artefacts only via the "Your artefacts"
// archived filter (to restore them), never this view.
export async function loadOwnActiveArtefact(
  repo: ArtefactRepository,
  params: { id: string; ownerId: string; scope: TenantScope },
): Promise<Artefact> {
  const artefact = await repo.findById(params.id, params.scope);
  if (
    !artefact ||
    artefact.ownerId !== params.ownerId ||
    artefact.status !== "active"
  ) {
    throw new ArtefactNotFound(params.id);
  }
  return artefact;
}

// Load an owned artefact regardless of status (S7 restore needs the archived
// one). Missing, not-owned, or out-of-scope → not-found, so existence still does
// not leak; the caller's transition (e.g. restoreArtefact) enforces the required
// status.
export async function loadOwnArtefact(
  repo: ArtefactRepository,
  params: { id: string; ownerId: string; scope: TenantScope },
): Promise<Artefact> {
  const artefact = await repo.findById(params.id, params.scope);
  if (!artefact || artefact.ownerId !== params.ownerId) {
    throw new ArtefactNotFound(params.id);
  }
  return artefact;
}
