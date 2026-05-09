import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { entries, places, users } from "@/db/schema";
import { categoryLabel, type CategoryValue } from "@/lib/categories";
import { ModerationActions } from "@/components/moderation-actions";

export const dynamic = "force-dynamic";

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);

export default async function AdminPage() {
  await requireAdmin();

  const pendingPlaces = await db
    .select({
      id: places.id,
      name: places.name,
      address: places.address,
      category: places.category,
      createdAt: places.createdAt,
      submitterEmail: users.email,
      submitterName: users.displayName,
    })
    .from(places)
    .innerJoin(users, eq(places.submittedBy, users.id))
    .where(eq(places.status, "pending"))
    .orderBy(desc(places.createdAt));

  const pendingEntries = await db
    .select({
      id: entries.id,
      specialToYou: entries.specialToYou,
      energy: entries.energy,
      whatToDo: entries.whatToDo,
      createdAt: entries.createdAt,
      placeId: places.id,
      placeName: places.name,
      placeStatus: places.status,
      submitterEmail: users.email,
      submitterName: users.displayName,
    })
    .from(entries)
    .innerJoin(places, eq(entries.placeId, places.id))
    .innerJoin(users, eq(entries.userId, users.id))
    .where(eq(entries.status, "pending"))
    .orderBy(desc(entries.createdAt));

  const submitterCounts = new Map<string, number>();
  if (pendingPlaces.length || pendingEntries.length) {
    const allRows = await db
      .select({ email: users.email, n: count() })
      .from(entries)
      .innerJoin(users, eq(entries.userId, users.id))
      .where(eq(entries.status, "live"))
      .groupBy(users.email);
    allRows.forEach((r) => submitterCounts.set(r.email, Number(r.n)));
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
      <div className="mb-12 flex items-baseline justify-between">
        <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          Moderation
        </h1>
        <Link
          href="/admin/places"
          className="text-ink-soft hover:text-ink text-sm transition-colors"
        >
          All places →
        </Link>
      </div>

      <section className="mb-16">
        <h2 className="text-ink-soft mb-6 text-xs tracking-wide uppercase">
          Pending places ({pendingPlaces.length})
        </h2>
        {pendingPlaces.length === 0 ? (
          <p className="text-ink-soft text-sm">Nothing pending.</p>
        ) : (
          <div className="space-y-6">
            {pendingPlaces.map((p) => (
              <article
                key={p.id}
                className="border-rule/60 rounded-md border bg-white p-6"
              >
                <p className="text-ink-soft mb-1 text-xs">
                  {categoryLabel(p.category as CategoryValue)} ·{" "}
                  {formatDate(p.createdAt)}
                </p>
                <h3 className="font-serif text-xl">{p.name}</h3>
                {p.address && (
                  <p className="text-ink-soft mt-1 text-sm">{p.address}</p>
                )}
                <p className="text-ink-soft mt-4 text-sm">
                  Submitted by{" "}
                  <span className="text-ink">
                    {p.submitterName ?? p.submitterEmail}
                  </span>{" "}
                  ({p.submitterEmail}) · {submitterCounts.get(p.submitterEmail) ?? 0}{" "}
                  approved before
                </p>
                <ModerationActions
                  approveUrl={`/api/admin/places/${p.id}/approve`}
                  rejectUrl={`/api/admin/places/${p.id}/reject`}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-ink-soft mb-6 text-xs tracking-wide uppercase">
          Pending entries ({pendingEntries.length})
        </h2>
        {pendingEntries.length === 0 ? (
          <p className="text-ink-soft text-sm">Nothing pending.</p>
        ) : (
          <div className="space-y-6">
            {pendingEntries.map((e) => (
              <article
                key={e.id}
                className="border-rule/60 rounded-md border bg-white p-6"
              >
                <p className="text-ink-soft mb-1 text-xs">
                  {formatDate(e.createdAt)} · place is {e.placeStatus}
                </p>
                <h3 className="font-serif text-xl">{e.placeName}</h3>
                <p className="text-ink-soft mt-4 text-sm">
                  Submitted by{" "}
                  <span className="text-ink">
                    {e.submitterName ?? e.submitterEmail}
                  </span>{" "}
                  ({e.submitterEmail}) · {submitterCounts.get(e.submitterEmail) ?? 0}{" "}
                  approved before
                </p>
                <div className="mt-5 space-y-4 text-sm">
                  <ReviewBlock label="Special to you">
                    {e.specialToYou}
                  </ReviewBlock>
                  <ReviewBlock label="Energy">{e.energy}</ReviewBlock>
                  <ReviewBlock label="What to do">{e.whatToDo}</ReviewBlock>
                </div>
                <ModerationActions
                  approveUrl={`/api/admin/entries/${e.id}/approve`}
                  rejectUrl={`/api/admin/entries/${e.id}/reject`}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function ReviewBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-ink-soft mb-1 text-xs tracking-wide uppercase">
        {label}
      </p>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
