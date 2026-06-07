"use client";

import { Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Link2, Unplug } from "lucide-react";
import { fetchJson } from "@/lib/utils";
import { Button, Card, Badge } from "@/components/ui";

interface Status {
  configured: boolean;
  connected: boolean;
  connection: { googleEmail: string; calendarId: string } | null;
}

export default function GooglePage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
      <GooglePageInner />
    </Suspense>
  );
}

function GooglePageInner() {
  const qc = useQueryClient();
  const search = useSearchParams();
  const justConnected = search.get("connected") === "1";
  const oauthError = search.get("error");

  const { data, isLoading } = useQuery({
    queryKey: ["google-status"],
    queryFn: () => fetchJson<Status>("/api/google/status"),
  });

  const disconnect = useMutation({
    mutationFn: () =>
      fetchJson("/api/google/disconnect", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["google-status"] }),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--forest)]">
        Google Calendar
      </h1>
      <p className="mt-1 text-slate-500">
        Connect your Google account so busy times block availability and new
        bookings sync automatically.
      </p>

      {justConnected && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Google Calendar connected successfully.
        </p>
      )}
      {oauthError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Connection failed: {oauthError}
        </p>
      )}

      <Card className="mt-6 p-6">
        {isLoading ? (
          <p className="text-slate-500">Loading…</p>
        ) : !data?.configured ? (
          <div>
            <Badge color="amber">Not configured</Badge>
            <p className="mt-3 text-sm text-slate-600">
              Google OAuth credentials are not set. Add{" "}
              <code className="rounded bg-slate-100 px-1">GOOGLE_CLIENT_ID</code>{" "}
              and{" "}
              <code className="rounded bg-slate-100 px-1">
                GOOGLE_CLIENT_SECRET
              </code>{" "}
              to your <code className="rounded bg-slate-100 px-1">.env</code> and
              restart the server. The platform works fully without Google — only
              cross-calendar busy sync stays disabled.
            </p>
          </div>
        ) : data.connected ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge color="green">Connected</Badge>
              <p className="mt-2 text-sm text-slate-700">
                {data.connection?.googleEmail}
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
            >
              <Unplug className="h-4 w-4" strokeWidth={1.75} />
              Disconnect
            </Button>
          </div>
        ) : (
          <div>
            <Badge color="slate">Not connected</Badge>
            <p className="mt-3 mb-4 text-sm text-slate-600">
              Authorize access to your Google Calendar.
            </p>
            <a href="/api/google/connect">
              <Button>
                <Link2 className="h-4 w-4" strokeWidth={1.75} />
                Connect Google Calendar
              </Button>
            </a>
          </div>
        )}
      </Card>
    </div>
  );
}
