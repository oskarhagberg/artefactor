// Contracts shared between the Hono BFF and the Svelte client.
// Slice BFF request/response shapes live here as they are introduced (S1+).

export interface HealthResponse {
  status: "ok";
  uptime: number;
}
