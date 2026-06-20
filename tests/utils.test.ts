import { describe, expect, it } from "vitest";

import { formatPercent, slugify } from "@/lib/utils";

describe("slugify", () => {
  it("creates clean slugs from article titles", () => {
    expect(slugify("Bitcoin Holds Above Key Support")).toBe("bitcoin-holds-above-key-support");
  });
});

describe("formatPercent", () => {
  it("adds a plus sign to positive values", () => {
    expect(formatPercent(2.54)).toBe("+2.54%");
  });
});
