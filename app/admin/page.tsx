import Link from "next/link";
import {
  CalendarDays,
  CalendarCheck,
  ClipboardList,
  CalendarClock,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [calendarCount, activeCount, totalBookings, upcoming] =
    await Promise.all([
      prisma.calendar.count({ where: { userId } }),
      prisma.calendar.count({ where: { userId, isActive: true } }),
      prisma.booking.count({ where: { calendar: { userId } } }),
      prisma.booking.findMany({
        where: {
          calendar: { userId },
          status: { not: "CANCELLED" },
          startsAt: { gte: new Date() },
        },
        orderBy: { startsAt: "asc" },
        take: 8,
        include: { calendar: { select: { name: true } } },
      }),
    ]);

  const stats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "Calendars", value: calendarCount, icon: CalendarDays },
    { label: "Active", value: activeCount, icon: CalendarCheck },
    { label: "Total bookings", value: totalBookings, icon: ClipboardList },
    { label: "Upcoming", value: upcoming.length, icon: CalendarClock },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--forest)]">
        Dashboard
      </h1>
      <p className="mt-1 text-slate-500">Overview of your scheduling activity.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gold-soft)] text-[var(--gold-dark)]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-sm text-slate-500">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-[var(--forest)]">
                {s.value}
              </p>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--forest)]">
            Upcoming appointments
          </h2>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-1 text-sm font-medium text-[var(--gold-dark)] hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>

        <Card className="mt-4 divide-y">
          {upcoming.length === 0 && (
            <p className="p-6 text-sm text-slate-500">
              No upcoming appointments.
            </p>
          )}
          {upcoming.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="font-medium text-slate-900">{b.customerName}</p>
                <p className="text-sm text-slate-500">
                  {b.calendar.name} ·{" "}
                  {b.appointmentDate.toISOString().slice(0, 10)} {b.startTime}–
                  {b.endTime} ({b.timezone})
                </p>
              </div>
              <Badge color={b.status === "CONFIRMED" ? "green" : "amber"}>
                {b.status}
              </Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
