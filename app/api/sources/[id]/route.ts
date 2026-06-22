
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sourceSchema } from "@/lib/validations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawPayload = await request.json();
  const parsed = sourceSchema.safeParse(rawPayload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid source payload." }, { status: 400 });
  }

  try {
    const source = await prisma.source.update({
      where: { id: Number(id) },
      data: {
        ...parsed.data,
        description: parsed.data.description ?? null,
        kind: parsed.data.kind ?? "manual",
        feedUrl: parsed.data.feedUrl || null,
        categorySlug: parsed.data.categorySlug ?? null,
        priority: parsed.data.priority ?? 100,
        pollIntervalMinutes: parsed.data.pollIntervalMinutes ?? 30,
        isActive: parsed.data.isActive ?? true
      }
    });

    return NextResponse.json({ source });
  } catch {
    return NextResponse.json({ error: "Unable to update source in the current environment." }, { status: 503 });
  }
}
