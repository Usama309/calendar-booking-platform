import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";
import { createUrgentSchema } from "@/lib/validators";

// Public: submit an urgent / emergency call request.
export async function POST(req: Request) {
  try {
    const data = createUrgentSchema.parse(await req.json());

    let calendarId: string | null = null;
    if (data.slug) {
      const cal = await prisma.calendar.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });
      calendarId = cal?.id ?? null;
    }

    const request = await prisma.urgentRequest.create({
      data: {
        calendarId,
        firstName: data.firstName,
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        note: data.note ?? null,
      },
    });

    return json({ id: request.id, ok: true }, 201);
  } catch (err) {
    return handleError(err);
  }
}

// Admin: list urgent requests.
export async function GET() {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);

    const requests = await prisma.urgentRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { calendar: { select: { name: true } } },
      take: 500,
    });
    return json(requests);
  } catch (err) {
    return handleError(err);
  }
}
