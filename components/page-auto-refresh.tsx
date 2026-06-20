"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type PageAutoRefreshProps = {
  intervalMs?: number;
};

export function PageAutoRefresh({ intervalMs = 60_000 }: PageAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, router]);

  return null;
}
