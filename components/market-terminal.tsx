"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildMarketChartModel,
  buildMovingAverageSeries,
  buildPriceScaleLabels,
  buildTimeScaleLabels,
  clampMarketPanOffset,
  clampMarketZoom,
  getMarketPanOffsetFromDrag,
  getMarketPanOffsetFromZoomAnchor,
  getVisibleCandlesWithOffset,
  isPointInsidePlotArea
} from "@/lib/market-chart";
import type { MarketInterval, MarketOrderLevel, MarketSnapshot, MarketSymbol } from "@/lib/types";
import { formatMoney, formatPercent, formatTime } from "@/lib/utils";

type MarketTerminalProps = {
  initialSymbol: MarketSymbol;
};

const marketIntervals: MarketInterval[] = ["15m", "1h", "4h"];

function formatVolume(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);
}

function buildMovingAveragePath(
  values: Array<number | null>,
  chartCandles: Array<{ x: number }>,
  candles: MarketSnapshot["candles"],
  height: number
) {
  if (values.length < 2 || candles.length === 0) {
    return "";
  }

  const highs = candles.map((candle) => candle.high);
  const lows = candles.map((candle) => candle.low);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = max - min || 1;

  const segments: string[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const average = values[index];
    if (typeof average !== "number") {
      continue;
    }

    const y = height - ((average - min) / range) * height;
    const x = chartCandles[index]?.x;
    if (typeof x !== "number") {
      continue;
    }

    segments.push(`${segments.length === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return segments.join(" ");
}

function TimeframePicker({
  interval,
  onChange
}: {
  interval: MarketInterval;
  onChange: (interval: MarketInterval) => void;
}) {
  return (
    <div className="flex rounded-full border border-slate-700 bg-slate-950/80 p-1">
      {marketIntervals.map((item) => {
        const active = interval === item;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              active ? "bg-cyan-300/15 text-cyan-200" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

function PriceChart({
  snapshot,
  interval,
  onChangeInterval
}: {
  snapshot: MarketSnapshot;
  interval: MarketInterval;
  onChangeInterval: (interval: MarketInterval) => void;
}) {
  const chartWidth = 900;
  const chartHeight = 396;
  const plotLeft = 14;
  const plotTop = 30;
  const rightGutter = 74;
  const bottomGutter = 26;
  const plotWidth = chartWidth - plotLeft - rightGutter;
  const priceHeight = 216;
  const volumeGap = 12;
  const volumeHeight = chartHeight - plotTop - bottomGutter - priceHeight - volumeGap;
  const plotBottom = plotTop + priceHeight + volumeGap + volumeHeight;
  const [zoomLevel, setZoomLevel] = useState(3);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);
  const dragStateRef = useRef<{ startX: number; startOffset: number } | null>(null);
  const visibleCandles = useMemo(
    () => getVisibleCandlesWithOffset(snapshot.candles, zoomLevel, panOffset),
    [snapshot.candles, zoomLevel, panOffset]
  );
  const chart = useMemo(
    () =>
      buildMarketChartModel(visibleCandles, {
        width: plotWidth,
        priceHeight,
        volumeHeight,
        gap: volumeGap
      }),
    [visibleCandles]
  );
  const ma9Series = useMemo(() => buildMovingAverageSeries(visibleCandles, 9), [visibleCandles]);
  const ma21Series = useMemo(() => buildMovingAverageSeries(visibleCandles, 21), [visibleCandles]);
  const ma50Series = useMemo(() => buildMovingAverageSeries(visibleCandles, 50), [visibleCandles]);
  const priceScale = useMemo(() => buildPriceScaleLabels(visibleCandles, 4, priceHeight), [visibleCandles]);
  const timeScale = useMemo(() => buildTimeScaleLabels(visibleCandles, 4, plotWidth), [visibleCandles]);
  const ma9Path = useMemo(() => buildMovingAveragePath(ma9Series, chart.candles, visibleCandles, priceHeight), [ma9Series, chart.candles, visibleCandles]);
  const ma21Path = useMemo(() => buildMovingAveragePath(ma21Series, chart.candles, visibleCandles, priceHeight), [ma21Series, chart.candles, visibleCandles]);
  const ma50Path = useMemo(() => buildMovingAveragePath(ma50Series, chart.candles, visibleCandles, priceHeight), [ma50Series, chart.candles, visibleCandles]);

  const recentHigh = Math.max(...visibleCandles.map((point) => point.high));
  const recentLow = Math.min(...visibleCandles.map((point) => point.low));
  const recentVolume = visibleCandles.at(-1)?.volume ?? 0;
  const activeIndex = hoveredIndex ?? chart.candles.length - 1;
  const activeCandle = chart.candles[activeIndex] ?? null;
  const activeData = visibleCandles[activeIndex] ?? null;
  const activeMa9 = ma9Series[activeIndex];
  const activeMa21 = ma21Series[activeIndex];
  const activeMa50 = ma50Series[activeIndex];
  const activeDelta = activeData ? activeData.close - activeData.open : 0;
  const activeDeltaPct = activeData ? (activeDelta / (activeData.open || 1)) * 100 : 0;
  const currentPriceY =
    activeData && priceScale.length > 0
      ? priceHeight - ((snapshot.stats.lastPrice - recentLow) / ((recentHigh - recentLow) || 1)) * priceHeight
      : null;

  useEffect(() => {
    setHoveredIndex(null);
    setPanOffset((current) => clampMarketPanOffset(snapshot.candles.length, zoomLevel, current));
  }, [snapshot.interval, zoomLevel, snapshot.candles.length]);

  const getPointerPosition = useCallback((clientX: number, clientY: number) => {
  const containerElement = chartContainerRef.current;
  if (!containerElement) {
    return null;
  }

  const bounds = containerElement.getBoundingClientRect();
  const relativeContainerX = clientX - bounds.left;
  const relativeContainerY = clientY - bounds.top;
  const absoluteX = (relativeContainerX / bounds.width) * chartWidth;
  const absoluteY = (relativeContainerY / bounds.height) * chartHeight;
  const insidePlot = isPointInsidePlotArea(
    absoluteX,
    absoluteY,
    plotLeft,
    plotTop,
    plotLeft + plotWidth,
    plotBottom
  );

  if (!insidePlot) {
    return null;
  }

  const relativeX = absoluteX - plotLeft;
  const safeRatio = Math.max(0, Math.min(1, relativeX / plotWidth));
  const nearestIndex = chart.candles.reduce((closestIndex, candle, index, list) => {
    const closest = list[closestIndex];
    return Math.abs(candle.x - relativeX) < Math.abs((closest?.x ?? 0) - relativeX) ? index : closestIndex;
  }, 0);

  return { nearestIndex, anchorRatio: safeRatio };
}, [chart.candles, plotBottom, plotLeft, plotTop, plotWidth]);

  const stopChartDrag = useCallback(() => {
  if (!dragStateRef.current) {
    return;
  }

  dragStateRef.current = null;
  setIsDragging(false);
  document.body.style.userSelect = "";
}, []);

  const handleChartWindowMouseMove = useCallback((event: MouseEvent) => {
  const activeDrag = dragStateRef.current;
  if (!activeDrag) {
    return;
  }

  if ((event.buttons & 1) !== 1) {
    stopChartDrag();
    return;
  }

  event.preventDefault();
  const deltaX = event.clientX - activeDrag.startX;
  setPanOffset(
    getMarketPanOffsetFromDrag(
      snapshot.candles.length,
      zoomLevel,
      activeDrag.startOffset,
      deltaX,
      plotWidth,
      visibleCandles.length
    )
  );
}, [plotWidth, snapshot.candles.length, stopChartDrag, visibleCandles.length, zoomLevel]);

  const handleChartWindowMouseUp = useCallback(() => {
    stopChartDrag();
  });

  const handleNativeChartMouseDown = useCallback((event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }

    if (dragStateRef.current) {
      return;
    }

    if (!getPointerPosition(event.clientX, event.clientY)) {
      return;
    }

    event.preventDefault();
    dragStateRef.current = {
      startX: event.clientX,
      startOffset: panOffset
    };
    setHoveredIndex(null);
    setIsDragging(true);
    document.body.style.userSelect = "none";
  });

  useEffect(() => {
    const containerElement = chartContainerRef.current;
    if (!containerElement) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => handleNativeChartMouseDown(event);

    containerElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleChartWindowMouseMove);
    window.addEventListener("mouseup", handleChartWindowMouseUp);

    return () => {
      containerElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleChartWindowMouseMove);
      window.removeEventListener("mouseup", handleChartWindowMouseUp);
      document.body.style.userSelect = "";
    };
  }, [handleNativeChartMouseDown, handleChartWindowMouseMove, handleChartWindowMouseUp]);

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const interaction = getPointerPosition(event.clientX, event.clientY);

    setZoomLevel((currentZoom) => {
      const nextZoom = clampMarketZoom(currentZoom + (event.deltaY > 0 ? -1 : 1));

      if (nextZoom !== currentZoom) {
        setPanOffset((currentOffset) =>
          getMarketPanOffsetFromZoomAnchor(
            snapshot.candles.length,
            currentZoom,
            nextZoom,
            currentOffset,
            interaction?.anchorRatio ?? 1
          )
        );
      }

      return nextZoom;
    });
  }

  function handlePointerMove(event: React.MouseEvent<SVGSVGElement>) {
    if (dragStateRef.current) {
      return;
    }

    const interaction = getPointerPosition(event.clientX, event.clientY);
    if (!interaction) {
      setHoveredIndex(null);
      return;
    }

    setHoveredIndex(interaction.nearestIndex);
  }

  return (
    <section className="panel flex min-h-0 flex-col overflow-hidden p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">{snapshot.pair}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{snapshot.assetName} market</h2>
        </div>
        <div className="flex items-center gap-3">
          <TimeframePicker interval={interval} onChange={onChangeInterval} />
          <div className="text-right">
            <p className="text-3xl font-semibold text-white">{formatMoney(snapshot.stats.lastPrice)}</p>
            <p className={`mt-1 text-sm ${snapshot.stats.change24h >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {formatPercent(snapshot.stats.change24h)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/8 bg-[#091323] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Recent high</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatMoney(recentHigh)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#091323] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Recent low</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatMoney(recentLow)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#091323] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Zoom</p>
          <p className="mt-2 text-lg font-semibold text-white">{visibleCandles.length} bars</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#091323] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Last bar volume</p>
          <p className="mt-2 text-lg font-semibold text-white">{formatVolume(recentVolume)}</p>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className={`mt-4 flex min-h-0 flex-1 rounded-[1.35rem] border border-white/8 bg-[#091323] p-4 select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ touchAction: "none" }}
        onWheel={handleWheel}
      >
        <svg
          ref={chartSvgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-full min-h-[360px] w-full"
          style={{ touchAction: "none" }}
          onMouseMove={handlePointerMove}
          onMouseLeave={() => {
            if (!dragStateRef.current) {
              setHoveredIndex(null);
            }
          }}
          onDragStart={(event) => event.preventDefault()}
        >
          <defs>
            <filter id="current-candle-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g opacity="0.16">
            {[0, 1, 2, 3].map((line) => (
              <line
                key={line}
                x1={plotLeft}
                x2={plotLeft + plotWidth}
                y1={plotTop + line * (priceHeight / 4)}
                y2={plotTop + line * (priceHeight / 4)}
                stroke="#54d2ff"
                strokeDasharray="6 10"
              />
            ))}
            <line
              x1={plotLeft}
              x2={plotLeft + plotWidth}
              y1={plotTop + priceHeight + volumeGap}
              y2={plotTop + priceHeight + volumeGap}
              stroke="#315577"
              strokeDasharray="4 8"
            />
          </g>

          {priceScale.map((label, index) => (
            <text
              key={`price-scale-${index}`}
              x={chartWidth - 10}
              y={Math.max(plotTop + 8, Math.min(plotTop + priceHeight - 4, plotTop + label.y + 4))}
              textAnchor="end"
              fontSize="11"
              fill="#8da2c0"
              opacity="0.88"
            >
              {label.value.toFixed(2)}
            </text>
          ))}

          {typeof currentPriceY === "number" ? (
            <line
              x1={plotLeft}
              x2={plotLeft + plotWidth}
              y1={Math.max(plotTop, Math.min(plotTop + priceHeight, plotTop + currentPriceY))}
              y2={Math.max(plotTop, Math.min(plotTop + priceHeight, plotTop + currentPriceY))}
              stroke="rgba(255,99,132,0.65)"
              strokeWidth="1.2"
              strokeDasharray="2 5"
            />
          ) : null}

          {timeScale.map((label, index) => (
            <text
              key={`time-scale-${index}`}
              x={Math.max(plotLeft, Math.min(plotLeft + plotWidth, plotLeft + label.x))}
              y={chartHeight - 6}
              textAnchor={index === 0 ? "start" : index === timeScale.length - 1 ? "end" : "middle"}
              fontSize="11"
              fill="#6e86a6"
              opacity="0.92"
            >
              {formatTime(label.time)}
            </text>
          ))}

          {activeCandle ? (
            <>
              <line
                x1={plotLeft + activeCandle.x}
                x2={plotLeft + activeCandle.x}
                y1={plotTop}
                y2={plotBottom}
                stroke="rgba(84,210,255,0.22)"
                strokeWidth="2"
                strokeDasharray="4 8"
              />
              <line
                x1={plotLeft}
                x2={plotLeft + plotWidth}
                y1={plotTop + activeCandle.bodyY + activeCandle.bodyHeight / 2}
                y2={plotTop + activeCandle.bodyY + activeCandle.bodyHeight / 2}
                stroke="rgba(84,210,255,0.14)"
                strokeWidth="1"
                strokeDasharray="4 8"
              />
            </>
          ) : null}

          {activeData ? (
            <g>
              <text x={plotLeft + 4} y={12} fontSize="11" fill="#8da2c0" opacity="0.96">
                <tspan fill="#d7e4f5">{snapshot.pair}</tspan>
                <tspan dx="8" fill="#8da2c0">
                  {interval.toUpperCase()}
                </tspan>
                <tspan dx="8" fill="#8da2c0">
                  {formatTime(activeData.time)}
                </tspan>
              </text>
              <text x={plotLeft + 4} y={26} fontSize="11" fill="#8da2c0" opacity="0.98">
                <tspan>O </tspan>
                <tspan fill="#d7e4f5">{activeData.open.toFixed(2)}</tspan>
                <tspan dx="6">H </tspan>
                <tspan fill="#5ef0a2">{activeData.high.toFixed(2)}</tspan>
                <tspan dx="6">L </tspan>
                <tspan fill="#ff7c90">{activeData.low.toFixed(2)}</tspan>
                <tspan dx="6">C </tspan>
                <tspan fill="#d7e4f5">{activeData.close.toFixed(2)}</tspan>
                <tspan dx="6">Chg </tspan>
                <tspan fill={activeDelta >= 0 ? "#5ef0a2" : "#ff7c90"}>
                  {`${activeDelta >= 0 ? "+" : ""}${activeDelta.toFixed(2)} (${formatPercent(activeDeltaPct)})`}
                </tspan>
                <tspan dx="6">Vol </tspan>
                <tspan fill="#d7e4f5">{formatVolume(activeData.volume)}</tspan>
                {typeof activeMa9 === "number" ? (
                  <>
                    <tspan dx="10">MA9 </tspan>
                    <tspan fill="#ff00ff">{activeMa9.toFixed(2)}</tspan>
                  </>
                ) : null}
                {typeof activeMa21 === "number" ? (
                  <>
                    <tspan dx="8">MA21 </tspan>
                    <tspan fill="#2680ff">{activeMa21.toFixed(2)}</tspan>
                  </>
                ) : null}
                {typeof activeMa50 === "number" ? (
                  <>
                    <tspan dx="8">MA50 </tspan>
                    <tspan fill="#00d26a">{activeMa50.toFixed(2)}</tspan>
                  </>
                ) : null}
              </text>
            </g>
          ) : null}

          {chart.volumes.map((bar, index) => (
            <rect
              key={`volume-${visibleCandles[index]?.time ?? index}`}
              x={plotLeft + bar.x}
              y={plotTop + bar.y}
              width={bar.width}
              height={bar.height}
              rx="1.5"
              fill={bar.bullish ? "rgba(46, 204, 113, 0.45)" : "rgba(255, 107, 129, 0.38)"}
            />
          ))}

          {ma9Path ? <path d={ma9Path} transform={`translate(${plotLeft} ${plotTop})`} fill="none" stroke="#ff00ff" strokeWidth="1.4" opacity="0.95" /> : null}
          {ma21Path ? <path d={ma21Path} transform={`translate(${plotLeft} ${plotTop})`} fill="none" stroke="#2680ff" strokeWidth="1.4" opacity="0.95" /> : null}
          {ma50Path ? <path d={ma50Path} transform={`translate(${plotLeft} ${plotTop})`} fill="none" stroke="#00d26a" strokeWidth="1.35" opacity="0.92" /> : null}

          {chart.candles.map((candle, index) => {
            const isCurrent = index === chart.candles.length - 1;
            const wickStroke = candle.bullish ? "#5ef0a2" : "#ff7c90";
            const bodyFill = candle.bullish ? "#2ecc71" : "#ff6b81";

            return (
              <g key={`candle-${visibleCandles[index]?.time ?? index}`} filter={isCurrent ? "url(#current-candle-glow)" : undefined}>
                <line
                  x1={plotLeft + candle.x}
                  x2={plotLeft + candle.x}
                  y1={plotTop + candle.wickTop}
                  y2={plotTop + candle.wickBottom}
                  stroke={wickStroke}
                  strokeWidth={isCurrent ? "2.6" : "2"}
                  strokeLinecap="round"
                  opacity={isCurrent ? 1 : 0.92}
                />
                <rect
                  x={plotLeft + candle.x - candle.bodyWidth / 2}
                  y={plotTop + candle.bodyY}
                  width={candle.bodyWidth}
                  height={candle.bodyHeight}
                  rx="2"
                  fill={bodyFill}
                  opacity={isCurrent ? 1 : 0.88}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function DepthRow({
  level,
  side
}: {
  level: MarketOrderLevel;
  side: "ask" | "bid";
}) {
  const isAsk = side === "ask";

  return (
    <div className="grid grid-cols-3 gap-3 px-0.5 py-0.5 text-sm">
      <span className={isAsk ? "text-rose-400" : "text-emerald-400"}>{level.price.toFixed(2)}</span>
      <span className="text-right text-slate-200">{level.quantity.toFixed(6)}</span>
      <span className="text-right text-slate-300">{level.total.toFixed(6)}</span>
    </div>
  );
}

function OrderBook({ snapshot }: { snapshot: MarketSnapshot }) {
  const askScrollRef = useRef<HTMLDivElement | null>(null);
  const bidScrollRef = useRef<HTMLDivElement | null>(null);

  function handleBookWheel(event: React.WheelEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    if (!element) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    element.scrollTop += event.deltaY;
  }

  return (
    <aside className="panel flex min-h-0 flex-1 flex-col overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Order book</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Depth + stats</h2>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
          Binance
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/8 bg-[#091323] px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h high</p>
          <p className="mt-2 text-base font-semibold text-white">{formatMoney(snapshot.stats.high24h)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#091323] px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h low</p>
          <p className="mt-2 text-base font-semibold text-white">{formatMoney(snapshot.stats.low24h)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#091323] px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Base vol</p>
          <p className="mt-2 text-base font-semibold text-white">{formatVolume(snapshot.stats.baseVolume24h)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#091323] px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Quote vol</p>
          <p className="mt-2 text-base font-semibold text-white">${formatVolume(snapshot.stats.quoteVolume24h)}</p>
        </div>
      </div>

      <div className="my-6 border-y border-white/8 py-3 text-center text-[2rem] font-semibold tracking-tight text-emerald-400">
        {formatMoney(snapshot.stats.lastPrice)}
      </div>

      <div
        className="relative mt-1 grid min-h-0 flex-1 gap-4 lg:grid-cols-2"
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-white/8 lg:block" aria-hidden="true" />

        <section className="flex min-h-0 flex-col rounded-2xl border border-rose-400/12 bg-rose-500/[0.03] p-3">
          <div className="mb-3 flex items-center justify-between border-b border-rose-400/10 pb-2">
            <span className="text-xs uppercase tracking-[0.18em] text-rose-300">Sellers</span>
            <span className="text-xs uppercase tracking-[0.18em] text-rose-200/80">Asks</span>
          </div>
          <div className="mb-2 grid grid-cols-3 gap-3 text-[11px] text-slate-500">
            <span>Price (USDT)</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Total</span>
          </div>
          <div
            ref={askScrollRef}
            className="orderbook-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
            onWheel={handleBookWheel}
          >
            <div className="space-y-0.5">
              {snapshot.asks
                .slice()
                .reverse()
                .map((level) => (
                  <DepthRow key={`ask-${level.price}`} level={level} side="ask" />
                ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl border border-emerald-400/14 bg-emerald-500/[0.03] p-3">
          <div className="mb-3 flex items-center justify-between border-b border-emerald-400/10 pb-2">
            <span className="text-xs uppercase tracking-[0.18em] text-emerald-300">Buyers</span>
            <span className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Bids</span>
          </div>
          <div className="mb-2 grid grid-cols-3 gap-3 text-[11px] text-slate-500">
            <span>Price (USDT)</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Total</span>
          </div>
          <div
            ref={bidScrollRef}
            className="orderbook-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
            onWheel={handleBookWheel}
          >
            <div className="space-y-0.5">
              {snapshot.bids.map((level) => (
                <DepthRow key={`bid-${level.price}`} level={level} side="bid" />
              ))}
            </div>
          </div>
        </section>
      </div>

      <p className="mt-auto pt-4 text-right text-sm text-slate-400">
        Updated {formatTime(snapshot.updatedAt)} | {snapshot.interval}
      </p>
    </aside>
  );
}

export function MarketTerminal({ initialSymbol }: MarketTerminalProps) {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<MarketInterval>("15m");

  const refreshSnapshot = useCallback(async () => {
    try {
      const response = await fetch(`/api/markets/${initialSymbol}?interval=${interval}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Market feed unavailable");
      }

      const data = (await response.json()) as MarketSnapshot;
      startTransition(() => {
        setSnapshot(data);
        setError(null);
      });
    } catch {
      startTransition(() => {
        setError("Live market feed is temporarily unavailable.");
      });
    }
  });

  useEffect(() => {
    void refreshSnapshot();
    const intervalId = window.setInterval(() => {
      void refreshSnapshot();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [interval, refreshSnapshot]);

  if (error && !snapshot) {
    return <div className="panel p-8 text-slate-300">{error}</div>;
  }

  if (!snapshot) {
    return <div className="panel p-8 text-slate-300">Loading market terminal...</div>;
  }

  return (
    <div className="space-y-4 xl:flex xl:h-full xl:min-h-0 xl:flex-col">
      {error ? <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{error}</div> : null}
      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[1.58fr_0.82fr]">
        <PriceChart snapshot={snapshot} interval={interval} onChangeInterval={setInterval} />
        <OrderBook snapshot={snapshot} />
      </div>
    </div>
  );
}
