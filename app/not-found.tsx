import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        We can&apos;t find that.
      </h1>
      <p className="text-ink-soft mt-6 leading-relaxed">
        Maybe the page moved, or it was never quite there. The map is still
        where it was.
      </p>
      <Link
        href="/"
        className="text-ink-soft hover:text-ink mt-10 text-sm transition-colors"
      >
        ← Back to map
      </Link>
    </section>
  );
}
