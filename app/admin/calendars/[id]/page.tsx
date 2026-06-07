"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, X, Plus, ArrowRight, Trash2 } from "lucide-react";
import { fetchJson, TIMEZONES } from "@/lib/utils";
import { WEEKDAY_LABELS } from "@/lib/time";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
  Badge,
} from "@/components/ui";

interface Rule {
  weekday: number;
  startTime: string;
  endTime: string;
}
interface Block {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}
interface CalendarDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  timezone: string;
  durationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
  googleCalendarId: string | null;
  availabilityRules: Rule[];
  blockedTimes: Block[];
  _count: { bookings: number };
}

const TABS = [
  "General",
  "Availability",
  "Blocked Dates",
  "Google Sync",
  "Bookings",
] as const;

export default function CalendarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");

  const { data, isLoading } = useQuery({
    queryKey: ["calendar", id],
    queryFn: () => fetchJson<CalendarDetail>(`/api/calendars/${id}`),
  });

  if (isLoading || !data) {
    return <p className="text-slate-500">Loading…</p>;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-[var(--forest)]">
            {data.name}
          </h1>
          <a
            href={`/book/${data.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm text-[var(--gold-dark)] hover:underline"
          >
            /book/{data.slug}
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        </div>
        <Badge color={data.isActive ? "green" : "slate"}>
          {data.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "whitespace-nowrap px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors " +
              (tab === t
                ? "border-[var(--gold)] text-[var(--gold-dark)]"
                : "border-transparent text-slate-500 hover:text-slate-700")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "General" && <GeneralTab calendar={data} />}
        {tab === "Availability" && <AvailabilityTab calendar={data} />}
        {tab === "Blocked Dates" && <BlocksTab calendar={data} />}
        {tab === "Google Sync" && <GoogleTab calendar={data} />}
        {tab === "Bookings" && <BookingsTab calendarId={data.id} />}
      </div>
    </div>
  );
}

function GeneralTab({ calendar }: { calendar: CalendarDetail }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [form, setForm] = useState({
    name: calendar.name,
    slug: calendar.slug,
    description: calendar.description ?? "",
    timezone: calendar.timezone,
    durationMinutes: calendar.durationMinutes,
    bufferMinutes: calendar.bufferMinutes,
    isActive: calendar.isActive,
  });

  const save = useMutation({
    mutationFn: () =>
      fetchJson(`/api/calendars/${calendar.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          description: form.description || null,
          durationMinutes: Number(form.durationMinutes),
          bufferMinutes: Number(form.bufferMinutes),
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar", calendar.id] }),
  });

  const del = useMutation({
    mutationFn: () =>
      fetchJson(`/api/calendars/${calendar.id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendars"] });
      router.push("/admin/calendars");
    },
  });

  return (
    <Card className="p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <Label>Slug</Label>
          <Input
            value={form.slug}
            onChange={(e) =>
              setForm({
                ...form,
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-"),
              })
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <Label>Timezone</Label>
          <Select
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Duration (min)</Label>
            <Input
              type="number"
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label>Buffer (min)</Label>
            <Input
              type="number"
              value={form.bufferMinutes}
              onChange={(e) =>
                setForm({ ...form, bufferMinutes: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active (accepts public bookings)
        </label>
      </div>

      {save.isError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {(save.error as Error).message}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm("Delete this calendar and all its bookings?"))
              del.mutate();
          }}
          disabled={del.isPending}
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          Delete calendar
        </Button>
      </div>
      {save.isSuccess && (
        <p className="mt-3 text-sm text-green-600">Saved.</p>
      )}
    </Card>
  );
}

function AvailabilityTab({ calendar }: { calendar: CalendarDetail }) {
  const qc = useQueryClient();
  const [rules, setRules] = useState<Rule[]>(calendar.availabilityRules);

  useEffect(() => {
    setRules(calendar.availabilityRules);
  }, [calendar.availabilityRules]);

  const save = useMutation({
    mutationFn: () =>
      fetchJson(`/api/calendars/${calendar.id}/availability`, {
        method: "PUT",
        body: JSON.stringify({ rules }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["calendar", calendar.id] }),
  });

  function addWindow(weekday: number) {
    setRules((r) => [...r, { weekday, startTime: "09:00", endTime: "17:00" }]);
  }
  function removeWindow(idx: number) {
    setRules((r) => r.filter((_, i) => i !== idx));
  }
  function update(idx: number, patch: Partial<Rule>) {
    setRules((r) => r.map((rule, i) => (i === idx ? { ...rule, ...patch } : rule)));
  }

  return (
    <Card className="p-6">
      <p className="text-sm text-slate-500">
        Define working windows per weekday. Multiple windows per day are
        supported (e.g. morning + afternoon).
      </p>

      <div className="mt-4 space-y-3">
        {WEEKDAY_LABELS.map((label, weekday) => {
          const dayRules = rules
            .map((r, i) => ({ r, i }))
            .filter(({ r }) => r.weekday === weekday);
          return (
            <div
              key={weekday}
              className="flex flex-col gap-2 rounded-lg border border-[var(--border)] p-3 sm:flex-row sm:items-start"
            >
              <div className="w-28 pt-2 text-sm font-medium text-slate-700">
                {label}
              </div>
              <div className="flex-1 space-y-2">
                {dayRules.length === 0 && (
                  <p className="py-2 text-sm text-slate-400">Unavailable</p>
                )}
                {dayRules.map(({ r, i }) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={r.startTime}
                      onChange={(e) => update(i, { startTime: e.target.value })}
                      className="w-32"
                    />
                    <span className="text-slate-400">–</span>
                    <Input
                      type="time"
                      value={r.endTime}
                      onChange={(e) => update(i, { endTime: e.target.value })}
                      className="w-32"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Remove window"
                      onClick={() => removeWindow(i)}
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => addWindow(weekday)}
                >
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                  Add window
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {save.isError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {(save.error as Error).message}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save availability"}
        </Button>
        {save.isSuccess && <span className="text-sm text-green-600">Saved.</span>}
      </div>
    </Card>
  );
}

function BlocksTab({ calendar }: { calendar: CalendarDetail }) {
  const qc = useQueryClient();
  const [date, setDate] = useState("");
  const [fullDay, setFullDay] = useState(true);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("14:00");
  const [reason, setReason] = useState("");

  const blocks = calendar.blockedTimes;

  const add = useMutation({
    mutationFn: () =>
      fetchJson(`/api/calendars/${calendar.id}/blocks`, {
        method: "POST",
        body: JSON.stringify({
          date,
          startTime: fullDay ? null : startTime,
          endTime: fullDay ? null : endTime,
          reason: reason || null,
        }),
      }),
    onSuccess: () => {
      setDate("");
      setReason("");
      qc.invalidateQueries({ queryKey: ["calendar", calendar.id] });
    },
  });

  const remove = useMutation({
    mutationFn: (blockId: string) =>
      fetchJson(`/api/calendars/${calendar.id}/blocks/${blockId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["calendar", calendar.id] }),
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-display text-lg font-semibold text-[var(--forest)]">
          Add a block
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Reason (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Holiday, lunch, etc."
            />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={fullDay}
            onChange={(e) => setFullDay(e.target.checked)}
          />
          Block the entire day
        </label>
        {!fullDay && (
          <div className="mt-3 flex items-center gap-2">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-32"
            />
            <span className="text-slate-400">–</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-32"
            />
          </div>
        )}
        {add.isError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {(add.error as Error).message}
          </p>
        )}
        <div className="mt-4">
          <Button onClick={() => add.mutate()} disabled={!date || add.isPending}>
            {add.isPending ? "Adding…" : "Add block"}
          </Button>
        </div>
      </Card>

      <Card className="divide-y">
        {blocks.length === 0 && (
          <p className="p-6 text-sm text-slate-500">No blocked times.</p>
        )}
        {blocks.map((b) => (
          <div key={b.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-slate-900">
                {b.date.slice(0, 10)}
              </p>
              <p className="text-sm text-slate-500">
                {b.startTime && b.endTime
                  ? `${b.startTime}–${b.endTime}`
                  : "Full day"}
                {b.reason ? ` · ${b.reason}` : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove.mutate(b.id)}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              Remove
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

function GoogleTab({ calendar }: { calendar: CalendarDetail }) {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["google-status"],
    queryFn: () =>
      fetchJson<{
        configured: boolean;
        connected: boolean;
        connection: { googleEmail: string } | null;
      }>("/api/google/status"),
  });
  const [googleCalendarId, setGoogleCalendarId] = useState(
    calendar.googleCalendarId ?? ""
  );

  const save = useMutation({
    mutationFn: () =>
      fetchJson(`/api/calendars/${calendar.id}`, {
        method: "PUT",
        body: JSON.stringify({ googleCalendarId: googleCalendarId || null }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["calendar", calendar.id] }),
  });

  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-semibold text-[var(--forest)]">
        Google Calendar sync
      </h3>
      <div className="mt-3 text-sm">
        {status.data?.connected ? (
          <Badge color="green">
            Connected as {status.data.connection?.googleEmail}
          </Badge>
        ) : (
          <p className="text-slate-500">
            Account not connected.{" "}
            <a
              href="/admin/google"
              className="inline-flex items-center gap-1 text-[var(--gold-dark)] hover:underline"
            >
              Connect Google Calendar
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </a>
          </p>
        )}
      </div>

      <div className="mt-5 max-w-md">
        <Label>Google Calendar ID for this calendar</Label>
        <Input
          value={googleCalendarId}
          onChange={(e) => setGoogleCalendarId(e.target.value)}
          placeholder="primary"
        />
        <p className="mt-1 text-xs text-slate-400">
          Leave blank to use your account&apos;s primary calendar. Busy times
          from this calendar block availability; new bookings are added here.
        </p>
        <div className="mt-3">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
          {save.isSuccess && (
            <span className="ml-3 text-sm text-green-600">Saved.</span>
          )}
        </div>
      </div>
    </Card>
  );
}

interface BookingRow {
  id: string;
  customerName: string;
  customerEmail: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

function BookingsTab({ calendarId }: { calendarId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["calendar-bookings", calendarId],
    queryFn: () =>
      fetchJson<BookingRow[]>(`/api/bookings?calendarId=${calendarId}`),
  });

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <Card className="divide-y">
      {isLoading && <p className="p-6 text-sm text-slate-500">Loading…</p>}
      {!isLoading && rows.length === 0 && (
        <p className="p-6 text-sm text-slate-500">No bookings yet.</p>
      )}
      {rows.map((b) => (
        <div key={b.id} className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium text-slate-900">{b.customerName}</p>
            <p className="text-sm text-slate-500">
              {b.customerEmail} · {b.appointmentDate.slice(0, 10)} {b.startTime}–
              {b.endTime}
            </p>
          </div>
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
        </div>
      ))}
    </Card>
  );
}
