"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  TriangleAlert,
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/calendars", label: "Calendars", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/urgent", label: "Urgent Requests", icon: TriangleAlert },
  { href: "/admin/google", label: "Google Calendar", icon: CalendarCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavContent({
  pathname,
  email,
  onNavigate,
}: {
  pathname: string;
  email?: string | null;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="border-b border-[var(--border)] px-5 py-4">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="font-display text-lg font-semibold text-[var(--forest)]"
        >
          Booking Admin
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--gold-soft)] text-[var(--gold-dark)]"
                  : "text-slate-600 hover:bg-[var(--surface)]"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <p className="truncate px-3 pb-2 text-xs text-slate-400">{email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-[var(--surface)]"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </>
  );
}

export function AdminSidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] lg:flex">
        <NavContent pathname={pathname} email={email} />
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 lg:hidden">
        <Link
          href="/admin"
          className="font-display text-base font-semibold text-[var(--forest)]"
        >
          Booking Admin
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-[var(--forest)] hover:bg-[var(--surface)]"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[var(--forest)]/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[var(--card)] shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-2 text-slate-500 hover:bg-[var(--surface)]"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <NavContent
              pathname={pathname}
              email={email}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
