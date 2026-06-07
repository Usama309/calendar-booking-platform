import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";
import { createBookingSchema } from "@/lib/validators";
import { createBooking, BookingError } from "@/lib/services/booking-service";
import type { Prisma } from "@prisma/client";

// Public: create a booking.
export async function POST(req: Request) {
  try {
    const data = createBookingSchema.parse(await req.json());
    const booking = await createBooking(data);
    return json(booking, 201);
  } catch (err) {
    if (err instanceof BookingError) {
      return error(err.message, err.status);
    }
    return handleError(err);
  }
}

// Admin: list bookings with filters.
export async function GET(req: Request) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get("calendarId");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const email = searchParams.get("email");
    const name = searchParams.get("name");

    const where: Prisma.BookingWhereInput = {
      calendar: { userId },
    };
    if (calendarId) where.calendarId = calendarId;
    if (status && ["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) {
      where.status = status as Prisma.EnumBookingStatusFilter["equals"];
    }
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      where.appointmentDate = new Date(`${date}T00:00:00Z`);
    }
    if (email) where.customerEmail = { contains: email, mode: "insensitive" };
    if (name) where.customerName = { contains: name, mode: "insensitive" };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: { calendar: { select: { name: true, slug: true } } },
      take: 500,
    });
    return json(bookings);
  } catch (err) {
    return handleError(err);
  }
}
