import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";
import { env } from "./env";
import { createApiRoutes } from "./routes";
import type { HealthResponse } from "../shared/contracts";

export function createApp() {
  const app = new Hono();

  app.use("*", logger());

  app.get("/health", (c) =>
    c.json<HealthResponse>({ status: "ok", uptime: process.uptime() }),
  );

  app.route("/api", createApiRoutes());

  // Serve the built Svelte client. Static assets first...
  app.use("/*", serveStatic({ root: env.CLIENT_DIR }));
  // ...then SPA fallback to index.html for any unmatched (non-API) route.
  app.get("*", serveStatic({ path: "index.html", root: env.CLIENT_DIR }));

  return app;
}
