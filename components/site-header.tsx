import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

function PinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z"
      />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="border-rule/60 bg-paper/80 sticky top-0 z-30 flex items-center justify-between border-b px-6 py-4 backdrop-blur">
      <Link
        href="/"
        className="font-serif text-lg tracking-tight hover:opacity-80"
      >
        Spaces Where People Feel Good
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="text-ink-soft hover:text-ink rounded-md px-3 py-1.5 transition-colors">
              Sign in
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserButton
            appearance={{
              elements: { avatarBox: "h-8 w-8" },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Link
                label="Your places"
                labelIcon={<PinIcon />}
                href="/me"
              />
            </UserButton.MenuItems>
          </UserButton>
        </Show>
      </nav>
    </header>
  );
}
