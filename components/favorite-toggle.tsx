"use client";

type FavoriteToggleProps = {
  active: boolean;
  onToggle: () => void;
  title: string;
  compact?: boolean;
};

export function FavoriteToggle({ active, onToggle, title, compact = false }: FavoriteToggleProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      aria-pressed={active}
      title={title}
      className={`inline-flex items-center justify-center rounded-full border transition ${
        compact ? "h-8 w-8" : "h-9 w-9"
      } ${
        active
          ? "border-amber-300/40 bg-amber-300/15 text-amber-200"
          : "border-white/10 bg-white/5 text-slate-400 hover:border-cyan-300/25 hover:text-white"
      }`}
    >
      <span className={`${compact ? "text-sm" : "text-base"} leading-none`}>{"\u2605"}</span>
    </button>
  );
}
