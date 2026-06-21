import { NextResponse } from "next/server";

import { fetchMarketSnapshot, getMarketInterval, isMarketSymbol } from "@/lib/market-data";

export async function GET(_request: Request, context: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await context.params;
  const requestUrl = new URL(_request.url);

  if (!isMarketSymbol(symbol)) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  try {
    const interval = getMarketInterval(requestUrl.searchParams.get("interval"));
    const snapshot = await fetchMarketSnapshot(symbol, interval);
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: "Market feed unavailable" }, { status: 502 });
  }
}
