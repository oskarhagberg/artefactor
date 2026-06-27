import type { ArtefactSummary } from "../../shared/contracts";
import {
  KIND_PRESENTATION,
  KIND_ORDER,
  kindPresentation,
  type KindPresentation,
} from "../../shared/kind-presentation";

export type Visibility = ArtefactSummary["visibility"];

// Per-kind presentation metadata lives in `shared/` so the server-rendered host
// shell reuses the same icon/title/type. Re-exported here under the names the
// client components already use.
export type KindMeta = KindPresentation;
export const KINDS = KIND_PRESENTATION;
export { KIND_ORDER };
export const kindMeta = kindPresentation;

/** Per-visibility presentation metadata. */
export interface VisMeta {
  label: string;
  desc: string;
  icon: string[];
}

export const VIS: Record<Visibility, VisMeta> = {
  private: {
    label: "Private",
    desc: "Only you",
    icon: [
      "M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z",
      "M8 9V6a4 4 0 0 1 8 0v3",
    ],
  },
  authenticated: {
    label: "Members",
    desc: "Any signed-in user",
    icon: [
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
      "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
      "M22 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
    ],
  },
  public: {
    label: "Public",
    desc: "Anyone with the link",
    icon: [
      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
      "M2 12h20",
      "M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20",
    ],
  },
};

export const VIS_ORDER: Visibility[] = ["private", "authenticated", "public"];

/** "254 KB" / "1.2 MB" — matches the design's fmtBytes. */
export function fmtBytes(b: number): string {
  return b >= 1048576
    ? (b / 1048576).toFixed(1) + " MB"
    : Math.round(b / 1024) + " KB";
}

/** Initials from a display name ("Maya Chen" -> "MC"). */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Relative-time label from an ISO-8601 timestamp ("2 days ago"). The design
 *  used pre-baked strings; the real API gives us `updatedAt`/`createdAt`. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 45) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
