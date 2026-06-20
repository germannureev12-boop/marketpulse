"use client";

import { useEffect, useState } from "react";

function formatRelativeTime(value: Date | string) {
  const target = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - target.getTime();

  if (!Number.isFinite(diffMs)) {
    return "Awaiting sync";
  }

  if (diffMs < 15_000) {
    return "Updated just now";
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) {
    return `Updated ${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Updated ${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays}d ago`;
}

export function LiveRelativeTime({ value }: { value: Date | string | null }) {
  const [label, setLabel] = useState(() => (value ? formatRelativeTime(value) : "Waiting for first sync"));

  useEffect(() => {
    if (!value) {
      setLabel("Waiting for first sync");
      return;
    }

    setLabel(formatRelativeTime(value));

    const timer = window.setInterval(() => {
      setLabel(formatRelativeTime(value));
    }, 5_000);

    return () => window.clearInterval(timer);
  }, [value]);

  return (
    <span className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
      {label}
    </span>
  );
}
