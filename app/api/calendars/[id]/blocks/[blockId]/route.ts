import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string; blockId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id, blockId } = await params;

    const calendar = await prisma.calendar.findFirst({ where: { id, userId } });
    if (!calendar) return error("Not found", 404);

    await prisma.blockedTime.deleteMany({
      where: { id: blockId, calendarId: id },
    });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
