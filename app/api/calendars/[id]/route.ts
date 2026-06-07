import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";
import { updateCalendarSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

async function ownCalendarOr404(userId: string, id: string) {
  return prisma.calendar.findFirst({ where: { id, userId } });
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id } = await params;

    const calendar = await prisma.calendar.findFirst({
      where: { id, userId },
      include: {
        availabilityRules: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
        blockedTimes: { orderBy: { date: "asc" } },
        _count: { select: { bookings: true } },
      },
    });
    if (!calendar) return error("Not found", 404);
    return json(calendar);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id } = await params;

    const existing = await ownCalendarOr404(userId, id);
    if (!existing) return error("Not found", 404);

    const data = updateCalendarSchema.parse(await req.json());
    const calendar = await prisma.calendar.update({
      where: { id },
      data,
    });
    return json(calendar);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id } = await params;

    const existing = await ownCalendarOr404(userId, id);
    if (!existing) return error("Not found", 404);

    await prisma.calendar.delete({ where: { id } });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
