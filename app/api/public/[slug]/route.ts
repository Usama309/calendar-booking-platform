import { prisma } from "@/lib/prisma";
import { json, error, handleError } from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const calendar = await prisma.calendar.findUnique({
      where: { slug },
      select: {
        name: true,
        slug: true,
        description: true,
        timezone: true,
        durationMinutes: true,
        isActive: true,
        availabilityRules: { select: { weekday: true } },
      },
    });

    if (!calendar || !calendar.isActive) {
      return error("Booking page not found", 404);
    }

    const availableWeekdays = Array.from(
      new Set(calendar.availabilityRules.map((r) => r.weekday))
    ).sort();

    return json({
      name: calendar.name,
      slug: calendar.slug,
      description: calendar.description,
      timezone: calendar.timezone,
      durationMinutes: calendar.durationMinutes,
      availableWeekdays,
    });
  } catch (err) {
    return handleError(err);
  }
}
