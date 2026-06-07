import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";
import { availabilityPayloadSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id } = await params;

    const calendar = await prisma.calendar.findFirst({ where: { id, userId } });
    if (!calendar) return error("Not found", 404);

    const rules = await prisma.availabilityRule.findMany({
      where: { calendarId: id },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
    return json(rules);
  } catch (err) {
    return handleError(err);
  }
}

// Replace all availability rules for the calendar.
export async function PUT(req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id } = await params;

    const calendar = await prisma.calendar.findFirst({ where: { id, userId } });
    if (!calendar) return error("Not found", 404);

    const { rules } = availabilityPayloadSchema.parse(await req.json());

    // Reject windows where end <= start.
    for (const r of rules) {
      if (r.endTime <= r.startTime) {
        return error(
          `Invalid window on weekday ${r.weekday}: end must be after start`,
          422
        );
      }
    }

    await prisma.$transaction([
      prisma.availabilityRule.deleteMany({ where: { calendarId: id } }),
      prisma.availabilityRule.createMany({
        data: rules.map((r) => ({
          calendarId: id,
          weekday: r.weekday,
          startTime: r.startTime,
          endTime: r.endTime,
        })),
      }),
    ]);

    const saved = await prisma.availabilityRule.findMany({
      where: { calendarId: id },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
    return json(saved);
  } catch (err) {
    return handleError(err);
  }
}
