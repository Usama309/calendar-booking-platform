import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-utils";
import { exchangeCodeForConnection, isGoogleConfigured } from "@/lib/google";

export async function GET(req: Request) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${appUrl}/admin/google?error=${encodeURIComponent(oauthError)}`
    );
  }

  const userId = await requireUser();
  if (!userId || !isGoogleConfigured() || !code) {
    return NextResponse.redirect(`${appUrl}/admin/google?error=invalid_request`);
  }

  // CSRF guard: state must match the signed-in user.
  if (state !== userId) {
    return NextResponse.redirect(`${appUrl}/admin/google?error=state_mismatch`);
  }

  try {
    await exchangeCodeForConnection(code, userId);
    return NextResponse.redirect(`${appUrl}/admin/google?connected=1`);
  } catch (err) {
    console.error("Google callback failed:", err);
    return NextResponse.redirect(`${appUrl}/admin/google?error=exchange_failed`);
  }
}
