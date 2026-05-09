"use client";

import { useState, useTransition } from "react";

export function AffirmButton({
  placeId,
  initialCount,
  initialAffirmed,
}: {
  placeId: string;
  initialCount: number;
  initialAffirmed: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [affirmed, setAffirmed] = useState(initialAffirmed);
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);

  const onClick = () => {
    if (pending) return;
    const next = !affirmed;
    setAffirmed(next);
    setCount((c) => c + (next ? 1 : -1));
    setPending(true);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/places/${placeId}/affirm`, {
          method: next ? "POST" : "DELETE",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          affirmed: boolean;
          count: number;
        };
        setAffirmed(data.affirmed);
        setCount(data.count);
      } catch {
        setAffirmed(!next);
        setCount((c) => c + (next ? -1 : 1));
      } finally {
        setPending(false);
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={affirmed}
        className={
          affirmed
            ? "bg-sage hover:bg-sage/90 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-70"
            : "border-rule hover:border-ink/30 hover:bg-paper-deep inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-70"
        }
      >
        <Heart filled={affirmed} />
        {affirmed ? "You feel it too" : "I feel it too"}
      </button>
      <span className="text-ink-soft text-sm">
        {count} {count === 1 ? "person" : "people"}
      </span>
    </div>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
