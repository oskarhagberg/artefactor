import { Hono } from "hono";
import { StreamableHTTPTransport } from "@hono/mcp";
import {
  oAuthDiscoveryMetadata,
  oAuthProtectedResourceMetadata,
} from "better-auth/plugins";
import { env } from "../env";
import type { AuthInstance } from "../middleware/auth";
import { buildMcpServer, type McpToolDeps } from "./server";

// S18 — MCP connector endpoints, mounted at the app root (NOT under /api) so
// they sit at the URLs an MCP client probes: the OAuth discovery descriptors at
// `/.well-known/oauth-*` and the protocol endpoint at `/mcp`. OAuth itself
// (authorize/consent/token/register) is served by the BetterAuth handler under
// `/api/auth/*` via the `mcp` plugin; these root routes are the discovery
// surface plus the bearer-guarded tool endpoint.
export function createMcpRoutes(deps: McpToolDeps, auth: AuthInstance) {
  const r = new Hono();

  // Discovery — better-auth renders the metadata; we just expose it at the root
  // path the client expects. `getMcpSession` etc. live under /api/auth.
  r.get("/.well-known/oauth-authorization-server", (c) =>
    oAuthDiscoveryMetadata(auth)(c.req.raw),
  );
  r.get("/.well-known/oauth-protected-resource", (c) =>
    oAuthProtectedResourceMetadata(auth)(c.req.raw),
  );

  // The MCP protocol endpoint. Resolve the OAuth bearer to an Account; reject
  // with 401 + the protected-resource pointer (per the MCP auth spec) when
  // absent/invalid, so the client knows where to start the OAuth flow. On
  // success, a per-request stateless server runs the tools as that user.
  r.all("/mcp", async (c) => {
    const session = await auth.api.getMcpSession({ headers: c.req.raw.headers });
    if (!session) {
      return c.body(null, 401, {
        "WWW-Authenticate": `Bearer resource_metadata="${env.BETTER_AUTH_URL}/.well-known/oauth-protected-resource"`,
      });
    }
    const server = buildMcpServer(session.userId, deps);
    // Stateless (no sessionIdGenerator): a fresh server per request, so each
    // POST is handled independently — no session store, no init handshake to
    // remember. `enableJsonResponse` returns a single JSON-RPC reply (we have no
    // streaming/progress needs) instead of an SSE stream.
    const transport = new StreamableHTTPTransport({ enableJsonResponse: true });
    await server.connect(transport);
    // handleRequest returns the Response for the JSON-RPC exchange (or undefined
    // for a body-less ack, which shouldn't happen for POST tool calls).
    return (await transport.handleRequest(c)) ?? c.body(null, 202);
  });

  return r;
}
