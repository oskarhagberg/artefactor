import type { ViewEntry } from "./view-entry";

// A projection of who has viewed an artefact, powering the S21 "viewed by" list
// (`…/viewers`). Identity + freshness only — the entry carries nothing else.
export interface ViewerRef {
  viewerId: string;
  viewedAt: Date;
}

// Port: persistence for the ViewEntry aggregate. The Drizzle adapter (infra/db)
// and the in-memory test double both implement this. One entry per
// (artefactId, viewerId) pair (VT1) — `save` upserts on that pair.
export interface ViewRepository {
  findByArtefactAndViewer(
    artefactId: string,
    viewerId: string,
  ): Promise<ViewEntry | null>;
  save(entry: ViewEntry): Promise<void>;
  // Viewers who have an entry for this artefact, for the "viewed by" list.
  listViewersByArtefact(artefactId: string): Promise<ViewerRef[]>;
  // Remove every entry for an artefact — used when the artefact is permanently
  // deleted (AH11/VT5). A no-op if there are none.
  deleteByArtefact(artefactId: string): Promise<void>;
}
