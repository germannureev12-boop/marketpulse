import { describe, expect, it } from "vitest";

import {
  buildDepthBarWidth,
  buildDepthBarVisual,
  buildMarketChartModel,
  getMarketPanOffsetFromDrag,
  getMarketPanOffsetFromZoomAnchor,
  buildMovingAverageSeries,
  buildPriceScaleLabels,
  buildTimeScaleLabels,
  clampMarketPanOffset,
  clampMarketZoom,
  isPointInsidePlotArea,
  getVisibleCandles,
  getVisibleCandlesWithOffset
} from "@/lib/market-chart";
import type { MarketCandle } from "@/lib/types";

describe("buildMarketChartModel", () => {
  it("builds candlesticks and volume bars in separate stacked regions", () => {
    const candles: MarketCandle[] = [
      {
        time: "2026-06-20T00:00:00.000Z",
        open: 100,
        high: 108,
        low: 96,
        close: 104,
        volume: 320
      },
      {
        time: "2026-06-20T00:15:00.000Z",
        open: 104,
        high: 112,
        low: 101,
        close: 109,
        volume: 540
      },
      {
        time: "2026-06-20T00:30:00.000Z",
        open: 109,
        high: 111,
        low: 102,
        close: 103,
        volume: 410
      }
    ];

    const model = buildMarketChartModel(candles, {
      width: 900,
      priceHeight: 300,
      volumeHeight: 110,
      gap: 10
    });

    expect(model.candles).toHaveLength(3);
    expect(model.volumes).toHaveLength(3);
    expect(model.candles[0]?.wickTop).toBeLessThan(model.candles[0]?.wickBottom ?? 0);
    expect(model.candles[0]?.bodyHeight).toBeGreaterThan(0);
    expect(model.volumes[1]?.height).toBeGreaterThan(model.volumes[0]?.height ?? 0);
    expect(model.volumes[0]?.y).toBeGreaterThanOrEqual(310);
  });

  it("scales depth backgrounds by cumulative size", () => {
    expect(buildDepthBarWidth(2, 10)).toBe(20);
    expect(buildDepthBarWidth(10, 10)).toBe(100);
    expect(buildDepthBarWidth(0, 10)).toBe(0);
  });

  it("anchors ask and bid depth bars toward the center from opposite sides", () => {
    expect(buildDepthBarVisual("ask", 6, 10)).toEqual({
      width: 60,
      edge: "left",
      flow: "from-left",
      tone: "rose"
    });
    expect(buildDepthBarVisual("bid", 6, 10)).toEqual({
      width: 60,
      edge: "right",
      flow: "from-right",
      tone: "emerald"
    });
  });

  it("builds descending price scale labels for the chart", () => {
    const candles: MarketCandle[] = [
      { time: "2026-06-20T00:00:00.000Z", open: 100, high: 110, low: 95, close: 104, volume: 320 },
      { time: "2026-06-20T00:15:00.000Z", open: 104, high: 112, low: 101, close: 109, volume: 540 }
    ];

    const labels = buildPriceScaleLabels(candles, 4, 240);

    expect(labels).toHaveLength(5);
    expect(labels[0]?.value).toBe(112);
    expect(labels.at(-1)?.value).toBe(95);
    expect(labels.at(-1)?.y).toBe(240);
  });

  it("clamps zoom level and keeps a deeper chart history available across zoom levels", () => {
    const candles: MarketCandle[] = Array.from({ length: 200 }, (_, index) => ({
      time: `2026-06-20T00:${String(index).padStart(2, "0")}:00.000Z`,
      open: 100 + index,
      high: 101 + index,
      low: 99 + index,
      close: 100.5 + index,
      volume: 100 + index
    }));

    expect(clampMarketZoom(-1)).toBe(0);
    expect(clampMarketZoom(10)).toBe(7);
    expect(getVisibleCandles(candles, 0)).toHaveLength(160);
    expect(getVisibleCandles(candles, 7)).toHaveLength(20);
    expect(getVisibleCandles(candles, 7).at(-1)?.time).toBe(candles.at(-1)?.time);
    expect(getVisibleCandlesWithOffset(candles, 7, 4)[0]?.time).toBe(candles[176]?.time);
    expect(clampMarketPanOffset(candles.length, 7, 400)).toBe(180);
  });

  it("moves deeper into history when the chart is dragged left", () => {
    expect(getMarketPanOffsetFromDrag(240, 3, 0, -180, 900, 72)).toBeGreaterThan(0);
    expect(getMarketPanOffsetFromDrag(240, 3, 12, 180, 900, 72)).toBeLessThan(12);
    expect(getMarketPanOffsetFromDrag(720, 0, 0, -120, 812, 160)).toBe(24);
    expect(getMarketPanOffsetFromDrag(720, 0, 32, 180, 812, 160)).toBe(0);
  });

  it("anchors zoom around the cursor position instead of the latest candle", () => {
    expect(getMarketPanOffsetFromZoomAnchor(200, 3, 4, 0, 0.5)).toBe(7);
    expect(getMarketPanOffsetFromZoomAnchor(200, 3, 4, 20, 0)).toBe(36);
    expect(getMarketPanOffsetFromZoomAnchor(200, 4, 3, 12, 1)).toBe(0);
  });

  it("widens candle bodies when zoomed in and creates bottom time labels", () => {
    const candles: MarketCandle[] = Array.from({ length: 24 }, (_, index) => ({
      time: `2026-06-20T${String(index).padStart(2, "0")}:00:00.000Z`,
      open: 100 + index,
      high: 103 + index,
      low: 98 + index,
      close: 101 + index,
      volume: 120 + index
    }));

    const zoomedOut = buildMarketChartModel(candles, {
      width: 900,
      priceHeight: 300,
      volumeHeight: 110,
      gap: 10
    });
    const zoomedIn = buildMarketChartModel(candles.slice(-12), {
      width: 900,
      priceHeight: 300,
      volumeHeight: 110,
      gap: 10
    });

    const labels = buildTimeScaleLabels(candles.slice(-12), 4, 900);

    expect((zoomedIn.candles[0]?.bodyWidth ?? 0)).toBeGreaterThan(zoomedOut.candles[0]?.bodyWidth ?? 0);
    expect(labels).toHaveLength(4);
    expect(labels[0]?.x).toBeGreaterThanOrEqual(0);
  });

  it("treats only the candle plot region as hover-active", () => {
    expect(isPointInsidePlotArea(100, 120, 14, 10, 812, 366)).toBe(true);
    expect(isPointInsidePlotArea(5, 120, 14, 10, 812, 366)).toBe(false);
    expect(isPointInsidePlotArea(850, 120, 14, 10, 812, 366)).toBe(false);
    expect(isPointInsidePlotArea(120, 390, 14, 10, 812, 366)).toBe(false);
  });

  it("builds moving average values aligned to candle indexes", () => {
    const candles: MarketCandle[] = [
      { time: "2026-06-20T00:00:00.000Z", open: 100, high: 101, low: 99, close: 100, volume: 100 },
      { time: "2026-06-20T00:15:00.000Z", open: 101, high: 102, low: 100, close: 102, volume: 110 },
      { time: "2026-06-20T00:30:00.000Z", open: 102, high: 103, low: 101, close: 104, volume: 120 },
      { time: "2026-06-20T00:45:00.000Z", open: 103, high: 104, low: 102, close: 106, volume: 130 }
    ];

    const series = buildMovingAverageSeries(candles, 3);

    expect(series).toEqual([null, null, 102, 104]);
  });
});
