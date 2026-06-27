/** Global single-overlay coordinator. Only one transient overlay (a sort menu,
 *  the account menu, a card's ⋯ menu, or a card's visibility picker) is open at
 *  a time, with a shared click-away. Mirrors the design's central `menuOpen` /
 *  `visOpen` / `sortOpen` / `accountOpen` state, but keyed by a single string so
 *  any component can read/close it without prop drilling.
 *
 *  Keys: "sort" | "account" | `menu:${id}` | `vis:${id}`. */
let key = $state<string | null>(null);

export const overlay = {
  get key() {
    return key;
  },
  get any() {
    return key !== null;
  },
  isOpen(k: string) {
    return key === k;
  },
  toggle(k: string) {
    key = key === k ? null : k;
  },
  open(k: string) {
    key = k;
  },
  close() {
    key = null;
  },
};
