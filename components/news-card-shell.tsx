"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import clsx from "clsx";

type NewsCardShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  patternText: string;
  variant?: "article" | "featured" | "summary";
};

function buildPatternRows(patternText: string) {
  const label = patternText.trim().toUpperCase() || "MARKET";
  const row = `${label} // ${label} // ${label} // ${label}`;
  return Array.from({ length: 5 }, () => row);
}

export function NewsCardShell({
  children,
  className,
  contentClassName,
  patternText,
  variant = "article"
}: NewsCardShellProps) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hoveredRef = useRef(false);
  const currentGlowRef = useRef({ x: 180, y: 90 });
  const targetGlowRef = useRef({ x: 180, y: 90 });
  const patternRows = buildPatternRows(patternText);

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
    const nextX = current.x + (target.x - current.x) * 0.24;
    const nextY = current.y + (target.y - current.y) * 0.24;
    currentGlowRef.current = { x: nextX, y: nextY };
    card.style.setProperty("--news-glow-x", `${nextX}px`);
    card.style.setProperty("--news-glow-y", `${nextY}px`);

    const deltaX = Math.abs(target.x - nextX);
    const deltaY = Math.abs(target.y - nextY);
    if (hoveredRef.current || deltaX > 0.45 || deltaY > 0.45) {
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
      className={clsx("news-card panel", `news-card-${variant}`, className)}
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
      <div className={clsx("news-card-glow", hovered && "is-active")} aria-hidden="true" />
      <div className={clsx("news-card-pattern", hovered && "is-active")} aria-hidden="true">
        {patternRows.map((row, index) => (
          <span key={`${patternText}-${index}`}>{row}</span>
        ))}
      </div>
      <div className={clsx("news-card-content", contentClassName)}>{children}</div>
    </div>
  );
}
