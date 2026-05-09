import Link from "next/link";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { places } from "@/db/schema";
import { categoryLabel, type CategoryValue } from "@/lib/categories";
import { ModerationActions } from "@/components/moderation-actions";

export const dynamic = "force-dynamic";

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);

export default async function AllPlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const filter =
    sp.status === "pending" || sp.status === "live" || sp.status === "rejected"
      ? sp.status
      : null;

  const rows = await db
    .select({
      id: places.id,
      name: places.name,
      category: places.category,
      status: places.status,
      address: places.address,
      createdAt: places.createdAt,
    })
    .from(places)
    .orderBy(desc(places.createdAt));

  const filtered = filter ? rows.filter((r) => r.status === filter) : rows;

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
      <div className="mb-10 flex items-baseline justify-between">
        <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          All places
        </h1>
        <Link
          href="/admin"
          className="text-ink-soft hover:text-ink text-sm transition-colors"
        >
          ← Queue
        </Link>
      </div>

      <div className="text-ink-soft mb-8 flex gap-4 text-sm">
        <FilterLink current={filter} value={null}>
          All ({rows.length})
        </FilterLink>
        <FilterLink current={filter} value="pending">
          Pending ({rows.filter((r) => r.status === "pending").length})
        </FilterLink>
        <FilterLink current={filter} value="live">
          Live ({rows.filter((r) => r.status === "live").length})
        </FilterLink>
        <FilterLink current={filter} value="rejected">
          Rejected ({rows.filter((r) => r.status === "rejected").length})
        </FilterLink>
      </div>

      <div className="border-rule/60 divide-rule/60 divide-y rounded-md border bg-white">
        {filtered.length === 0 && (
          <p className="text-ink-soft p-6 text-center text-sm">
            Nothing here.
          </p>
        )}
        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {p.status === "live" ? (
                  <Link href={`/place/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                ) : (
                  p.name
                )}
              </p>
              <p className="text-ink-soft mt-0.5 truncate text-xs">
                {categoryLabel(p.category as CategoryValue)} ·{" "}
                {formatDate(p.createdAt)} · {p.status}
              </p>
            </div>
            {p.status !== "rejected" && (
              <ModerationActions
                approveUrl={`/api/admin/places/${p.id}/approve`}
                rejectUrl={`/api/admin/places/${p.id}/reject`}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterLink({
  current,
  value,
  children,
}: {
  current: "pending" | "live" | "rejected" | null;
  value: "pending" | "live" | "rejected" | null;
  children: React.ReactNode;
}) {
  const active = current === value;
  const href = value ? `/admin/places?status=${value}` : "/admin/places";
  return (
    <Link
      href={href}
      className={
        active
          ? "text-ink underline underline-offset-4"
          : "hover:text-ink transition-colors"
      }
    >
      {children}
    </Link>
  );
}
