import { prisma } from "@/lib/prisma";
import { timeToMinutes, minutesToTime, zonedToUtc } from "@/lib/time";
import { getAvailableSlots } from "./availability-service";
import {
  createCalendarEvent,
  isGoogleConfigured,
} from "@/lib/google";
import type { CreateBookingInput } from "@/lib/validators";

export class BookingError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function createBooking(input: CreateBookingInput) {
  const calendar = await prisma.calendar.findUnique({
    where: { slug: input.slug },
    include: { user: { include: { googleConnection: true } } },
  });

  if (!calendar || !calendar.isActive) {
    throw new BookingError("Calendar not found or inactive", 404);
  }

  const endTime = minutesToTime(
    timeToMinutes(input.startTime) + calendar.durationMinutes
  );
  const startsAt = zonedToUtc(input.date, input.startTime, calendar.timezone);
  const endsAt = zonedToUtc(input.date, endTime, calendar.timezone);

  // Re-validate availability immediately before insert (FR-8 / reliability).
  const availability = await getAvailableSlots(input.slug, input.date);
  if (!availability) throw new BookingError("Calendar not available", 404);
  const stillAvailable = availability.slots.some(
    (s) => s.startTime === input.startTime
  );
  if (!stillAvailable) {
    throw new BookingError(
      "That time slot is no longer available. Please pick another.",
      409
    );
  }

  // Create booking; DB unique constraint guards against concurrent doubles.
  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        calendarId: calendar.id,
        customerName: input.customerName,
        customerEmail: input.customerEmail.toLowerCase(),
        customerPhone: input.customerPhone || null,
        message: input.message || null,
        appointmentDate: new Date(`${input.date}T00:00:00Z`),
        startTime: input.startTime,
        endTime,
        startsAt,
        endsAt,
        timezone: calendar.timezone,
        status: "CONFIRMED",
      },
    });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      throw new BookingError(
        "That time slot was just booked. Please pick another.",
        409
      );
    }
    throw err;
  }

  // Sync to Google Calendar (best-effort).
  const connection = calendar.user.googleConnection;
  if (isGoogleConfigured() && connection) {
    const eventId = await createCalendarEvent(
      connection,
      calendar.googleCalendarId || connection.calendarId,
      {
        summary: `${calendar.name} — ${input.customerName}`,
        description: [
          `Booking via ${calendar.name}`,
          `Name: ${input.customerName}`,
          `Email: ${input.customerEmail}`,
          input.customerPhone ? `Phone: ${input.customerPhone}` : "",
          input.message ? `Message: ${input.message}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        startUtc: startsAt,
        endUtc: endsAt,
        timezone: calendar.timezone,
        attendeeEmail: input.customerEmail,
      }
    );
    if (eventId) {
      booking = await prisma.booking.update({
        where: { id: booking.id },
        data: { googleEventId: eventId },
      });
    }
  }

  return booking;
}
