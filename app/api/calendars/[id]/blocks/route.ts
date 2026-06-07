import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";
import { blockedTimeSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id } = await params;

    const calendar = await prisma.calendar.findFirst({ where: { id, userId } });
    if (!calendar) return error("Not found", 404);

    const blocks = await prisma.blockedTime.findMany({
      where: { calendarId: id },
      orderBy: { date: "asc" },
    });
    return json(blocks);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id } = await params;

    const calendar = await prisma.calendar.findFirst({ where: { id, userId } });
    if (!calendar) return error("Not found", 404);

    const data = blockedTimeSchema.parse(await req.json());
    const block = await prisma.blockedTime.create({
      data: {
        calendarId: id,
        date: new Date(`${data.date}T00:00:00Z`),
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        reason: data.reason ?? null,
      },
    });
    return json(block, 201);
  } catch (err) {
    return handleError(err);
  }
}
