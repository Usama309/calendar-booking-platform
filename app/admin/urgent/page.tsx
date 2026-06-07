"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, ArrowRight, Phone } from "lucide-react";
import { fetchJson } from "@/lib/utils";
import { Button, Card, Badge } from "@/components/ui";

interface UrgentRow {
  id: string;
  firstName: string;
  fullName: string;
  email: string;
  phone: string;
  note: string | null;
  status: "NEW" | "CONTACTED" | "RESOLVED";
  createdAt: string;
  calendar: { name: string } | null;
}

const NEXT_STATUS: Record<string, "CONTACTED" | "RESOLVED"> = {
  NEW: "CONTACTED",
  CONTACTED: "RESOLVED",
};

export default function UrgentPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["urgent"],
    queryFn: () => fetchJson<UrgentRow[]>("/api/urgent"),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetchJson(`/api/urgent/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["urgent"] }),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--forest)]">
        Urgent Requests
      </h1>
      <p className="mt-1 text-slate-500">
        Emergency call requests submitted when no slot worked for a visitor.
      </p>

      <Card className="mt-6 divide-y">
        {isLoading && <p className="p-6 text-sm text-slate-500">Loading…</p>}
        {!isLoading && data?.length === 0 && (
          <p className="p-6 text-sm text-slate-500">No urgent requests yet.</p>
        )}
        {data?.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">{r.fullName}</p>
                <Badge
                  color={
                    r.status === "RESOLVED"
                      ? "green"
                      : r.status === "CONTACTED"
                      ? "gold"
                      : "amber"
                  }
                >
                  {r.status}
                </Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-[var(--gold-dark)]" strokeWidth={1.75} />
                  {r.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-[var(--gold-dark)]" strokeWidth={1.75} />
                  {r.phone}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                {r.calendar ? `${r.calendar.name} · ` : ""}
                {new Date(r.createdAt).toLocaleString()}
              </p>
              {r.note && (
                <p className="mt-1 text-sm text-slate-500">“{r.note}”</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <a href={`mailto:${r.email}`}>
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                  Email
                </Button>
              </a>
              {NEXT_STATUS[r.status] && (
                <Button
                  size="sm"
                  onClick={() =>
                    update.mutate({ id: r.id, status: NEXT_STATUS[r.status] })
                  }
                >
                  Mark {NEXT_STATUS[r.status].toLowerCase()}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
