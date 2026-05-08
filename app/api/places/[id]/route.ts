import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { entries, places, users } from "@/db/schema";
import type { PlaceDetail } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [place] = await db
    .select()
    .from(places)
    .where(and(eq(places.id, id), eq(places.status, "live")))
    .limit(1);

  if (!place) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entryRows = await db
    .select({
      id: entries.id,
      specialToYou: entries.specialToYou,
      energy: entries.energy,
      whatToDo: entries.whatToDo,
      createdAt: entries.createdAt,
      displayName: users.displayName,
    })
    .from(entries)
    .innerJoin(users, eq(entries.userId, users.id))
    .where(and(eq(entries.placeId, id), eq(entries.status, "live")))
    .orderBy(asc(entries.createdAt));

  const result: PlaceDetail = {
    id: place.id,
    name: place.name,
    category: place.category,
    lat: Number(place.lat),
    lng: Number(place.lng),
    address: place.address,
    photoUrl: place.photoUrl,
    createdAt: place.createdAt.toISOString(),
    entries: entryRows.map((e) => ({
      id: e.id,
      displayName: e.displayName,
      specialToYou: e.specialToYou,
      energy: e.energy,
      whatToDo: e.whatToDo,
      createdAt: e.createdAt.toISOString(),
    })),
  };

  return NextResponse.json(result);
}
