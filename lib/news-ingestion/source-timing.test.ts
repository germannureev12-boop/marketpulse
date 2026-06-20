import { describe, expect, it } from "vitest";

import { getNextSyncAt, shouldSyncSourceNow } from "./source-timing";

describe("source timing", () => {
  it("marks never-synced sources as due immediately", () => {
    expect(shouldSyncSourceNow(null, 30, new Date("2026-06-21T00:00:00Z"))).toBe(true);
  });

  it("waits until poll interval has elapsed", () => {
    const lastFetchedAt = new Date("2026-06-21T00:00:00Z");
    expect(shouldSyncSourceNow(lastFetchedAt, 30, new Date("2026-06-21T00:20:00Z"))).toBe(false);
    expect(shouldSyncSourceNow(lastFetchedAt, 30, new Date("2026-06-21T00:30:00Z"))).toBe(true);
  });

  it("computes next sync time from last fetch plus interval", () => {
    const next = getNextSyncAt(new Date("2026-06-21T00:00:00Z"), 45);
    expect(next?.toISOString()).toBe("2026-06-21T00:45:00.000Z");
  });
});
