import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerArtefactTools, type McpToolDeps } from "./tools";
import { PERSISTENCE_CONTRACT_SUMMARY } from "./authoring-guide";

export type { McpToolDeps } from "./tools";

// S18 — build a per-request MCP server bound to one authenticated Account. The
// server is stateless and short-lived: created on each `POST /mcp` after the
// bearer is resolved to a `userId`, so every tool acts as that user.
export function buildMcpServer(userId: string, deps: McpToolDeps): McpServer {
  const server = new McpServer(
    {
      name: "artefactor",
      version: "0.2.0",
    },
    {
      // Surfaced in the `initialize` response and injected into the model's
      // context when the connector is enabled — the ambient channel that stands
      // in for the Agent Skill clients like Claude design can't load. Carries the
      // persistence contract the model needs BEFORE it writes any artefact HTML.
      instructions: PERSISTENCE_CONTRACT_SUMMARY,
    },
  );
  registerArtefactTools(server, userId, deps);
  return server;
}
