import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    const u = evt.data;
    const primaryEmail =
      u.email_addresses.find((e) => e.id === u.primary_email_address_id)
        ?.email_address ?? u.email_addresses[0]?.email_address;

    if (!primaryEmail) {
      return new Response("No email on user", { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const isAdmin = !!adminEmail && primaryEmail.toLowerCase() === adminEmail;

    const displayName =
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || null;

    const inserted = await db
      .insert(users)
      .values({
        clerkUserId: u.id,
        email: primaryEmail,
        displayName,
        isAdmin,
      })
      .onConflictDoNothing({ target: users.clerkUserId })
      .returning({ id: users.id });

    if (inserted.length) {
      await sendWelcomeEmail(primaryEmail);
    }
  }

  return new Response(null, { status: 204 });
}
