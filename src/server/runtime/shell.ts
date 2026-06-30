// S12 — Host data-context switcher chrome.
//
// The served artefact stays opaque and single-dataset (it only sees
// `localStorage`). Choosing *which* author's data is loaded is a host concern
// handled OUTSIDE the artefact container (DDD artefact-data.md §"Data context").
// So `/a/:slug` returns this thin host shell — a toolbar + an <iframe> that
// loads the artefact itself from `/a/:slug/frame`. Picking an author reloads the
// iframe with `?author=<id>`, which the frame seeds read-only (only the viewer's
// own context is writable, AD5).
//
// The shell is server-rendered (not the Svelte SPA) because `/a/:slug` is the
// shareable link and also serves unauthenticated/public viewers, who never load
// the SPA. The picker is populated client-side from `…/data/authors`, which is
// itself access-matrix gated (AD4).
//
// The toolbar shows the same icon / title / kind as the SPA list view (shared
// `kind-presentation`), plus — for signed-in viewers only — a back button to the
// admin UI. Anonymous (public-link) viewers have no admin UI, so it's hidden.

import type { ArtefactKind } from "../../domain/artefact/kind";
import { kindPresentation } from "../../shared/kind-presentation";

export interface HostShellContext {
  title: string;
  kind: ArtefactKind;
  // ISO-8601 timestamp; rendered as a relative "Updated …" label.
  updatedAt: string;
  // Where the <iframe> loads the artefact from. The switcher appends
  // `?author=<id>` to re-seed another author's context.
  framePath: string;
  // The `…/data/authors` endpoint that populates the picker.
  authorsEndpoint: string;
  // The signed-in viewer, or null. Used to label "your data", to know which
  // listed author is the viewer, and to show the back-to-admin button.
  viewerId: string | null;
  // The artefact owner, so the picker can tag the owner's entry.
  ownerId: string;
  // AH16/S20: whether the artefact persists data (uses localStorage). When
  // false the data-context picker is omitted entirely (and its authors fetch
  // skipped) — there is no data to switch between.
  usesStorage: boolean;
}

