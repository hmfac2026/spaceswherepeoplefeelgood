import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, eq } from "drizzle-orm";
import { entries, places, users } from "./schema";
import type { CategoryValue } from "../lib/categories";

type SeedPlace = {
  googlePlaceId: string;
  name: string;
  category: CategoryValue;
  lat: string;
  lng: string;
  address: string;
  photoUrl: string | null;
  entry: { specialToYou: string; energy: string; whatToDo: string };
};

const SEED_USER_EMAIL = "peter@7epi.com";

const seedPlaces: SeedPlace[] = [
  {
    googlePlaceId: "seed_strand_bookstore_nyc",
    name: "Strand Bookstore",
    category: "bookstore",
    lat: "40.7333000",
    lng: "-73.9909000",
    address: "828 Broadway, New York, NY 10003",
    photoUrl: null,
    entry: {
      specialToYou:
        "Eighteen miles of books and a kind of weather inside the building — paper, dust, hush, the weight of other people reading nearby. I always leave with a book I didn't know I needed.",
      energy:
        "Slow, attentive, a little bit democratic. Everyone in the aisles is doing the same searching thing.",
      whatToDo:
        "Go to the rare-book room on the third floor. Take the staircase, not the elevator. Sit on the floor in the fiction stacks for a while.",
    },
  },
  {
    googlePlaceId: "seed_kew_gardens_london",
    name: "Kew Gardens",
    category: "park_nature",
    lat: "51.4787000",
    lng: "-0.2956000",
    address: "Kew, Richmond, London TW9 3AE, United Kingdom",
    photoUrl: null,
    entry: {
      specialToYou:
        "It's the largest collection of living plants in the world and you can still find quiet corners that feel completely your own.",
      energy:
        "Patient. Things grow here on a different time scale and you slow to meet them.",
      whatToDo:
        "Walk the Treetop Walkway at golden hour. Then drink tea in the Pavilion. Come back in a different season and notice what changed.",
    },
  },
  {
    googlePlaceId: "seed_ryoanji_kyoto",
    name: "Ryōan-ji",
    category: "spiritual_site",
    lat: "35.0344000",
    lng: "135.7186000",
    address: "13 Ryoanji Goryonoshitacho, Ukyo Ward, Kyoto, 616-8001, Japan",
    photoUrl: null,
    entry: {
      specialToYou:
        "Fifteen rocks in raked gravel. From any single vantage point you can only see fourteen. The whole place is built around what you can't quite hold.",
      energy:
        "Spacious. Like the rocks are doing the listening, not you.",
      whatToDo:
        "Sit on the wooden veranda overlooking the rock garden. Don't try to count the stones. Let it be longer than feels useful.",
    },
  },
  {
    googlePlaceId: "seed_santeustachio_rome",
    name: "Sant'Eustachio Il Caffè",
    category: "cafe",
    lat: "41.8979000",
    lng: "12.4754000",
    address: "Piazza di S. Eustachio, 82, 00186 Roma RM, Italy",
    photoUrl: null,
    entry: {
      specialToYou:
        "A small marble counter and the best espresso I've had in my life. They make it behind a brass screen so you can't see how — that's part of it.",
      energy:
        "Warm, dense, briefly perfect. Like the city pauses for ninety seconds.",
      whatToDo:
        "Order at the cassa first, then take the receipt to the bar. Stand. Drink. Don't sit down. Walk back into the piazza.",
    },
  },
  {
    googlePlaceId: "seed_hotel_esencia_tulum",
    name: "Hotel Esencia",
    category: "hotel_stay",
    lat: "20.0594000",
    lng: "-87.5475000",
    address: "Carretera Cancún - Tulum Km. 265, Xpu Ha, 77780 Q.R., Mexico",
    photoUrl: null,
    entry: {
      specialToYou:
        "An old estate that became a hotel without ever quite stopping being a home. Soft light, soft staff, the ocean two minutes through the trees.",
      energy:
        "Unhurried in a way that takes a day or two to enter you. By the third morning you've forgotten how to be in a hurry.",
      whatToDo:
        "Walk down to the beach before breakfast. Spend a long afternoon under the palapa with a book. Eat dinner outside, every time.",
    },
  },
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL missing");

  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  const [seedUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SEED_USER_EMAIL))
    .limit(1);

  if (!seedUser) {
    throw new Error(
      `Seed user ${SEED_USER_EMAIL} not found. Sign up first.`,
    );
  }

  const now = new Date();

  for (const p of seedPlaces) {
    const inserted = await db
      .insert(places)
      .values({
        googlePlaceId: p.googlePlaceId,
        name: p.name,
        category: p.category,
        lat: p.lat,
        lng: p.lng,
        address: p.address,
        photoUrl: p.photoUrl,
        status: "live",
        submittedBy: seedUser.id,
        approvedAt: now,
      })
      .onConflictDoNothing({ target: places.googlePlaceId })
      .returning({ id: places.id });

    let placeId: string;
    if (inserted.length) {
      placeId = inserted[0].id;
      console.log("place inserted:", p.name);
    } else {
      const existing = await db
        .select({ id: places.id })
        .from(places)
        .where(eq(places.googlePlaceId, p.googlePlaceId))
        .limit(1);
      placeId = existing[0].id;
      console.log("place exists:", p.name);
    }

    const existingEntry = await db
      .select({ id: entries.id })
      .from(entries)
      .where(
        and(eq(entries.placeId, placeId), eq(entries.userId, seedUser.id)),
      )
      .limit(1);

    if (existingEntry.length === 0) {
      await db.insert(entries).values({
        placeId,
        userId: seedUser.id,
        specialToYou: p.entry.specialToYou,
        energy: p.entry.energy,
        whatToDo: p.entry.whatToDo,
        status: "live",
        approvedAt: now,
      });
      console.log("  entry inserted");
    } else {
      console.log("  entry exists");
    }
  }

  console.log("\nSeed complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
