import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";
import { createCalendarSchema } from "@/lib/validators";

export async function GET() {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);

    const calendars = await prisma.calendar.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { bookings: true } } },
    });
    return json(calendars);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);

    const body = await req.json();
    const data = createCalendarSchema.parse(body);

    const calendar = await prisma.calendar.create({
      data: {
        userId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        timezone: data.timezone,
        durationMinutes: data.durationMinutes,
        bufferMinutes: data.bufferMinutes,
        isActive: data.isActive ?? true,
        googleCalendarId: data.googleCalendarId ?? null,
      },
    });
    return json(calendar, 201);
  } catch (err) {
    return handleError(err);
  }
}
