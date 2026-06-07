import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ error: message, details: extra }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: err.flatten() },
      { status: 422 }
    );
  }
  // Prisma unique-constraint violation.
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  ) {
    return NextResponse.json(
      { error: "That value must be unique (it already exists)." },
      { status: 409 }
    );
  }
  console.error("Unhandled API error:", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/** Returns the authenticated user id or null. */
export async function requireUser(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
