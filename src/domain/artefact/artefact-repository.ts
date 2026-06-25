import type { Artefact } from "./artefact";

// Port: persistence for the Artefact aggregate. The Drizzle adapter (infra/db)
// and the in-memory test double both implement this.
export interface ArtefactRepository {
  save(artefact: Artefact): Promise<void>;
  findById(id: string): Promise<Artefact | null>;
  findBySlug(slug: string): Promise<Artefact | null>;
}
