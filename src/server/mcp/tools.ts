import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ARTEFACT_KINDS } from "../../domain/artefact/kind";
import { VISIBILITIES } from "../../domain/artefact/visibility";
import type { Artefact } from "../../domain/artefact/artefact";
import type { ArtefactRepository } from "../../domain/artefact/artefact-repository";
import type { PayloadStore } from "../../domain/artefact/ports";
import type { DataRepository } from "../../domain/data/data-repository";
import {
  ArtefactNotFound,
  InvariantViolation,
} from "../../domain/artefact/errors";
import { DataError } from "../../domain/data/errors";
import { createArtefactCommand } from "../artefacts/create-artefact.command";
import { editArtefactCommand } from "../artefacts/edit-artefact.command";
import { setArtefactVisibilityCommand } from "../artefacts/set-visibility.command";
import {
  archiveArtefactCommand,
  restoreArtefactCommand,
} from "../artefacts/lifecycle.command";
import { loadOwnActiveArtefact } from "../artefacts/get-own-artefact";
import { patchOwnDataEntry } from "../data/own-data.command";
import { toArtefactSummary } from "../routes/artefacts";
import { env } from "../env";

// S18 — the MCP tool surface. Each tool is a thin adapter over the existing
// Hosting / Data application commands, attributed to the OAuth token's Account
// (`userId`). The tools add NO new authority: every invariant (ownership,
// access matrix, kind/payload/blob bounds) is enforced by the same commands the
// BFF uses. See docs/specs/fdd/slice-dag.md S18.

export interface McpToolDeps {
  repo: ArtefactRepository;
  payloadStore: PayloadStore;
  dataRepo: DataRepository;
}

