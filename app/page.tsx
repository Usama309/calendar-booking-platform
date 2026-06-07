import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const calendars = await prisma.calendar
    .findMany({
      where: { isActive: true },
      select: { name: true, slug: true, description: true, durationMinutes: true },
      orderBy: { name: "asc" },
      take: 12,
    })
    .catch(() => []);

  return (
    <main className="flex-1">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--forest)]">
            <CalendarDays className="h-5 w-5 text-[var(--gold-dark)]" strokeWidth={1.75} />
            Booking Platform
          </span>
          <Link
            href="/login"
            className="rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--gold-dark)] hover:text-white"
          >
            Admin Login
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-dark)] sm:text-xs">
          Premium Scheduling
        </p>
        <h1 className="font-display mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-[var(--forest)] sm:text-5xl">
          Scheduling that respects your real availability.
        </h1>
        <p className="mt-4 max-w-xl text-base text-[var(--muted)] sm:text-lg">
          Create unlimited booking calendars, define availability and buffers,
          sync with Google Calendar, and let clients book conflict-free.
        </p>

        <div className="mt-14">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
            Public booking pages
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {calendars.length === 0 && (
              <p className="text-[var(--muted)]">
                No active calendars yet. Log in to create one.
              </p>
            )}
            {calendars.map((c) => (
              <Link key={c.slug} href={`/book/${c.slug}`}>
                <Card className="gold-frame h-full p-6 transition-shadow hover:shadow-md">
                  <h3 className="font-display text-lg font-semibold text-[var(--forest)]">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                    {c.description || "Book an appointment"}
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--gold-dark)]">
                    {c.durationMinutes} min · /book/{c.slug}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
