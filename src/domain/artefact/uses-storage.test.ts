import { describe, expect, it } from "vitest";
import { detectUsesStorage, payloadUsesStorage } from "./uses-storage";

// S20 / AH16 — the localStorage-usage heuristic that drives the S12 chrome.
describe("detectUsesStorage", () => {
  it("detects common localStorage access forms", () => {
    expect(detectUsesStorage(`<script>localStorage.setItem('k','v')</script>`)).toBe(true);
    expect(detectUsesStorage(`window.localStorage.getItem('k')`)).toBe(true);
    expect(detectUsesStorage(`globalThis.localStorage`)).toBe(true);
    expect(detectUsesStorage(`localStorage["k"]`)).toBe(true);
  });

  it("is false when there is no storage usage", () => {
    expect(detectUsesStorage(`<h1>static deck</h1>`)).toBe(false);
    expect(detectUsesStorage("")).toBe(false);
  });

  it("does not count sessionStorage (Artefactor does not persist it)", () => {
    expect(detectUsesStorage(`sessionStorage.setItem('k','v')`)).toBe(false);
  });

  it("does not match identifiers that merely contain the word", () => {
    expect(detectUsesStorage(`var localStorageManager = {}`)).toBe(false);
    expect(detectUsesStorage(`myLocalStorage`)).toBe(false);
  });

  it("tolerates a dynamically-constructed access as a (documented) false negative", () => {
    // Acceptable: this only hides host UI, never gates behaviour.
    expect(detectUsesStorage(`window['local'+'Storage']`)).toBe(false);
  });

  it("payloadUsesStorage decodes raw bytes", () => {
    const bytes = new TextEncoder().encode(`<script>localStorage.clear()</script>`);
    expect(payloadUsesStorage(bytes)).toBe(true);
    expect(payloadUsesStorage(new TextEncoder().encode("<p>none</p>"))).toBe(false);
  });
});
