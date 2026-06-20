import { describe, expect, it } from "vitest";

import { getAutoSyncIntervalMs, shouldEnableAutoSync } from "./scheduler";

describe("news auto-sync scheduler config", () => {
  it("enables auto sync by default", () => {
    expect(shouldEnableAutoSync(undefined)).toBe(true);
    expect(shouldEnableAutoSync("true")).toBe(true);
  });

  it("allows disabling auto sync explicitly", () => {
    expect(shouldEnableAutoSync("false")).toBe(false);
    expect(shouldEnableAutoSync("0")).toBe(false);
  });

  it("uses a sane default interval and clamps very small values", () => {
    expect(getAutoSyncIntervalMs(undefined)).toBe(15 * 60 * 1000);
    expect(getAutoSyncIntervalMs("1")).toBe(5 * 60 * 1000);
    expect(getAutoSyncIntervalMs("30")).toBe(30 * 60 * 1000);
  });
});
