import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";

export async function POST() {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);

    await prisma.googleConnection.deleteMany({ where: { userId } });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
