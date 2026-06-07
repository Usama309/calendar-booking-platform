"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Clock, Hourglass, CalendarCheck } from "lucide-react";
import { fetchJson, TIMEZONES } from "@/lib/utils";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
  Badge,
} from "@/components/ui";

interface CalendarRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  timezone: string;
  isActive: boolean;
  _count: { bookings: number };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CalendarsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["calendars"],
    queryFn: () => fetchJson<CalendarRow[]>("/api/calendars"),
  });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--forest)]">
            Calendars
          </h1>
          <p className="mt-1 text-slate-500">
            Each calendar has its own URL, duration, and availability.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" strokeWidth={1.75} />
              Close
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              New calendar
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <CreateForm
          onCreated={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ["calendars"] });
          }}
        />
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {isLoading && <p className="text-slate-500">Loading…</p>}
        {data?.length === 0 && (
          <p className="text-slate-500">No calendars yet. Create one above.</p>
        )}
        {data?.map((c) => (
          <Link key={c.id} href={`/admin/calendars/${c.id}`}>
            <Card className="h-full p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg font-semibold text-[var(--forest)]">
                  {c.name}
                </h3>
                <Badge color={c.isActive ? "green" : "slate"}>
                  {c.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">/book/{c.slug}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 rounded bg-[var(--surface)] px-2 py-1">
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {c.durationMinutes} min
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-[var(--surface)] px-2 py-1">
                  <Hourglass className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {c.bufferMinutes} min buffer
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-[var(--surface)] px-2 py-1">
                  <CalendarCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {c._count.bookings} bookings
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [durationMinutes, setDuration] = useState(30);
  const [bufferMinutes, setBuffer] = useState(0);
  const [slugTouched, setSlugTouched] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson("/api/calendars", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          description: description || null,
          timezone,
          durationMinutes: Number(durationMinutes),
          bufferMinutes: Number(bufferMinutes),
          isActive: true,
        }),
      }),
    onSuccess: onCreated,
  });

  return (
    <Card className="mt-6 p-6">
      <h2 className="font-display text-lg font-semibold text-[var(--forest)]">
        New calendar
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="Free Consultation"
          />
        </div>
        <div>
          <Label>Slug (URL)</Label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="free-consultation"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A free 30-minute introductory call."
          />
        </div>
        <div>
          <Label>Timezone</Label>
          <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
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
              value={durationMinutes}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Buffer (min)</Label>
            <Input
              type="number"
              value={bufferMinutes}
              onChange={(e) => setBuffer(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {mutation.isError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {(mutation.error as Error).message}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          onClick={() => mutation.mutate()}
          disabled={!name || mutation.isPending}
        >
          {mutation.isPending ? "Creating…" : "Create calendar"}
        </Button>
      </div>
    </Card>
  );
}
