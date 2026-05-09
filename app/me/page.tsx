import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { entries, places, users } from "@/db/schema";
import { categoryLabel, type CategoryValue } from "@/lib/categories";
import { DisplayNameForm } from "@/components/display-name-form";

export const dynamic = "force-dynamic";

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);

function statusLabel(s: "pending" | "live" | "rejected") {
  return s === "pending"
    ? "Pending review"
    : s === "live"
      ? "Live"
      : "Not approved";
}

function statusColor(s: "pending" | "live" | "rejected") {
  return s === "live"
    ? "text-sage"
    : s === "rejected"
      ? "text-ink-soft"
      : "text-ink-soft";
}

export default async function MePage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) notFound();

  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (!user) {
    return (
      <section className="mx-auto w-full max-w-xl px-6 py-16 text-center">
        <h1 className="font-serif text-3xl">One moment.</h1>
        <p className="text-ink-soft mt-4">
          We&apos;re still finishing setting up your account. Refresh in a
          second.
        </p>
      </section>
    );
  }

  const contributions = await db
    .select({
      entryId: entries.id,
      entryStatus: entries.status,
      entryCreatedAt: entries.createdAt,
      placeId: places.id,
      placeName: places.name,
      placeStatus: places.status,
      category: places.category,
    })
    .from(entries)
    .innerJoin(places, eq(entries.placeId, places.id))
    .where(eq(entries.userId, user.id))
    .orderBy(desc(entries.createdAt));

  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        Your contributions
      </h1>

      <div className="mt-8">
        <DisplayNameForm initial={user.displayName} />
      </div>

      {contributions.length === 0 ? (
        <p className="text-ink-soft mt-12 leading-relaxed">
          You haven&apos;t added a place yet. When something feels right, come
          back and tell us about it.
        </p>
      ) : (
        <ul className="divide-rule/70 mt-12 divide-y">
          {contributions.map((c) => {
            const status = c.entryStatus;
            const liveAndVisible =
              status === "live" && c.placeStatus === "live";
            const Inner = (
              <div className="flex items-baseline justify-between gap-4 py-5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.placeName}</p>
                  <p className="text-ink-soft mt-0.5 text-xs">
                    {categoryLabel(c.category as CategoryValue)} ·{" "}
                    {formatDate(c.entryCreatedAt)}
                  </p>
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${statusColor(status)}`}
                >
                  {statusLabel(status)}
                </span>
              </div>
            );
            return (
              <li key={c.entryId}>
                {liveAndVisible ? (
                  <Link
                    href={`/place/${c.placeId}`}
                    className="hover:bg-paper-deep/40 -mx-2 block rounded px-2 transition-colors"
                  >
                    {Inner}
                  </Link>
                ) : (
                  <div className="-mx-2 px-2">{Inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
