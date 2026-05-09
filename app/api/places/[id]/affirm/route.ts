import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, count, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { affirmations, places, users } from "@/db/schema";
import { ensureAnonId, readAnonId } from "@/lib/anon-cookie";

async function placeExists(id: string): Promise<boolean> {
  const [row] = await db
    .select({ id: places.id })
    .from(places)
    .where(and(eq(places.id, id), eq(places.status, "live")))
    .limit(1);
  return !!row;
}

async function affirmCount(placeId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(affirmations)
    .where(eq(affirmations.placeId, placeId));
  return Number(row?.n ?? 0);
}

async function resolveUserId(clerkUserId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return row?.id ?? null;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: placeId } = await params;

  if (!(await placeExists(placeId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { userId: clerkUserId } = await auth();

  if (clerkUserId) {
    const userId = await resolveUserId(clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: "User row not yet provisioned" },
        { status: 409 },
      );
    }
    await db
      .insert(affirmations)
      .values({ placeId, userId })
      .onConflictDoNothing();
  } else {
    const cookieStore = await cookies();
    const anonId = ensureAnonId(cookieStore);
    await db
      .insert(affirmations)
      .values({ placeId, anonCookieId: anonId })
      .onConflictDoNothing();
  }

  const total = await affirmCount(placeId);
  return NextResponse.json({ affirmed: true, count: total });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: placeId } = await params;

  const { userId: clerkUserId } = await auth();

  if (clerkUserId) {
    const userId = await resolveUserId(clerkUserId);
    if (!userId) {
      return NextResponse.json({ ok: true });
    }
    await db
      .delete(affirmations)
      .where(
        and(
          eq(affirmations.placeId, placeId),
          eq(affirmations.userId, userId),
          isNotNull(affirmations.userId),
        ),
      );
  } else {
    const cookieStore = await cookies();
    const anonId = readAnonId(cookieStore);
    if (anonId) {
      await db
        .delete(affirmations)
        .where(
          and(
            eq(affirmations.placeId, placeId),
            eq(affirmations.anonCookieId, anonId),
            isNull(affirmations.userId),
            sql`true`,
          ),
        );
    }
  }

  const total = await affirmCount(placeId);
  return NextResponse.json({ affirmed: false, count: total });
}
