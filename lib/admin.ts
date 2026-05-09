import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function requireAdmin() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) notFound();

  const [user] = await db
    .select({ id: users.id, isAdmin: users.isAdmin, email: users.email })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (!user || !user.isAdmin) notFound();
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return false;
  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return !!user?.isAdmin;
}
