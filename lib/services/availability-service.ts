import { prisma } from "@/lib/prisma";
import {
  computeSlots,
  type BusyInterval,
  type Slot,
} from "@/lib/availability";
import { zonedToUtc } from "@/lib/time";
import { getBusyIntervals, isGoogleConfigured } from "@/lib/google";

/**
 * Computes available slots for a public calendar on a given date.
 * Aggregates: availability rules, manual blocks, existing bookings and
 * (when connected) Google Calendar busy times.
 */
export async function getAvailableSlots(
  slug: string,
  dateStr: string
): Promise<{ slots: Slot[]; calendar: { name: string; timezone: string; durationMinutes: number } } | null> {
  const calendar = await prisma.calendar.findUnique({
    where: { slug },
    include: {
      availabilityRules: true,
      user: { include: { googleConnection: true } },
    },
  });

  if (!calendar || !calendar.isActive) return null;

  // Day boundaries as UTC instants (covering the local day).
  const dayStartUtc = zonedToUtc(dateStr, "00:00", calendar.timezone);
  const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000);

  // Independent of each other — run concurrently to halve serial DB round-trips.
  const [blocks, bookings] = await Promise.all([
    prisma.blockedTime.findMany({
      where: {
        calendarId: calendar.id,
        date: new Date(`${dateStr}T00:00:00Z`),
      },
    }),
    prisma.booking.findMany({
      where: {
        calendarId: calendar.id,
        status: { not: "CANCELLED" },
        startsAt: { gte: dayStartUtc, lt: dayEndUtc },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  const busy: BusyInterval[] = bookings.map((b) => ({
    start: b.startsAt,
    end: b.endsAt,
  }));

  // Google busy times (best-effort; failures degrade gracefully).
  const connection = calendar.user.googleConnection;
  if (isGoogleConfigured() && connection) {
    const googleBusy = await getBusyIntervals(
      connection,
      calendar.googleCalendarId || connection.calendarId,
      dayStartUtc,
      dayEndUtc
    );
    busy.push(...googleBusy);
  }

  const slots = computeSlots({
    dateStr,
    timezone: calendar.timezone,
    durationMinutes: calendar.durationMinutes,
    bufferMinutes: calendar.bufferMinutes,
    rules: calendar.availabilityRules,
    blocks: blocks.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
    busy,
  });

  return {
    slots,
    calendar: {
      name: calendar.name,
      timezone: calendar.timezone,
      durationMinutes: calendar.durationMinutes,
    },
  };
}
