"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function updateDisplayName(formData: FormData) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: "Not signed in" };

  const raw = formData.get("displayName");
  const value = typeof raw === "string" ? raw.trim() : "";

  if (value.length === 0) {
    return { error: "Tell us what to call you." };
  }
  if (value.length > 60) {
    return { error: "A little shorter, please." };
  }

  await db
    .update(users)
    .set({ displayName: value })
    .where(eq(users.clerkUserId, clerkUserId));

  revalidatePath("/me");
  return { ok: true };
}
