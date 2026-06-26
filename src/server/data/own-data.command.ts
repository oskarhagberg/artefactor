import { randomUUID } from "node:crypto";
import { canViewArtefact } from "../../domain/artefact/access";
import { ArtefactNotFound } from "../../domain/artefact/errors";
import type { ArtefactRepository } from "../../domain/artefact/artefact-repository";
import {
  upsertDataEntry,
  type DataEntry,
} from "../../domain/data/data-entry";
import type { DataRepository } from "../../domain/data/data-repository";

// Application commands for S11 — read/write the caller's own data blob. Data is
// addressed by the artefact's slug (the served-artefact handle, per the AD spec).
// Access follows the Artefact access matrix: an archived artefact, or one the
// caller cannot view, surfaces as not-found (AD4, AD6, AH7/8).
export interface OwnDataDeps {
  artefactRepo: ArtefactRepository;
  dataRepo: DataRepository;
  newId?: () => string;
  now?: () => Date;
}

// Resolve the artefact a data request targets, applying the access matrix
// against the viewer. Missing / archived / not-viewable all → not-found.
async function resolveViewableArtefact(
  deps: OwnDataDeps,
  slug: string,
  viewerId: string | null,
) {
  const artefact = await deps.artefactRepo.findBySlug(slug);
  if (!artefact || !canViewArtefact(artefact, viewerId)) {
    throw new ArtefactNotFound(slug);
  }
  return artefact;
}

export interface OwnDataRef {
  slug: string;
  authorId: string; // the authenticated caller
}

// GET own entry — returns the caller's entry, or null if they have none yet.
export async function getOwnDataEntry(
  ref: OwnDataRef,
  deps: OwnDataDeps,
): Promise<DataEntry | null> {
  const artefact = await resolveViewableArtefact(deps, ref.slug, ref.authorId);
  return deps.dataRepo.findByArtefactAndAuthor(artefact.id, ref.authorId);
}

// PUT own entry — validate + upsert the caller's blob (AD1, AD2, AD8).
export async function putOwnDataEntry(
  ref: OwnDataRef,
  blob: string,
  deps: OwnDataDeps,
): Promise<DataEntry> {
  const artefact = await resolveViewableArtefact(deps, ref.slug, ref.authorId);
  const existing = await deps.dataRepo.findByArtefactAndAuthor(
    artefact.id,
    ref.authorId,
  );
  const entry = upsertDataEntry({
    id: (deps.newId ?? randomUUID)(),
    artefactId: artefact.id,
    authorId: ref.authorId,
    blob,
    existing,
    now: (deps.now ?? (() => new Date()))(),
  });
  await deps.dataRepo.save(entry);
  return entry;
}

// DELETE own entry — remove the caller's entry (no-op if none).
export async function deleteOwnDataEntry(
  ref: OwnDataRef,
  deps: OwnDataDeps,
): Promise<void> {
  const artefact = await resolveViewableArtefact(deps, ref.slug, ref.authorId);
  await deps.dataRepo.deleteByArtefactAndAuthor(artefact.id, ref.authorId);
}
