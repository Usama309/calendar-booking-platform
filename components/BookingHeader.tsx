import Link from "next/link";

/**
 * Compact booking header (~56px tall) shown on the public booking flow.
 * Kept intentionally slim so the calendar/options stay above the fold.
 */
export function BookingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--forest)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/book"
          className="font-display text-base font-medium tracking-tight text-[var(--background)] transition-colors hover:text-[var(--gold)] sm:text-lg"
        >
          Oregon Wills <span className="text-[var(--gold)]">&amp;</span> Trust
          Planning
        </Link>
        <span className="font-eyebrow hidden text-[10px] text-[var(--gold)] sm:inline">
          By Appointment
        </span>
      </div>
    </header>
  );
}
