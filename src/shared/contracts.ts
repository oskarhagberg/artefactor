// Contracts shared between the Hono BFF and the Svelte client.
// Slice BFF request/response shapes live here as they are introduced (S1+).

export interface HealthResponse {
  status: "ok";
  uptime: number;
}

// S1 — Identity. The current authenticated identity, as returned by the
// protected `GET /api/me` endpoint. `id` is the domain's stable `ownerId`.
export interface MeResponse {
  id: string;
  email: string;
  name: string;
}
