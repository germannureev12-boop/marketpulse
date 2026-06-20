import type { Metadata } from "next";

import "@/app/globals.css";
import { SiteHeader } from "@/components/site-header";
import { startNewsAutoSync } from "@/lib/news-ingestion/scheduler";

export const metadata: Metadata = {
  title: "MarketPulse",
  description: "Financial and crypto news dashboard built with Next.js, Prisma, and PostgreSQL."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  startNewsAutoSync();

  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <div className="container-shell py-8">{children}</div>
      </body>
    </html>
  );
}
