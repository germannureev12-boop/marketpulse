import { NextResponse } from "next/server";

import { fallbackCrypto } from "@/lib/fallback-data";
import { fetchLiveCryptoFeed } from "@/lib/integrations/coingecko";

export async function GET() {
  try {
    const feed = await fetchLiveCryptoFeed();
    return NextResponse.json({ ...feed, source: "live" });
  } catch {
    return NextResponse.json({
      crypto: fallbackCrypto,
      source: "fallback",
      provider: "fallback",
      usdRubRate: null,
      fxUpdatedAt: null
    });
  }
}
