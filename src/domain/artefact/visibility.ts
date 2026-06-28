export const VISIBILITIES = [
  "private",
  "selected",
  "authenticated",
  "public",
] as const;

export type Visibility = (typeof VISIBILITIES)[number];

export const STATUSES = ["active", "archived"] as const;

export type Status = (typeof STATUSES)[number];
