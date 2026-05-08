import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { entries, places, users } from "@/db/schema";
import { categoryColor, categoryLabel } from "@/lib/categories";

export const dynamic = "force-dynamic";

async function getPlace(id: string) {
  const [place] = await db
    .select()
    .from(places)
    .where(and(eq(places.id, id), eq(places.status, "live")))
    .limit(1);

  if (!place) return null;

  const entryRows = await db
    .select({
      id: entries.id,
      specialToYou: entries.specialToYou,
      energy: entries.energy,
      whatToDo: entries.whatToDo,
      createdAt: entries.createdAt,
      displayName: users.displayName,
    })
    .from(entries)
    .innerJoin(users, eq(entries.userId, users.id))
    .where(and(eq(entries.placeId, id), eq(entries.status, "live")))
    .orderBy(asc(entries.createdAt));

  return { place, entries: entryRows };
}

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(d);

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPlace(id);
  if (!data) notFound();

  const { place, entries: entryList } = data;
  const color = categoryColor(place.category);
  const label = categoryLabel(place.category);

  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
      <Link
        href="/#map"
        className="text-ink-soft hover:text-ink mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <span aria-hidden>←</span> Back to map
      </Link>

      <header className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: color }}
            aria-hidden
          />
          <span className="text-ink-soft text-xs tracking-wide uppercase">
            {label}
          </span>
        </div>
        <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          {place.name}
        </h1>
        {place.address && (
          <p className="text-ink-soft mt-3 text-sm">{place.address}</p>
        )}
      </header>

      {place.photoUrl && (
        <div className="bg-paper-deep relative mb-10 aspect-[4/3] w-full overflow-hidden rounded-md">
          <Image
            src={place.photoUrl}
            alt={place.name}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
          />
        </div>
      )}

      {entryList.length === 0 ? (
        <p className="text-ink-soft py-8 text-center text-sm">
          No one has written about this place yet.
        </p>
      ) : (
        <div className="divide-rule/70 divide-y">
          {entryList.map((entry) => (
            <section key={entry.id} className="py-8 first:pt-0">
              <div className="text-ink-soft mb-5 flex items-baseline justify-between text-sm">
                <span className="font-medium">
                  {entry.displayName ?? "Someone"}
                </span>
                <span>{formatDate(entry.createdAt)}</span>
              </div>

              <Question label="What makes this place special to you?">
                {entry.specialToYou}
              </Question>
              <Question label="What gives this place its energy?">
                {entry.energy}
              </Question>
              <Question label="What's one thing a visitor should do or experience here?">
                {entry.whatToDo}
              </Question>
            </section>
          ))}
        </div>
      )}
    </article>
  );
}

function Question({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="text-ink-soft mb-1.5 text-xs tracking-wide uppercase">
        {label}
      </p>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