// An MCP tool result wrapping a JSON value as text content.
function ok(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

// A failed tool call. Domain rejections (bad input, not-found, blob errors) are
// surfaced to the model as `isError` text so it can adjust, rather than crashing
// the connection. Unexpected errors propagate (becoming a protocol error).
function fail(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

// Map an artefact to the summary the BFF returns, plus the shareable URL when it
// is actually reachable by link (a slug exists and the tier is not private —
// the slug is retained but 404s while private).
function summarize(a: Artefact) {
  const summary = toArtefactSummary(a);
  const url =
    a.publicSlug && a.visibility !== "private"
      ? `${env.BETTER_AUTH_URL}/a/${a.publicSlug}`
      : null;
  return { ...summary, url };
}

// Run a tool body, translating known domain errors into `isError` results.
async function run<T>(body: () => Promise<T>) {
  try {
    return ok(await body());
  } catch (err) {
    if (
      err instanceof ArtefactNotFound ||
      err instanceof InvariantViolation ||
      err instanceof DataError
    ) {
      return fail(err.message);
    }
    throw err;
  }
}

export function registerArtefactTools(
  server: McpServer,
  userId: string,
  deps: McpToolDeps,
): void {
  const { repo, payloadStore, dataRepo } = deps;

  server.registerTool(
    "create_artefact",
    {
      title: "Create artefact",
      description:
        "Publish a self-contained HTML artefact to Artefactor. Returns the new artefact (id, slug, share URL). Optionally set its visibility; default is private.",
      inputSchema: {
        title: z.string().min(1).describe("Human-readable title."),
        kind: z
          .enum(ARTEFACT_KINDS)
          .describe("Artefact kind (metadata for grouping)."),
        html: z
          .string()
          .min(1)
          .describe("The complete HTML document, served as-is."),
        visibility: z
          .enum(VISIBILITIES)
          .optional()
          .describe(
            "private (owner only), authenticated (any signed-in user), public (anyone with the link), or selected. Default private.",
          ),
      },
    },
    async ({ title, kind, html, visibility }) =>
      run(async () => {
        const created = await createArtefactCommand(
          { ownerId: userId, title, kind, payload: new TextEncoder().encode(html) },
          { repo, payloadStore },
        );
        const final =
          visibility && visibility !== "private"
            ? await setArtefactVisibilityCommand(
                { artefactId: created.id, requesterId: userId, visibility },
                { repo },
              )
            : created;
        return summarize(final);
      }),
  );

  server.registerTool(
    "update_artefact",
    {
      title: "Update artefact",
      description:
        "Replace the title, kind, and/or HTML of an existing artefact you own. The HTML is a full replacement, not a patch.",
      inputSchema: {
        id: z.string().min(1).describe("The artefact id."),
        title: z.string().min(1).optional(),
        kind: z.enum(ARTEFACT_KINDS).optional(),
        html: z
          .string()
          .min(1)
          .optional()
          .describe("New complete HTML document (full replace)."),
      },
    },
    async ({ id, title, kind, html }) =>
      run(async () => {
        const updated = await editArtefactCommand(
          {
            artefactId: id,
            requesterId: userId,
            title,
            kind,
            payload: html === undefined ? undefined : new TextEncoder().encode(html),
          },
          { repo, payloadStore },
        );
        return summarize(updated);
      }),
  );

  server.registerTool(
    "list_artefacts",
    {
      title: "List artefacts",
      description:
        "List the artefacts you own, most-recently-updated first. Archived ones are hidden unless include_archived is true.",
      inputSchema: {
        include_archived: z.boolean().optional(),
      },
    },
    async ({ include_archived }) =>
      run(async () => {
        const owned = await repo.listByOwner(userId, {
          includeArchived: include_archived ?? false,
        });
        return { artefacts: owned.map(summarize) };
      }),
  );

  server.registerTool(
    "get_artefact",
    {
      title: "Get artefact",
      description:
        "Get one of your active artefacts by id (metadata + share URL). Unknown / not yours / archived → not found.",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) =>
      run(async () => {
        const a = await loadOwnActiveArtefact(repo, { id, ownerId: userId });
        return summarize(a);
      }),
  );

  server.registerTool(
    "set_visibility",
    {
      title: "Set artefact visibility",
      description:
        "Share or unshare an artefact. A shareable tier mints (and retains) a slug; private retains the slug but the link 404s.",
      inputSchema: {
        id: z.string().min(1),
        visibility: z.enum(VISIBILITIES),
      },
    },
    async ({ id, visibility }) =>
      run(async () => {
        const updated = await setArtefactVisibilityCommand(
          { artefactId: id, requesterId: userId, visibility },
          { repo },
        );
        return summarize(updated);
      }),
  );

  server.registerTool(
    "archive_artefact",
    {
      title: "Archive artefact",
      description: "Soft-delete (archive) an active artefact you own.",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) =>
      run(async () => {
        const updated = await archiveArtefactCommand(
          { artefactId: id, requesterId: userId },
          { repo },
        );
        return summarize(updated);
      }),
  );

  server.registerTool(
    "restore_artefact",
    {
      title: "Restore artefact",
      description: "Restore an archived artefact to active at its prior tier.",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) =>
      run(async () => {
        const updated = await restoreArtefactCommand(
          { artefactId: id, requesterId: userId },
          { repo },
        );
        return summarize(updated);
      }),
  );

  server.registerTool(
    "patch_artefact_data",
    {
      title: "Patch artefact data",
      description:
        "Merge a partial JSON object into your data blob for an artefact (RFC 7396 JSON Merge Patch: a null value deletes a key). This is the data the artefact reads via localStorage. Updates only your own data context.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The artefact id (or slug) whose data to patch."),
        patch: z
          .record(z.string(), z.unknown())
          .describe("A JSON object merged into the current blob (RFC 7396)."),
      },
    },
    async ({ id, patch }) =>
      run(async () => {
        const entry = await patchOwnDataEntry(
          { ref: id, authorId: userId },
          JSON.stringify(patch),
          { artefactRepo: repo, dataRepo },
        );
        return { blob: entry.blob, updatedAt: entry.updatedAt.toISOString() };
      }),
  );
}
