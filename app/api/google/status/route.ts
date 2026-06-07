import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";
import { isGoogleConfigured } from "@/lib/google";

export async function GET() {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);

    const connection = await prisma.googleConnection.findUnique({
      where: { userId },
      select: { googleEmail: true, calendarId: true, createdAt: true },
    });

    return json({
      configured: isGoogleConfigured(),
      connected: Boolean(connection),
      connection,
    });
  } catch (err) {
    return handleError(err);
  }
}
