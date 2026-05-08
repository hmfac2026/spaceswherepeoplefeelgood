import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { places } from "@/db/schema";
import type { PlaceMapItem } from "@/lib/types";

export async function GET() {
  const rows = await db
    .select({
      id: places.id,
      name: places.name,
      category: places.category,
      lat: places.lat,
      lng: places.lng,
    })
    .from(places)
    .where(eq(places.status, "live"));

  const result: PlaceMapItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    lat: Number(r.lat),
    lng: Number(r.lng),
  }));

  return NextResponse.json(result);
}
