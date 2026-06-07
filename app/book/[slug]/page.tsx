"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  TriangleAlert,
  Clock,
  CalendarDays,
  Globe,
} from "lucide-react";
import { fetchJson } from "@/lib/utils";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { BookingHeader } from "@/components/BookingHeader";

interface PublicCalendar {
  name: string;
  slug: string;
  description: string | null;
  timezone: string;
  durationMinutes: number;
  availableWeekdays: number[];
}
interface Slot {
  startTime: string;
  endTime: string;
  startUtc: string;
  endUtc: string;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function dateStr(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const hr = h % 12 || 12;
  return `${hr}:${pad(m)} ${ap}`;
}
function prettyDate(s: string) {
  const [, m, d] = s.split("-").map(Number);
  return `${WEEKDAY_SHORT[new Date(`${s}T00:00:00Z`).getUTCDay()]}, ${MONTHS[m - 1]} ${d}, ${s.split("-")[0]}`;
}

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showUrgent, setShowUrgent] = useState(false);
  const [confirmed, setConfirmed] = useState<{ date: string; slot: Slot } | null>(
    null
  );

  const todayStr = dateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const calendar = useQuery({
    queryKey: ["public-calendar", slug],
    queryFn: () => fetchJson<PublicCalendar>(`/api/public/${slug}`),
    retry: false,
  });

  const queryClient = useQueryClient();

  // Shared options so on-demand fetches and hover-prefetches share one cache entry.
  const slotsQueryOptions = (date: string) => ({
    queryKey: ["public-slots", slug, date],
    queryFn: () =>
      fetchJson<{ slots: Slot[] }>(`/api/public/${slug}/slots?date=${date}`),
    // Slots rarely change minute-to-minute; revisiting a date is instant (no refetch).
    staleTime: 60_000,
  });

  const slots = useQuery({
    ...slotsQueryOptions(selectedDate ?? ""),
    enabled: !!selectedDate,
    // Keep showing the prior date's slots while the next date loads → no blank flicker.
    placeholderData: keepPreviousData,
  });

  // Warm the cache before the click so selecting the date feels instant.
  const prefetchSlots = (date: string) => {
    queryClient.prefetchQuery(slotsQueryOptions(date));
  };

  const grid = useMemo(() => {
    const firstWeekday = new Date(
      `${dateStr(viewYear, viewMonth, 1)}T00:00:00Z`
    ).getUTCDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const availableWeekdays = calendar.data?.availableWeekdays ?? [];

  function gotoMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  if (calendar.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-[var(--muted)]">Loading…</p>
      </main>
    );
  }
  if (calendar.isError || !calendar.data) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <Card className="p-10 text-center">
          <h1 className="font-display text-2xl font-semibold text-[var(--forest)]">
            Booking page not found
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            This link may be inactive or incorrect.
          </p>
        </Card>
      </main>
    );
  }

  const cal = calendar.data;

  if (confirmed) {
    return (
      <PageShell name={cal.name}>
        <Card className="gold-frame mx-auto max-w-md p-8 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--gold-dark)]">
            <Check className="h-8 w-8" strokeWidth={2} />
          </div>
          <h1 className="font-display mt-5 text-3xl font-bold text-[var(--forest)]">
            Booking confirmed
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Your {cal.name.toLowerCase()} is scheduled.
          </p>
          <div className="mt-6 space-y-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 text-left text-sm">
            <p className="font-display text-lg font-semibold text-[var(--forest)]">
              {cal.name}
            </p>
            <p className="flex items-center gap-2 text-slate-700">
              <CalendarDays className="h-4 w-4 shrink-0 text-[var(--gold-dark)]" strokeWidth={1.75} />
              {prettyDate(confirmed.date)}
            </p>
            <p className="flex items-center gap-2 text-slate-700">
              <Clock className="h-4 w-4 shrink-0 text-[var(--gold-dark)]" strokeWidth={1.75} />
              {timeLabel(confirmed.slot.startTime)} –{" "}
              {timeLabel(confirmed.slot.endTime)}
            </p>
            <p className="flex items-center gap-2 text-[var(--muted)]">
              <Globe className="h-4 w-4 shrink-0 text-[var(--gold-dark)]" strokeWidth={1.75} />
              {cal.timezone}
            </p>
          </div>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => {
              setConfirmed(null);
              setSelectedDate(null);
              setSelectedSlot(null);
            }}
          >
            Book another time
          </Button>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell name={cal.name} description={cal.description} meta={`${cal.durationMinutes} min · Times shown in ${cal.timezone}`}>
      {!selectedSlot ? (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Calendar — 80% */}
          <Card className="gold-frame p-4 sm:p-6 lg:col-span-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => gotoMonth(-1)}
                aria-label="Previous month"
                className="rounded-md p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--forest)]"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <span className="font-display text-lg font-semibold text-[var(--forest)] sm:text-xl">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                onClick={() => gotoMonth(1)}
                aria-label="Next month"
                className="rounded-md p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--forest)]"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] sm:gap-2 sm:text-xs">
              {WEEKDAY_SHORT.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
              {grid.map((d, i) => {
                if (d === null) return <div key={i} />;
                const ds = dateStr(viewYear, viewMonth, d);
                const weekday = new Date(`${ds}T00:00:00Z`).getUTCDay();
                const isPast = ds < todayStr;
                const bookable = !isPast && availableWeekdays.includes(weekday);
                const isSelected = ds === selectedDate;
                return (
                  <button
                    key={i}
                    disabled={!bookable}
                    onClick={() => setSelectedDate(ds)}
                    onMouseEnter={bookable ? () => prefetchSlots(ds) : undefined}
                    onFocus={bookable ? () => prefetchSlots(ds) : undefined}
                    className={
                      "flex h-11 items-center justify-center rounded-lg text-sm font-medium transition-colors sm:h-14 sm:text-base " +
                      (isSelected
                        ? "bg-[var(--gold)] text-[var(--primary-foreground)] shadow-sm"
                        : bookable
                        ? "border border-[var(--border)] text-[var(--forest)] hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]"
                        : "text-slate-300 cursor-not-allowed")
                    }
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Slots — 20% */}
          <div className="lg:col-span-1">
            <Card className="flex h-full flex-col p-5">
              <h2 className="font-display text-base font-semibold text-[var(--forest)]">
                {selectedDate ? prettyDate(selectedDate) : "Select a date"}
              </h2>

              <div
                className={
                  "mt-4 flex-1 space-y-2 overflow-auto transition-opacity " +
                  (selectedDate && slots.isFetching ? "opacity-60" : "opacity-100")
                }
              >
                {!selectedDate && (
                  <p className="text-sm text-[var(--muted)]">
                    Pick an available day.
                  </p>
                )}
                {selectedDate && slots.isLoading && (
                  <p className="text-sm text-[var(--muted)]">Loading…</p>
                )}
                {selectedDate &&
                  !slots.isLoading &&
                  (slots.data?.slots.length ?? 0) === 0 && (
                    <p className="text-sm text-[var(--muted)]">
                      No times available.
                    </p>
                  )}
                {selectedDate &&
                  slots.data?.slots.map((s) => (
                    <button
                      key={s.startUtc}
                      onClick={() => setSelectedSlot(s)}
                      className="block w-full rounded-lg border border-[var(--gold)]/40 px-3 py-2.5 text-center text-sm font-medium text-[var(--forest)] transition-colors hover:bg-[var(--gold)] hover:text-[var(--primary-foreground)]"
                    >
                      {timeLabel(s.startTime)}
                    </button>
                  ))}
              </div>

              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <p className="mb-2 text-xs text-[var(--muted)]">
                  Can&apos;t find a time that works?
                </p>
                <Button
                  variant="forest"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowUrgent(true)}
                >
                  <TriangleAlert className="h-4 w-4" strokeWidth={1.75} />
                  For urgent calls
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <BookingForm
          slug={slug}
          calendarName={cal.name}
          timezone={cal.timezone}
          date={selectedDate!}
          slot={selectedSlot}
          onBack={() => setSelectedSlot(null)}
          onConfirmed={() => {
            setConfirmed({ date: selectedDate!, slot: selectedSlot });
            slots.refetch();
          }}
        />
      )}

      {showUrgent && (
        <UrgentModal slug={slug} onClose={() => setShowUrgent(false)} />
      )}
    </PageShell>
  );
}

