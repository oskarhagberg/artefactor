import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";
import { env } from "./env";
import { defaultAdapters, type Adapters } from "./adapters";
import { createApiRoutes } from "./routes";
import { createArtefactServingRoutes } from "./routes/serve";
import { createMcpRoutes } from "./mcp/routes";
import type { HealthResponse } from "../shared/contracts";

// S24 — the composition root. The persistence-port adapters are injected
// (defaulting to the OSS SQLite/filesystem set), so a superset can compose the
// same app over a different backend without editing core.
export function createApp(adapters: Adapters = defaultAdapters) {
  const app = new Hono();

  app.use("*", logger());

  app.get("/health", (c) =>
    c.json<HealthResponse>({
      status: "ok",
      uptime: process.uptime(),
      build: env.GIT_SHA,
    }),
  );

  app.route("/api", createApiRoutes(adapters));

  // S6 — public artefact serving by slug (the shared-link render route). Mounted
  // before the static handlers so `/a/:slug` is not swallowed by the SPA fallback.
  app.route(
    "/a",
    createArtefactServingRoutes({
      repo: adapters.artefactRepository,
      payloadStore: adapters.payloadStore,
      dataRepo: adapters.dataRepository,
      viewRepo: adapters.viewRepository,
    }),
  );

  // S18 — MCP connector (remote MCP server + OAuth discovery). Mounted at the
  // root, before the static handlers, so `/mcp` and `/.well-known/oauth-*` are
  // not swallowed by the SPA fallback. OAuth endpoints proper live under
  // /api/auth/* (the BetterAuth `mcp` plugin).
  app.route(
    "/",
    createMcpRoutes({
      repo: adapters.artefactRepository,
      payloadStore: adapters.payloadStore,
      dataRepo: adapters.dataRepository,
    }),
  );

  // Serve the built Svelte client. Static assets first...
  app.use("/*", serveStatic({ root: env.CLIENT_DIR }));
  // ...then SPA fallback to index.html for any unmatched (non-API) route.
  app.get("*", serveStatic({ path: "index.html", root: env.CLIENT_DIR }));

  return app;
}
