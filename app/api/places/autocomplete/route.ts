import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { autocomplete } from "@/lib/google-places";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const predictions = await autocomplete(q);
  return NextResponse.json({ predictions });
}
