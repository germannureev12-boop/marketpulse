import { NextResponse } from "next/server";

import { getCryptoSnapshots } from "@/lib/data";

export async function GET() {
  const crypto = await getCryptoSnapshots();
  return NextResponse.json({ crypto });
}
