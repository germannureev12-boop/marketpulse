import { NextResponse } from "next/server";

import { getTodaySummary } from "@/lib/data";

export async function GET() {
  const summary = await getTodaySummary();
  return NextResponse.json({ summary });
}
