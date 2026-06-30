import { randomUUID } from "node:crypto";
import { canViewArtefact } from "../../domain/artefact/access";
import { ArtefactNotFound } from "../../domain/artefact/errors";
import type { ArtefactRepository } from "../../domain/artefact/artefact-repository";
import { recordView } from "../../domain/views/view-entry";
import type {
  ViewerRef,
  ViewRepository,
} from "../../domain/views/view-repository";

// Application commands for S21 — Artefact Views. They record that a signed-in
// viewer opened an artefact (latest view only, VT1) and list who has viewed it.
// The list-path resolves the artefact by reference (slug or id) under the
// Artefact access matrix, exactly like the Artefact Data commands.

export interface RecordViewDeps {
  viewRepo: ViewRepository;
  newId?: () => string;
  now?: () => Date;
}

// Record a view for an already-resolved, already-access-checked artefact (VT3).
// Upserts the single (artefact, viewer) entry — first view creates it, later
// views bump `viewedAt`. The caller is the serving route, which has the artefact
// in hand and has passed the access matrix, so no re-resolution is needed.
export async function recordArtefactView(
  artefactId: string,
  viewerId: string,
  deps: RecordViewDeps,
): Promise<void> {
  const existing = await deps.viewRepo.findByArtefactAndViewer(
    artefactId,
    viewerId,
  );
  const entry = recordView({
    id: (deps.newId ?? randomUUID)(),
    artefactId,
    viewerId,
    existing,
    now: (deps.now ?? (() => new Date()))(),
  });
  await deps.viewRepo.save(entry);
}

export interface ListViewersDeps {
  artefactRepo: ArtefactRepository;
  viewRepo: ViewRepository;
}

// Resolve the artefact a viewers request targets — by slug, falling back to id —
// then apply the access matrix against the viewer. Missing / archived /
// not-viewable all → not-found (mirrors `resolveViewableArtefact` in the data
// commands; kept local so Views does not depend on the Data module).
async function resolveViewableArtefact(
  repo: ArtefactRepository,
  ref: string,
  viewerId: string | null,
) {
  const artefact =
    (await repo.findBySlug(ref)) ?? (await repo.findById(ref));
  if (!artefact || !canViewArtefact(artefact, viewerId)) {
    throw new ArtefactNotFound(ref);
  }
  return artefact;
}

// List the artefact's viewers, **excluding the requesting viewer** (VT4): the
// caller wants to know who *else* has viewed it. Access follows the artefact
// matrix — any signed-in viewer who may see the artefact may see its viewers.
export async function listArtefactViewers(
  ref: string,
  viewerId: string,
  deps: ListViewersDeps,
): Promise<ViewerRef[]> {
  const artefact = await resolveViewableArtefact(
    deps.artefactRepo,
    ref,
    viewerId,
  );
  const viewers = await deps.viewRepo.listViewersByArtefact(artefact.id);
  return viewers.filter((v) => v.viewerId !== viewerId);
}
