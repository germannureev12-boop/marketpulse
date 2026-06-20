import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { syncAllSources, syncSourceById } from "@/lib/news-ingestion/sync";

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as { sourceId?: number | string };

    if (payload.sourceId) {
      const result = await syncSourceById(Number(payload.sourceId), { force: true });
      revalidatePath("/");
      revalidatePath("/admin/sources");
      return NextResponse.json({ result });
    }

    const result = await syncAllSources({ force: true });
    revalidatePath("/");
    revalidatePath("/admin/sources");
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync news sources." },
      { status: 500 }
    );
  }
}
