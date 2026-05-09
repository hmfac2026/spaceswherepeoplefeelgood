import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { entries, places, users } from "@/db/schema";
import { CATEGORY_VALUES, type CategoryValue } from "@/lib/categories";
import {
  sendAdminNotification,
  sendSubmissionReceivedEmail,
} from "@/lib/email";
import { placeDetails } from "@/lib/google-places";
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

type SubmitBody = {
  googlePlaceId?: unknown;
  category?: unknown;
  specialToYou?: unknown;
  energy?: unknown;
  whatToDo?: unknown;
};

const MIN_LEN = 20;
const MAX_LEN = 500;

function validateAnswer(s: unknown, field: string): string | { error: string } {
  if (typeof s !== "string") return { error: `${field} required` };
  const trimmed = s.trim();
  if (trimmed.length < MIN_LEN)
    return {
      error: `${field} should be a bit longer (at least ${MIN_LEN} characters)`,
    };
  if (trimmed.length > MAX_LEN)
    return { error: `${field} is too long (max ${MAX_LEN} characters)` };
  return trimmed;
}

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "User row not yet provisioned" },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as SubmitBody;

  if (typeof body.googlePlaceId !== "string" || !body.googlePlaceId) {
    return NextResponse.json(
      { error: "googlePlaceId required" },
      { status: 400 },
    );
  }
  if (
    typeof body.category !== "string" ||
    !CATEGORY_VALUES.includes(body.category as CategoryValue)
  ) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const special = validateAnswer(body.specialToYou, "specialToYou");
  if (typeof special !== "string")
    return NextResponse.json(special, { status: 400 });
  const energy = validateAnswer(body.energy, "energy");
  if (typeof energy !== "string")
    return NextResponse.json(energy, { status: 400 });
  const whatToDo = validateAnswer(body.whatToDo, "whatToDo");
  if (typeof whatToDo !== "string")
    return NextResponse.json(whatToDo, { status: 400 });

  const googlePlaceId = body.googlePlaceId;
  const category = body.category as CategoryValue;

  const [existing] = await db
    .select({ id: places.id, status: places.status })
    .from(places)
    .where(eq(places.googlePlaceId, googlePlaceId))
    .limit(1);

  let placeId: string;
  let placeStatus: "pending" | "live" | "rejected";
  let placeName: string;
  let createdNewPlace = false;

  if (existing) {
    placeId = existing.id;
    placeStatus = existing.status;
    const [row] = await db
      .select({ name: places.name })
      .from(places)
      .where(eq(places.id, existing.id))
      .limit(1);
    placeName = row?.name ?? "this place";
  } else {
    const details = await placeDetails(googlePlaceId);
    if (!details) {
      return NextResponse.json(
        { error: "Could not fetch place details" },
        { status: 400 },
      );
    }

    const [inserted] = await db
      .insert(places)
      .values({
        googlePlaceId: details.placeId,
        name: details.name,
        category,
        lat: details.lat.toFixed(7),
        lng: details.lng.toFixed(7),
        address: details.address,
        photoUrl: details.photoUrl,
        status: "pending",
        submittedBy: user.id,
      })
      .returning({ id: places.id });

    placeId = inserted.id;
    placeStatus = "pending";
    placeName = details.name;
    createdNewPlace = true;
  }

  await db.insert(entries).values({
    placeId,
    userId: user.id,
    specialToYou: special,
    energy,
    whatToDo,
    status: "pending",
  });

  await sendSubmissionReceivedEmail(user.email, {
    placeName,
    specialToYou: special,
    energy,
    whatToDo,
  });

  await sendAdminNotification({
    kind: createdNewPlace ? "new_place" : "new_entry",
    placeName,
    submitter: user.email,
  });

  return NextResponse.json({
    placeId,
    placeStatus,
    createdNewPlace,
  });
}
