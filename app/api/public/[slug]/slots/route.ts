import { json, error, handleError } from "@/lib/api-utils";
import { getAvailableSlots } from "@/lib/services/availability-service";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return error("A valid `date` query param (YYYY-MM-DD) is required", 400);
    }

    const result = await getAvailableSlots(slug, date);
    if (!result) return error("Booking page not found", 404);

    return json({
      date,
      timezone: result.calendar.timezone,
      durationMinutes: result.calendar.durationMinutes,
      slots: result.slots,
    });
  } catch (err) {
    return handleError(err);
  }
}
