import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";
import { updateBookingSchema } from "@/lib/validators";
import { deleteCalendarEvent, isGoogleConfigured } from "@/lib/google";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: { id, calendar: { userId } },
      include: { calendar: { select: { name: true, slug: true } } },
    });
    if (!booking) return error("Not found", 404);
    return json(booking);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: { id, calendar: { userId } },
      include: { calendar: { include: { user: { include: { googleConnection: true } } } } },
    });
    if (!booking) return error("Not found", 404);

    const { status } = updateBookingSchema.parse(await req.json());

    // If cancelling, remove the synced Google event.
    if (
      status === "CANCELLED" &&
      booking.googleEventId &&
      isGoogleConfigured() &&
      booking.calendar.user.googleConnection
    ) {
      await deleteCalendarEvent(
        booking.calendar.user.googleConnection,
        booking.calendar.googleCalendarId ||
          booking.calendar.user.googleConnection.calendarId,
        booking.googleEventId
      );
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status,
        googleEventId: status === "CANCELLED" ? null : booking.googleEventId,
      },
    });
    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}
