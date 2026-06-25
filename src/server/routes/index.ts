import { Hono } from "hono";

// BFF API routes. One module per feature slice is mounted here from S1 onward.
export function createApiRoutes() {
  const api = new Hono();

  api.get("/ping", (c) => c.json({ pong: true }));

  return api;
}
