import { describe, it, expect, beforeEach } from "vitest";
import { getFilterId, _resetForTest } from "./gooey";

beforeEach(() => {
  document.body.innerHTML = "";
  _resetForTest();
});

describe("gooey filter pool", () => {
  it("returns a filter ID for a given blur value", () => {
    const id = getFilterId(9);
    expect(id).toBe("sileo-gooey-9");
  });

  it("injects a global SVG element on first call", () => {
    getFilterId(9);
    const svg = document.querySelector("[data-sileo-filters]");
    expect(svg).not.toBeNull();
  });

  it("creates a filter element with correct stdDeviation", () => {
    getFilterId(9);
    const blur = document.querySelector("feGaussianBlur");
    expect(blur?.getAttribute("stdDeviation")).toBe("9");
  });

  it("caches filters — no duplicates for same blur", () => {
    getFilterId(9);
    getFilterId(9);
    const filters = document.querySelectorAll("filter");
    expect(filters).toHaveLength(1);
  });

  it("creates separate filters for different blur values", () => {
    getFilterId(9);
    getFilterId(5);
    const filters = document.querySelectorAll("filter");
    expect(filters).toHaveLength(2);
  });
});
