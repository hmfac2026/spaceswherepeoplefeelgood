import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { places } from "@/db/schema";
import { categoryFromGoogleTypes } from "@/lib/categories";
import { placeDetails } from "@/lib/google-places";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }

  const details = await placeDetails(placeId);
  if (!details) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [existing] = await db
    .select({ id: places.id, status: places.status })
    .from(places)
    .where(eq(places.googlePlaceId, placeId))
    .limit(1);

  return NextResponse.json({
    placeId: details.placeId,
    name: details.name,
    address: details.address,
    lat: details.lat,
    lng: details.lng,
    photoUrl: details.photoUrl,
    suggestedCategory: categoryFromGoogleTypes(details.types),
    existing: existing
      ? { id: existing.id, status: existing.status }
      : null,
  });
}
