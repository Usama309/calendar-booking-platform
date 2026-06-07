import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

/** Convert "HH:mm" to minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight to "HH:mm". */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Weekday (0=Sun..6=Sat) for a plain calendar date "YYYY-MM-DD". */
export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

/**
 * Convert a wall-clock date + time in a given IANA timezone to an absolute
 * UTC Date (instant).
 */
export function zonedToUtc(
  dateStr: string,
  time: string,
  timezone: string
): Date {
  return fromZonedTime(`${dateStr}T${time}:00`, timezone);
}

/** Format an instant as "h:mm a" wall-clock time in a timezone. */
export function formatSlotLabel(instant: Date, timezone: string): string {
  return formatInTimeZone(instant, timezone, "h:mm a");
}

/** Today's date string (YYYY-MM-DD) in a timezone. */
export function todayInTimezone(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
