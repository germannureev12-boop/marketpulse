import { describe, expect, it } from "vitest";

import { buildMovingAverageSeries } from "./market-chart";
import type { MarketCandle } from "./types";

function makeCandles(closes: number[]): MarketCandle[] {
  return closes.map((close, index) => ({
    time: `2026-06-21T0${index}:00:00Z`,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 100 + index
  }));
}

describe("buildMovingAverageSeries", () => {
  it("starts from the first candle using the available history", () => {
    const candles = makeCandles([10, 20, 30, 40]);

    expect(buildMovingAverageSeries(candles, 3)).toEqual([10, 15, 20, 30]);
  });

  it("still matches the full-period average once enough candles exist", () => {
    const candles = makeCandles([10, 20, 30, 40, 50]);

    expect(buildMovingAverageSeries(candles, 5)).toEqual([10, 15, 20, 25, 30]);
  });
});
