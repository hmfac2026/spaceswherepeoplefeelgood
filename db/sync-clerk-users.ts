import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "./schema";

type ClerkUser = {
  id: string;
  email_addresses: { id: string; email_address: string }[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
};

async function main() {
  const secret = process.env.CLERK_SECRET_KEY;
  const dbUrl = process.env.DATABASE_URL;
  if (!secret || !dbUrl) throw new Error("Missing CLERK_SECRET_KEY or DATABASE_URL");

  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  const res = await fetch(
    "https://api.clerk.com/v1/users?limit=100&order_by=-created_at",
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const list = (await res.json()) as ClerkUser[];
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  let inserted = 0;
  for (const u of list) {
    const primary =
      u.email_addresses.find((e) => e.id === u.primary_email_address_id)
        ?.email_address ?? u.email_addresses[0]?.email_address;
    if (!primary) continue;

    const displayName =
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || null;
    const isAdmin = !!adminEmail && primary.toLowerCase() === adminEmail;

    const result = await db
      .insert(users)
      .values({
        clerkUserId: u.id,
        email: primary,
        displayName,
        isAdmin,
      })
      .onConflictDoNothing({ target: users.clerkUserId })
      .returning();

    if (result.length) {
      inserted++;
      console.log("inserted:", primary, "admin:", isAdmin);
    } else {
      console.log("already present:", primary);
    }
  }
  console.log(`\nDone. ${inserted} new row(s).`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
