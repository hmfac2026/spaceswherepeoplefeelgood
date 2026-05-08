import Link from "next/link";

export function AddPlaceFab() {
  return (
    <>
      <Link
        href="/add"
        className="bg-sage hover:bg-sage/90 hidden sm:fixed sm:right-6 sm:bottom-6 sm:z-40 sm:inline-flex sm:items-center sm:gap-2 sm:rounded-full sm:px-5 sm:py-3 sm:text-sm sm:font-medium sm:text-white sm:shadow-lg sm:transition-colors"
      >
        <span aria-hidden>+</span> Add a place
      </Link>
      <Link
        href="/add"
        className="bg-sage hover:bg-sage/90 fixed inset-x-0 bottom-0 z-40 block py-4 text-center text-sm font-medium text-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] sm:hidden"
      >
        + Add a place
      </Link>
    </>
  );
}
