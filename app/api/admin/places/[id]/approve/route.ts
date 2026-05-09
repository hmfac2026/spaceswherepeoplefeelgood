import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";
import { db } from "@/db";
import { places, users } from "@/db/schema";
import { sendPlaceLiveEmail } from "@/lib/email";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await params;
  const now = new Date();

  const [updated] = await db
    .update(places)
    .set({ status: "live", approvedAt: now })
    .where(eq(places.id, id))
    .returning({
      id: places.id,
      name: places.name,
      submittedBy: places.submittedBy,
    });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [submitter] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, updated.submittedBy))
    .limit(1);

  if (submitter?.email) {
    await sendPlaceLiveEmail(submitter.email, updated.name, updated.id);
  }

  return NextResponse.json({ ok: true });
}
