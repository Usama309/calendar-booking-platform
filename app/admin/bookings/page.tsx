"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { fetchJson } from "@/lib/utils";
import { Button, Card, Input, Select, Badge } from "@/components/ui";

interface BookingRow {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  message: string | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  status: string;
  googleEventId: string | null;
  calendar: { name: string; slug: string };
}
interface CalendarRow {
  id: string;
  name: string;
}

export default function BookingsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    calendarId: "",
    status: "",
    date: "",
    email: "",
    name: "",
  });

  const calendars = useQuery({
    queryKey: ["calendars"],
    queryFn: () => fetchJson<CalendarRow[]>("/api/calendars"),
  });

  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][]
  ).toString();

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", params],
    queryFn: () => fetchJson<BookingRow[]>(`/api/bookings?${params}`),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetchJson(`/api/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--forest)]">
        Bookings
      </h1>
      <p className="mt-1 text-slate-500">View and manage all appointments.</p>

      <Card className="mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            value={filters.calendarId}
            onChange={(e) =>
              setFilters({ ...filters, calendarId: e.target.value })
            }
          >
            <option value="">All calendars</option>
            {calendars.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
          <Input
            placeholder="Filter by email"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          />
          <Input
            placeholder="Filter by name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>
      </Card>

      <Card className="mt-6 divide-y">
        {isLoading && <p className="p-6 text-sm text-slate-500">Loading…</p>}
        {!isLoading && data?.length === 0 && (
          <p className="p-6 text-sm text-slate-500">No bookings match.</p>
        )}
        {data?.map((b) => (
          <div
            key={b.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">{b.customerName}</p>
                <Badge
                  color={
                    b.status === "CONFIRMED"
                      ? "green"
                      : b.status === "CANCELLED"
                      ? "red"
                      : "amber"
                  }
                >
                  {b.status}
                </Badge>
                {b.googleEventId && (
                  <Badge color="indigo">
                    <Check className="mr-1 inline h-3 w-3" strokeWidth={2.5} />
                    Google
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {b.calendar.name} · {b.appointmentDate.slice(0, 10)}{" "}
                {b.startTime}–{b.endTime} ({b.timezone})
              </p>
              <p className="text-sm text-slate-500">
                {b.customerEmail}
                {b.customerPhone ? ` · ${b.customerPhone}` : ""}
              </p>
              {b.message && (
                <p className="mt-1 text-sm text-slate-400">“{b.message}”</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {b.status !== "CONFIRMED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    update.mutate({ id: b.id, status: "CONFIRMED" })
                  }
                >
                  <Check className="h-4 w-4" strokeWidth={1.75} />
                  Confirm
                </Button>
              )}
              {b.status !== "CANCELLED" && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    update.mutate({ id: b.id, status: "CANCELLED" })
                  }
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
