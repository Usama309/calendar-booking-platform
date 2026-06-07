import { timeToMinutes, minutesToTime, weekdayOf, zonedToUtc } from "./time";

export interface AvailabilityRuleLite {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface BlockedTimeLite {
  startTime: string | null;
  endTime: string | null;
}

export interface BusyInterval {
  start: Date; // UTC instant
  end: Date; // UTC instant
}

export interface SlotComputationInput {
  dateStr: string; // YYYY-MM-DD
  timezone: string;
  durationMinutes: number;
  bufferMinutes: number;
  rules: AvailabilityRuleLite[];
  /** Blocks already filtered to this date. */
  blocks: BlockedTimeLite[];
  /** Busy intervals (bookings + Google) as UTC instants. */
  busy: BusyInterval[];
  /** Reference "now" for filtering past slots. Defaults to current time. */
  now?: Date;
}

export interface Slot {
  startTime: string; // "HH:mm" local
  endTime: string; // "HH:mm" local
  startUtc: string; // ISO
  endUtc: string; // ISO
}

interface Interval {
  start: number;
  end: number;
} // minutes since midnight, local

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

/**
 * Core availability engine.
 *
 * Working windows
 *   minus manual blocks
 *   minus Google busy times
 *   minus existing bookings
 *   spaced by buffer
 * = available slots.
 */
export function computeSlots(input: SlotComputationInput): Slot[] {
  const {
    dateStr,
    timezone,
    durationMinutes,
    bufferMinutes,
    rules,
    blocks,
    busy,
    now = new Date(),
  } = input;

  // Full-day block → nothing available.
  if (blocks.some((b) => !b.startTime && !b.endTime)) return [];

  const weekday = weekdayOf(dateStr);
  const dayWindows = rules
    .filter((r) => r.weekday === weekday)
    .map((r) => ({ start: timeToMinutes(r.startTime), end: timeToMinutes(r.endTime) }))
    .filter((w) => w.end > w.start);

  if (dayWindows.length === 0) return [];

  const windows = mergeIntervals(dayWindows);

  // Blocked ranges within the day (local minutes).
  const blockedRanges: Interval[] = blocks
    .filter((b) => b.startTime && b.endTime)
    .map((b) => ({
      start: timeToMinutes(b.startTime!),
      end: timeToMinutes(b.endTime!),
    }));

  const step = durationMinutes + bufferMinutes;
  const slots: Slot[] = [];

  for (const win of windows) {
    for (
      let start = win.start;
      start + durationMinutes <= win.end;
      start += step
    ) {
      const end = start + durationMinutes;

      // Reject if overlapping a blocked range (pad by buffer on both sides).
      const blockedHit = blockedRanges.some(
        (r) => start < r.end + bufferMinutes && end + bufferMinutes > r.start
      );
      if (blockedHit) continue;

      const startTime = minutesToTime(start);
      const endTime = minutesToTime(end);
      const startUtc = zonedToUtc(dateStr, startTime, timezone);
      const endUtc = zonedToUtc(dateStr, endTime, timezone);

      // Past slots are unavailable.
      if (startUtc.getTime() <= now.getTime()) continue;

      // Reject if overlapping any busy interval (padded by buffer).
      const bufferMs = bufferMinutes * 60_000;
      const busyHit = busy.some((b) => {
        const bStart = b.start.getTime() - bufferMs;
        const bEnd = b.end.getTime() + bufferMs;
        return startUtc.getTime() < bEnd && endUtc.getTime() > bStart;
      });
      if (busyHit) continue;

      slots.push({
        startTime,
        endTime,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
      });
    }
  }

  return slots;
}
