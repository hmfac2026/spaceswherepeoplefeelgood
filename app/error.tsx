"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        Something went sideways.
      </h1>
      <p className="text-ink-soft mt-6 leading-relaxed">
        Sorry about that. We&apos;ve logged it on our end.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-sage hover:bg-sage/90 mt-10 rounded-md px-5 py-2.5 text-sm font-medium text-white transition-colors"
      >
        Try again
      </button>
    </section>
  );
}
