import { Webhook } from "svix";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sendWelcomeEmail } from "@/lib/email";

type ClerkUserCreated = {
  type: "user.created";
  data: {
    id: string;
    email_addresses: { id: string; email_address: string }[];
    primary_email_address_id: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};

type ClerkEvent = ClerkUserCreated | { type: string; data: unknown };

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET missing at runtime");
    return new Response("Server misconfigured", { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing svix headers", {
      svixId: !!svixId,
      svixTimestamp: !!svixTimestamp,
      svixSignature: !!svixSignature,
    });
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();

  let evt: ClerkEvent;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    console.error("svix verify failed", (err as Error).message);
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    const u = (evt as ClerkUserCreated).data;
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
