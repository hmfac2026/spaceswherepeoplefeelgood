export function ScrollIndicator() {
  return (
    <div
      aria-hidden
      className="text-ink-soft/70 absolute inset-x-0 bottom-10 flex justify-center"
    >
      <svg
        className="h-6 w-6 animate-[swpfg-bob_2.4s_ease-in-out_infinite]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
