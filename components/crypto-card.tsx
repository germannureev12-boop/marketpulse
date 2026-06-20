"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { FavoriteToggle } from "@/components/favorite-toggle";
import { getCryptoPatternRows, getCryptoPatternVariant } from "@/lib/crypto-patterns";
import { useFavorites } from "@/lib/client-favorites";
import type { CryptoRecord } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/utils";

type CryptoCardProps = {
  item: CryptoRecord;
  currency?: "USD" | "RUB";
  usdRubRate?: number | null;
  href: string;
};

export function CryptoCard({ item, currency = "USD", usdRubRate = null, href }: CryptoCardProps) {
  const router = useRouter();
  const { favorites, toggleAsset } = useFavorites();
  const positive = item.change24h >= 0;
  const canShowRub = currency === "RUB" && typeof usdRubRate === "number" && usdRubRate > 0;
  const displayedPrice = canShowRub ? item.price * usdRubRate : item.price;
  const displayedCurrency = canShowRub ? "RUB" : "USD";
  const favorite = favorites.assets.includes(item.symbol.toLowerCase());
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hoveredRef = useRef(false);
  const currentGlowRef = useRef({ x: 180, y: 90 });
  const targetGlowRef = useRef({ x: 180, y: 90 });
  const patternVariant = getCryptoPatternVariant(item.symbol);
  const patternRows = getCryptoPatternRows(item.symbol);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  function animateGlow() {
    const card = cardRef.current;
    if (!card) {
      animationFrameRef.current = null;
      return;
    }

    const current = currentGlowRef.current;
    const target = targetGlowRef.current;
    const nextX = current.x + (target.x - current.x) * 0.28;
    const nextY = current.y + (target.y - current.y) * 0.28;
    currentGlowRef.current = { x: nextX, y: nextY };
    card.style.setProperty("--glow-x", `${nextX}px`);
    card.style.setProperty("--glow-y", `${nextY}px`);

    const deltaX = Math.abs(target.x - nextX);
    const deltaY = Math.abs(target.y - nextY);
    if (hoveredRef.current || deltaX > 0.4 || deltaY > 0.4) {
      animationFrameRef.current = window.requestAnimationFrame(animateGlow);
      return;
    }

    animationFrameRef.current = null;
  }

  function ensureGlowAnimation() {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = window.requestAnimationFrame(animateGlow);
    }
  }

  return (
    <div
      ref={cardRef}
      className="crypto-card panel cursor-pointer p-5 transition duration-300 group-hover:border-cyan-300/35 group-hover:shadow-[0_18px_48px_rgba(16,211,255,0.08)]"
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      onPointerEnter={() => {
        hoveredRef.current = true;
        setHovered(true);
        ensureGlowAnimation();
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
        setHovered(false);
      }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        targetGlowRef.current = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        ensureGlowAnimation();
      }}
    >
      <div className={`crypto-card-glow ${hovered ? "is-active" : ""}`} aria-hidden="true" />
      <div className={`crypto-card-pattern crypto-card-pattern-${patternVariant} ${hovered ? "is-active" : ""}`} aria-hidden="true">
        {patternVariant === "sol" ? (
          <>
            <span className="crypto-card-sol-row">
              <i><b /></i>
              <i><b /></i>
              <i><b /></i>
            </span>
            <span className="crypto-card-sol-row crypto-card-sol-row-offset">
              <i><b /></i>
              <i><b /></i>
              <i><b /></i>
            </span>
            <span className="crypto-card-sol-row">
              <i><b /></i>
              <i><b /></i>
              <i><b /></i>
            </span>
            <span className="crypto-card-sol-row crypto-card-sol-row-offset">
              <i><b /></i>
              <i><b /></i>
              <i><b /></i>
            </span>
          </>
        ) : patternVariant === "eth" ? (
          <>
            <span className="crypto-card-eth-row">
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-lg" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-sm" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-lg" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-sm" />
            </span>
            <span className="crypto-card-eth-row crypto-card-eth-row-offset">
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-sm" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-lg" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-sm" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-lg" />
            </span>
            <span className="crypto-card-eth-row">
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-lg" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-sm" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-lg" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-sm" />
            </span>
            <span className="crypto-card-eth-row crypto-card-eth-row-offset">
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-sm" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-lg" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-sm" />
              <i className="crypto-card-eth-glyph crypto-card-eth-glyph-lg" />
            </span>
          </>
        ) : (
          patternRows.map((row, index) => <span key={`${item.symbol}-${index}`}>{row}</span>)
        )}
      </div>

      <div className="crypto-card-content">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{item.symbol}</p>
            <h3 className="crypto-card-title mt-2 text-xl font-semibold text-white">{item.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`crypto-card-badge rounded-full px-3 py-1 text-sm font-medium ${
                positive ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
              }`}
            >
              {formatPercent(item.change24h)}
            </span>
            <FavoriteToggle
              compact
              active={favorite}
              onToggle={() => toggleAsset(item.symbol.toLowerCase())}
              title={favorite ? `Unpin ${item.symbol}` : `Pin ${item.symbol}`}
            />
          </div>
        </div>

        <p className="crypto-card-price mt-6 text-3xl font-semibold text-white">
          {formatMoney(displayedPrice, displayedCurrency)}
        </p>
        <p className="crypto-card-meta mt-2 text-sm text-slate-400">Market cap {item.marketCap}</p>
      </div>
    </div>
  );
}
