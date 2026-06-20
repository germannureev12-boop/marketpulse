"use client";

import Link from "next/link";

import { useFavorites } from "@/lib/client-favorites";

const categories = ["crypto", "finance", "macro", "markets", "breaking"] as const;

type CategoryPillsProps = {
  active?: string;
  compact?: boolean;
  title?: string;
  align?: "start" | "end";
};

export function CategoryPills({ active, compact = false, title, align = "start" }: CategoryPillsProps) {
  const { favorites, toggleCategory } = useFavorites();

  return (
    <div className={`flex min-w-0 flex-col gap-3 ${align === "end" ? "items-start md:items-end" : "items-start"}`}>
      {title ? <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{title}</p> : null}
      <div
        className={`flex min-w-0 gap-2 ${align === "end" ? "justify-start md:justify-end" : "justify-start"} ${
          compact ? "max-w-full flex-nowrap overflow-visible px-2 py-2 md:justify-end" : "flex-wrap"
        }`}
      >
        {categories.map((category) => {
          const favorite = favorites.categories.includes(category);
          const isActive = active === category;

          return (
            <Link
              key={category}
              href={isActive ? "/" : `/category/${category}`}
              onClick={(event) => {
                if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) {
                  return;
                }

                const target = event.target as HTMLElement;
                if (target.closest("[data-favorite-trigger='true']")) {
                  event.preventDefault();
                  toggleCategory(category);
                }
              }}
              className={`group inline-flex items-center gap-2 rounded-full border transition ${
                compact ? "shrink-0 px-3 py-1.5 text-sm" : "px-4 py-2 text-sm"
              } ${
                isActive
                  ? "border-cyan-300 bg-cyan-300 text-slate-950"
                  : favorite
                    ? "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:border-cyan-300/30 hover:text-white"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/30 hover:text-white"
              }`}
            >
              <span className="capitalize">{category}</span>
              <span
                data-favorite-trigger="true"
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] leading-none transition ${
                  isActive
                    ? "border-slate-950/15 bg-slate-950/10 text-slate-900"
                    : favorite
                      ? "border-amber-300/40 bg-amber-300/15 text-amber-200"
                      : "border-white/10 bg-white/5 text-slate-500 group-hover:text-white"
                }`}
                title={favorite ? `Unpin ${category}` : `Pin ${category}`}
              >
                {"\u2605"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