function PageShell({
  name,
  description,
  meta,
  children,
}: {
  name: string;
  description?: string | null;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <BookingHeader />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/book"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--gold-dark)] transition-colors hover:text-[var(--forest)]"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            Change calendar
          </Link>
          <div className="mb-6">
            <p className="font-eyebrow text-[11px] text-[var(--gold-dark)]">
              Schedule a Consultation
            </p>
            <h1 className="font-display mt-2 text-3xl text-[var(--forest)] sm:text-4xl">
              {name}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
                {description}
              </p>
            )}
            {meta && (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-[var(--muted)]">
                {meta}
              </p>
            )}
          </div>
          {children}
        </div>
      </main>
    </>
  );
}

function BookingForm({
  slug,
  calendarName,
  timezone,
  date,
  slot,
  onBack,
  onConfirmed,
}: {
  slug: string;
  calendarName: string;
  timezone: string;
  date: string;
  slot: Slot;
  onBack: () => void;
  onConfirmed: () => void;
}) {
  const [customerName, setName] = useState("");
  const [customerEmail, setEmail] = useState("");
  const [customerPhone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          slug,
          date,
          startTime: slot.startTime,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          message: message || null,
        }),
      }),
    onSuccess: onConfirmed,
  });

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
      <Card className="gold-frame h-fit p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--forest)]">
          Appointment summary
        </h2>
        <div className="mt-4 space-y-1.5 text-sm">
          <p className="font-display text-lg font-semibold text-[var(--forest)]">
            {calendarName}
          </p>
          <p className="text-slate-700">{prettyDate(date)}</p>
          <p className="text-slate-700">
            {timeLabel(slot.startTime)} – {timeLabel(slot.endTime)}
          </p>
          <p className="text-[var(--muted)]">{timezone}</p>
        </div>
        <Button variant="ghost" size="sm" className="mt-4" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          Change time
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--forest)]">
          Your details
        </h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div>
            <Label>Full Name *</Label>
            <Input value={customerName} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={customerPhone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {mutation.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {(mutation.error as Error).message}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? "Booking…" : "Confirm Booking"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function UrgentModal({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson("/api/urgent", {
        method: "POST",
        body: JSON.stringify({ slug, firstName, fullName, email, phone }),
      }),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--forest)]/40 p-4"
      onClick={onClose}
    >
      <Card
        className="gold-frame w-full max-w-md p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {mutation.isSuccess ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--gold-dark)]">
              <Check className="h-7 w-7" strokeWidth={2} />
            </div>
            <h2 className="font-display mt-4 text-2xl font-bold text-[var(--forest)]">
              Thank you
            </h2>
            <p className="mt-2 text-[var(--muted)]">
              A team member will get back to you.
            </p>
            <Button className="mt-6" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold-dark)]">
                  <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2} />
                  Urgent Request
                </p>
                <h2 className="font-display mt-1 text-2xl font-bold text-[var(--forest)]">
                  Need to speak sooner?
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface)]"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Leave your details and our team will reach out as soon as possible.
            </p>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <div>
                <Label>First Name *</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {mutation.isError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {(mutation.error as Error).message}
                </p>
              )}

              <Button
                type="submit"
                variant="forest"
                size="lg"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Submitting…" : "Submit Urgent Request"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
