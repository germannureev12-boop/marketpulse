import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { BreakingNewsTicker } from "@/components/breaking-news-ticker";
import { getBreakingTickerArticles } from "@/lib/data";

const navItems = [
  { label: "Crypto", href: "/category/crypto" },
  { label: "Finance", href: "/category/finance" },
  { label: "Macro", href: "/category/macro" },
  { label: "Markets", href: "/category/markets" },
  { label: "Breaking", href: "/category/breaking" },
  { label: "Admin", href: "/admin" }
];

export async function SiteHeader() {
  noStore();

  const tickerArticles = await getBreakingTickerArticles(6).catch(() => []);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#040a13]/80 backdrop-blur-xl">
      <div className="container-shell py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-2xl font-semibold tracking-[0.2em] text-white">
              MARKETPULSE
            </Link>
            <p className="mt-1 text-sm text-slate-400">
              Financial, crypto, and macro intelligence in one dark dashboard.
            </p>
          </div>
          <nav className="nav-loop" aria-label="Primary">
            <div className="nav-loop-track">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="nav-loop-pill">
                  {item.label}
                </Link>
              ))}
              {navItems.map((item) => (
                <Link
                  key={`${item.href}-ghost`}
                  href={item.href}
                  className="nav-loop-pill"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
        <div className="mt-4">{tickerArticles.length > 0 ? <BreakingNewsTicker articles={tickerArticles} /> : null}</div>
      </div>
    </header>
  );
}
