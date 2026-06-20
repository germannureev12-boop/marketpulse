import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { articleSchema } from "@/lib/validations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawPayload = await request.json();
  const parsed = articleSchema.safeParse(rawPayload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid article payload." }, { status: 400 });
  }

  try {
    const article = await prisma.article.update({
      where: { id: Number(id) },
      data: {
        ...parsed.data,
        coverImage: parsed.data.coverImage || null,
        externalUrl: parsed.data.externalUrl || null,
        externalId: parsed.data.externalId || null,
        origin: parsed.data.origin ?? "manual",
        isPublished: parsed.data.isPublished ?? true,
        isArchived: parsed.data.isArchived ?? false,
        importanceScore: parsed.data.importanceScore ?? 60,
        publishedAt: new Date(parsed.data.publishedAt),
        fetchedAt: parsed.data.fetchedAt ? new Date(parsed.data.fetchedAt) : null
      },
      include: {
        category: true,
        source: true
      }
    });

    return NextResponse.json({ article });
  } catch {
    return NextResponse.json({ error: "Unable to update article in the current environment." }, { status: 503 });
  }
}
