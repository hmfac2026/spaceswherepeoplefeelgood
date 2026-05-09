import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";
import { db } from "@/db";
import { entries } from "@/db/schema";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await params;
  const now = new Date();
  await db
    .update(entries)
    .set({ status: "live", approvedAt: now })
    .where(eq(entries.id, id));

  return NextResponse.json({ ok: true });
}
