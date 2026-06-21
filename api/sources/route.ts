import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getSources } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { sourceSchema } from "@/lib/validations";

export async function GET() {
  const sources = await getSources();
  return NextResponse.json({ sources });
}

export async function POST(request: Request) {
  const rawPayload = await request.json();
  const parsed = sourceSchema.safeParse(rawPayload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid source payload." }, { status: 400 });
  }

  try {
    const source = await prisma.source.create({
      data: {
        ...parsed.data,
        description: parsed.data.description ?? null,
        kind: parsed.data.kind ?? "manual",
        feedUrl: parsed.data.feedUrl || null,
        categorySlug: parsed.data.categorySlug ?? null,
        priority: parsed.data.priority ?? 100,
        pollIntervalMinutes: parsed.data.pollIntervalMinutes ?? 30,
        configJson: parsed.data.configJson === null ? Prisma.DbNull : parsed.data.configJson,,
        isActive: parsed.data.isActive ?? true
      }
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable. The fallback data mode is read-only." }, { status: 503 });
  }
}
