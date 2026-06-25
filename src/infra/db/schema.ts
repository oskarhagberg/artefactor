import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Artefact Hosting context. The 100 MB HTML payload itself lives on the
// filesystem (see infra/storage); the row holds only a reference + size + hash.
export const artefact = sqliteTable(
  "artefact",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    kind: text("kind", {
      enum: ["prototype", "slide-deck", "form", "interactive-doc", "other"],
    }).notNull(),
    visibility: text("visibility", {
      enum: ["private", "authenticated", "public"],
    })
      .notNull()
      .default("private"),
    publicSlug: text("public_slug"),
    status: text("status", { enum: ["active", "archived"] })
      .notNull()
      .default("active"),
    payloadRef: text("payload_ref").notNull(),
    payloadBytes: integer("payload_bytes").notNull(),
    payloadHash: text("payload_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    uniqueIndex("artefact_public_slug_uq").on(t.publicSlug),
    index("artefact_owner_idx").on(t.ownerId),
    index("artefact_status_visibility_idx").on(t.status, t.visibility),
  ],
);

// Artefact Data context. One opaque JSON blob per (artefact, author), upsert.
export const dataEntry = sqliteTable(
  "data_entry",
  {
    id: text("id").primaryKey(),
    artefactId: text("artefact_id")
      .notNull()
      .references(() => artefact.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull(),
    blob: text("blob").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    uniqueIndex("data_entry_artefact_author_uq").on(t.artefactId, t.authorId),
  ],
);

// NOTE: owner_id / author_id reference the authenticated user id. The user /
// session / account tables are owned by BetterAuth and are generated when
// auth is wired in S1; foreign keys to them are added then.
