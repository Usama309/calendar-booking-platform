import { prisma } from "@/lib/prisma";
import { json, error, handleError, requireUser } from "@/lib/api-utils";
import { updateUrgentSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await requireUser();
    if (!userId) return error("Unauthorized", 401);
    const { id } = await params;

    const { status } = updateUrgentSchema.parse(await req.json());
    const updated = await prisma.urgentRequest.update({
      where: { id },
      data: { status },
    });
    return json(updated);
  } catch (err) {
    return handleError(err);
  }
}
