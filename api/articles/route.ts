import { NextResponse } from "next/server";

import { getArticles } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { articleSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category") ?? undefined;
  const articles = await getArticles(category);
  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const rawPayload = await request.json();
  const parsed = articleSchema.safeParse(rawPayload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid article payload." }, { status: 400 });
  }

  try {
    const created = await prisma.article.create({
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

    return NextResponse.json({ article: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable. The fallback data mode is read-only." }, { status: 503 });
  }
}