export function renderHostShell(ctx: HostShellContext): string {
  const cfg = {
    title: ctx.title,
    viewerId: ctx.viewerId,
    ownerId: ctx.ownerId,
    frameSrc: ctx.framePath,
    authorsEndpoint: ctx.authorsEndpoint,
    usesStorage: ctx.usesStorage,
  };
  // Escape `<` so a title containing "</script>" cannot break out of the tag.
  const cfgJson = JSON.stringify(cfg).replace(/</g, "\\u003c");

  const meta = kindPresentation(ctx.kind);
  const kindIcon = meta.icon
    .map((d) => `<path d="${d}"></path>`)
    .join("");
  const updatedLabel = relativeTime(ctx.updatedAt);
  const subLabel = updatedLabel
    ? `${meta.label} · Updated ${updatedLabel}`
    : meta.label;

  // Signed-in viewers can return to the admin UI (the SPA at "/"); anonymous
  // public-link viewers cannot, so the button is omitted entirely.
  const backButton = ctx.viewerId
    ? `<a class="ae-back" href="/" title="Back to your artefacts" aria-label="Back to your artefacts">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
      </a>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(ctx.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --fg: #09090b; --muted-fg: #71717a; --border: #e9e9ec; --card: #fff;
    --muted: #f4f4f5; --shadow: 0 1px 2px rgba(16,17,18,0.05);
  }
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { display: flex; flex-direction: column; font: 14px/1.4 "Geist", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; color: var(--fg); background: #fff; -webkit-font-smoothing: antialiased; }
  .ae-bar { flex: 0 0 auto; display: flex; align-items: center; gap: .7rem; padding: .5rem .75rem; border-bottom: 1px solid var(--border); background: var(--card); }
  .ae-back { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex: 0 0 auto; border: 1px solid var(--border); border-radius: 8px; background: var(--card); color: var(--fg); text-decoration: none; box-shadow: var(--shadow); }
  .ae-back:hover { background: var(--muted); }
  .ae-id { display: flex; align-items: center; gap: .6rem; min-width: 0; margin-right: auto; }
  .ae-tile { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; flex: 0 0 auto; border-radius: 9px; background: ${meta.tint}; }
  .ae-text { min-width: 0; }
  .ae-title { font-weight: 600; font-size: 14px; letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ae-sub { font-size: 12px; color: var(--muted-fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ae-bar label { color: var(--muted-fg); font-size: 13px; }
  .ae-bar select { font: inherit; font-size: 13px; padding: .3rem .5rem; border: 1px solid var(--border); border-radius: 8px; background: var(--card); max-width: 40vw; color: var(--fg); }
  .ae-ro { display: none; font-size: 12px; font-weight: 600; color: #9a6700; background: #fff8c5; border: 1px solid #eac54f; border-radius: 999px; padding: .1rem .5rem; }
  .ae-ro.show { display: inline; }
  /* The data-context picker is hidden until there is another author to switch
     to (S20); a non-persisting artefact never reveals it. */
  .ae-switch { display: none; align-items: center; gap: .6rem; }
  .ae-switch.show { display: flex; }
  .ae-frame { flex: 1 1 auto; width: 100%; border: 0; }
</style>
</head>
<body>
  <div class="ae-bar">
    ${backButton}
    <div class="ae-id">
      <div class="ae-tile">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${meta.color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${kindIcon}</svg>
      </div>
      <div class="ae-text">
        <div class="ae-title">${escapeHtml(ctx.title)}</div>
        <div class="ae-sub">${escapeHtml(subLabel)}</div>
      </div>
    </div>
    <div class="ae-switch" id="ae-switch">
      <label for="ae-ctx">Data context</label>
      <select id="ae-ctx" aria-label="Data context"></select>
      <span class="ae-ro" id="ae-ro">read-only</span>
    </div>
  </div>
  <iframe class="ae-frame" id="ae-frame" title="Artefact"></iframe>
<script>
(function(){
  var cfg = ${cfgJson};
  var sel = document.getElementById("ae-ctx");
  var ro = document.getElementById("ae-ro");
  var frame = document.getElementById("ae-frame");
  var switcher = document.getElementById("ae-switch");

  function seed(authorId){
    frame.src = authorId ? cfg.frameSrc + "?author=" + encodeURIComponent(authorId) : cfg.frameSrc;
    ro.classList.toggle("show", !!authorId);
  }

  function rel(iso){
    try {
      var d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
      if (s < 60) return "just now";
      if (s < 3600) return Math.floor(s/60) + "m ago";
      if (s < 86400) return Math.floor(s/3600) + "h ago";
      if (s < 2592000) return Math.floor(s/86400) + "d ago";
      return d.toLocaleDateString();
    } catch (e) { return ""; }
  }

  function label(a){
    var who = a.name || a.email || ("Author " + a.authorId.slice(0, 6));
    if (a.email && a.name) who += " (" + a.email + ")";
    var tags = [];
    if (a.authorId === cfg.ownerId) tags.push("owner");
    var suffix = tags.length ? " \\u00b7 " + tags.join(", ") : "";
    return who + suffix + " \\u00b7 " + rel(a.updatedAt);
  }

  // Default context = the viewer's own data (read-write when signed in).
  var def = document.createElement("option");
  def.value = "";
  def.textContent = cfg.viewerId ? "Your data" : "Default";
  sel.appendChild(def);

  // Always seed the default context first so the artefact loads immediately,
  // even if the authors list is empty or fails to load.
  seed("");

  // S20: only fetch authors / reveal the picker for artefacts that persist data
  // (usesStorage). A non-persisting artefact never has a context to switch to.
  if (cfg.usesStorage) {
    fetch(cfg.authorsEndpoint, { credentials: "same-origin" })
      .then(function(r){ return r.ok ? r.json() : { authors: [] }; })
      .then(function(data){
        var others = 0;
        (data.authors || []).forEach(function(a){
          // The viewer's own entry is already covered by the default option.
          if (a.authorId === cfg.viewerId) return;
          var opt = document.createElement("option");
          opt.value = a.authorId;
          opt.textContent = label(a);
          sel.appendChild(opt);
          others++;
        });
        // Reveal the picker only when there is another author to switch to.
        if (others > 0) switcher.classList.add("show");
      })
      .catch(function(){});
  }

  sel.addEventListener("change", function(){ seed(sel.value); });
})();
</script>
</body>
</html>`;
}

// Relative "Updated …" label for the toolbar, computed at render time.
function relativeTime(iso: string): string {
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
