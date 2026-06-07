import { NextResponse } from "next/server";
import { error, requireUser } from "@/lib/api-utils";
import { getAuthUrl, isGoogleConfigured } from "@/lib/google";

export async function GET() {
  const userId = await requireUser();
  if (!userId) return error("Unauthorized", 401);

  if (!isGoogleConfigured()) {
    return error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      503
    );
  }

  // Use the user id as state; verified again in the callback against the session.
  const url = getAuthUrl(userId);
  return NextResponse.redirect(url);
}
