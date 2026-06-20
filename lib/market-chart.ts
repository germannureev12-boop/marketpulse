import type { MarketCandle } from "@/lib/types";

type MarketChartDimensions = {
  width: number;
  priceHeight: number;
  volumeHeight: number;
  gap: number;
};

type ChartCandleShape = {
  x: number;
  wickTop: number;
  wickBottom: number;
  bodyY: number;
  bodyHeight: number;
  bodyWidth: number;
  bullish: boolean;
};

type ChartVolumeShape = {
  x: number;
  y: number;
  width: number;
  height: number;
  bullish: boolean;
};

export function buildMarketChartModel(candles: MarketCandle[], dimensions: MarketChartDimensions) {
  if (candles.length === 0) {
    return { candles: [] as ChartCandleShape[], volumes: [] as ChartVolumeShape[] };
  }

  const { width, priceHeight, volumeHeight, gap } = dimensions;
  const priceValues = candles.flatMap((candle) => [candle.high, candle.low]);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const priceRange = maxPrice - minPrice || 1;
  const maxVolume = Math.max(...candles.map((candle) => candle.volume), 1);
  const step = width / candles.length;
  const bodyWidth = Math.max(6, Math.min(30, step * 0.72));
  const volumeStartY = priceHeight + gap;

  const toPriceY = (price: number) => priceHeight - ((price - minPrice) / priceRange) * priceHeight;

  return {
    candles: candles.map((candle, index) => {
      const centerX = index * step + step / 2;
      const openY = toPriceY(candle.open);
      const closeY = toPriceY(candle.close);

      return {
        x: centerX,
        wickTop: toPriceY(candle.high),
        wickBottom: toPriceY(candle.low),
        bodyY: Math.min(openY, closeY),
        bodyHeight: Math.max(2, Math.abs(openY - closeY)),
        bodyWidth,
        bullish: candle.close >= candle.open
      };
    }),
    volumes: candles.map((candle, index) => {
      const centerX = index * step + step / 2;
      const height = Math.max(6, (candle.volume / maxVolume) * volumeHeight);

      return {
        x: centerX - bodyWidth / 2,
        y: volumeStartY + volumeHeight - height,
        width: bodyWidth,
        height,
        bullish: candle.close >= candle.open
      };
    })
  };
}

export function buildDepthBarWidth(total: number, maxTotal: number) {
  if (maxTotal <= 0 || total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (total / maxTotal) * 100));
}

export function buildDepthBarVisual(side: "ask" | "bid", total: number, maxTotal: number) {
  return {
    width: buildDepthBarWidth(total, maxTotal),
    edge: side === "ask" ? ("left" as const) : ("right" as const),
    flow: side === "ask" ? ("from-left" as const) : ("from-right" as const),
    tone: side === "ask" ? ("rose" as const) : ("emerald" as const)
  };
}

export function buildPriceScaleLabels(candles: MarketCandle[], segments = 4, height = 272) {
  if (candles.length === 0) {
    return [];
  }

  const highs = candles.map((candle) => candle.high);
  const lows = candles.map((candle) => candle.low);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = max - min || 1;

  return Array.from({ length: segments + 1 }, (_, index) => ({
    y: (index / segments) * height,
    value: max - range * (index / segments)
  }));
}

export function buildMovingAverageSeries(candles: MarketCandle[], period: number) {
  if (period <= 0) {
    return candles.map(() => null);
  }

  return candles.map((_, index) => {
    const start = Math.max(0, index - period + 1);
    const window = candles.slice(start, index + 1);
    const sum = window.reduce((total, candle) => total + candle.close, 0);
    return sum / window.length;
  });
}

const visibleWindowByZoom = [160, 128, 96, 72, 56, 40, 28, 20] as const;

export function clampMarketZoom(level: number) {
  return Math.max(0, Math.min(visibleWindowByZoom.length - 1, level));
}

export function getVisibleCandles(candles: MarketCandle[], zoomLevel: number) {
  return getVisibleCandlesWithOffset(candles, zoomLevel, 0);
}

export function clampMarketPanOffset(totalCandles: number, zoomLevel: number, offset: number) {
  const clampedZoom = clampMarketZoom(zoomLevel);
  const visibleWindow = visibleWindowByZoom[clampedZoom];
  const maxOffset = Math.max(0, totalCandles - visibleWindow);
  return Math.max(0, Math.min(maxOffset, offset));
}

export function getMarketPanOffsetFromDrag(
  totalCandles: number,
  zoomLevel: number,
  startOffset: number,
  deltaX: number,
  plotWidth: number,
  visibleCandleCount: number
) {
  const safeVisibleCount = Math.max(visibleCandleCount, 1);
  const stepWidth = plotWidth / safeVisibleCount;
  const candleShift = Math.round((deltaX / stepWidth) * 1.4);
  const nextOffset = startOffset - candleShift;

  return clampMarketPanOffset(totalCandles, zoomLevel, nextOffset);
}

export function getMarketPanOffsetFromZoomAnchor(
  totalCandles: number,
  currentZoomLevel: number,
  nextZoomLevel: number,
  currentOffset: number,
  anchorRatio: number
) {
  const clampedCurrentZoom = clampMarketZoom(currentZoomLevel);
  const clampedNextZoom = clampMarketZoom(nextZoomLevel);
  const currentVisibleWindow = visibleWindowByZoom[clampedCurrentZoom];
  const nextVisibleWindow = visibleWindowByZoom[clampedNextZoom];
  const clampedCurrentOffset = clampMarketPanOffset(totalCandles, clampedCurrentZoom, currentOffset);
  const clampedAnchorRatio = Math.max(0, Math.min(1, anchorRatio));
  const currentEnd = totalCandles - clampedCurrentOffset;
  const currentStart = Math.max(0, currentEnd - currentVisibleWindow);
  const anchorGlobalIndex = Math.round(currentStart + clampedAnchorRatio * Math.max(currentVisibleWindow - 1, 0));
  const nextStart = Math.round(anchorGlobalIndex - clampedAnchorRatio * Math.max(nextVisibleWindow - 1, 0));
  const nextEnd = nextStart + nextVisibleWindow;
  const nextOffset = totalCandles - nextEnd;

  return clampMarketPanOffset(totalCandles, clampedNextZoom, nextOffset);
}

export function getVisibleCandlesWithOffset(candles: MarketCandle[], zoomLevel: number, offset: number) {
  const clampedZoom = clampMarketZoom(zoomLevel);
  const visibleWindow = visibleWindowByZoom[clampedZoom];
  const clampedOffset = clampMarketPanOffset(candles.length, clampedZoom, offset);
  const end = candles.length - clampedOffset;
  const start = Math.max(0, end - visibleWindow);
  return candles.slice(start, end);
}

export function buildTimeScaleLabels(candles: MarketCandle[], segments = 4, width = 900) {
  if (candles.length === 0) {
    return [];
  }

  return Array.from({ length: segments }, (_, index) => {
    const ratio = segments === 1 ? 0 : index / (segments - 1);
    const candleIndex = Math.min(candles.length - 1, Math.round(ratio * (candles.length - 1)));
    const time = candles[candleIndex]?.time ?? candles.at(-1)?.time ?? "";
    return {
      x: ratio * width,
      time
    };
  });
}

export function isPointInsidePlotArea(
  x: number,
  y: number,
  left: number,
  top: number,
  right: number,
  bottom: number
) {
  return x >= left && x <= right && y >= top && y <= bottom;
}
