import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerArtefactTools, type McpToolDeps } from "./tools";

export type { McpToolDeps } from "./tools";

// S18 — build a per-request MCP server bound to one authenticated Account. The
// server is stateless and short-lived: created on each `POST /mcp` after the
// bearer is resolved to a `userId`, so every tool acts as that user.
export function buildMcpServer(userId: string, deps: McpToolDeps): McpServer {
  const server = new McpServer({
    name: "artefactor",
    version: "0.2.0",
  });
  registerArtefactTools(server, userId, deps);
  return server;
}
