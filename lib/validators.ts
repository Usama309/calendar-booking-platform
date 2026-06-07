import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const timeWindowSchema = z
  .object({
    startTime: z.string().regex(timeRegex, "Use HH:mm (24h) format"),
    endTime: z.string().regex(timeRegex, "Use HH:mm (24h) format"),
  })
  .refine((w) => w.startTime < w.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const availabilityRuleSchema = timeWindowSchema.and(
  z.object({
    weekday: z.number().int().min(0).max(6),
  })
);

export const createCalendarSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120)
    .regex(slugRegex, "Slug must be lowercase, hyphen-separated"),
  description: z.string().max(2000).optional().nullable(),
  timezone: z.string().min(1),
  durationMinutes: z.number().int().min(5).max(480),
  bufferMinutes: z.number().int().min(0).max(240),
  isActive: z.boolean().optional(),
  googleCalendarId: z.string().optional().nullable(),
});

export const updateCalendarSchema = createCalendarSchema.partial();

export const availabilityPayloadSchema = z.object({
  rules: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().regex(timeRegex),
        endTime: z.string().regex(timeRegex),
      })
    )
    .max(100),
});

export const blockedTimeSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    startTime: z.string().regex(timeRegex).optional().nullable(),
    endTime: z.string().regex(timeRegex).optional().nullable(),
    reason: z.string().max(500).optional().nullable(),
  })
  .refine(
    (b) => {
      // Either both times set (range) or both null (full day).
      const hasStart = !!b.startTime;
      const hasEnd = !!b.endTime;
      if (hasStart !== hasEnd) return false;
      if (hasStart && hasEnd) return b.startTime! < b.endTime!;
      return true;
    },
    { message: "Provide both start and end time, or neither (full day)" }
  );

export const createBookingSchema = z.object({
  slug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  startTime: z.string().regex(timeRegex, "Use HH:mm format"),
  customerName: z.string().min(1, "Name is required").max(160),
  customerEmail: z.string().email("Valid email required").max(200),
  customerPhone: z.string().max(40).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

export const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
});

export const createUrgentSchema = z.object({
  slug: z.string().min(1).optional().nullable(),
  firstName: z.string().min(1, "First name is required").max(120),
  fullName: z.string().min(1, "Full name is required").max(200),
  email: z.string().email("Valid email required").max(200),
  phone: z.string().min(3, "Phone is required").max(40),
  note: z.string().max(2000).optional().nullable(),
});

export const updateUrgentSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "RESOLVED"]),
});

export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;
export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
