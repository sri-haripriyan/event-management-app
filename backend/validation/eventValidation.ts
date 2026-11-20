import { z } from "zod";

/**
 * Timezone Strategy Documentation:
 * --------------------------------
 * Date and time validation is evaluated relative to the user's local timezone.
 * The client sends `timezone` (e.g., "Asia/Kolkata", "America/New_York", via
 * `Intl.DateTimeFormat().resolvedOptions().timeZone`).
 * The server formats current server time into the specified timezone to accurately
 * check if `eventDate` is today and whether `startTime` is in the future.
 * If no timezone or an invalid timezone is sent, "Asia/Kolkata" or UTC is used safely.
 */

// Strip HTML tags and script tags to prevent XSS
export const sanitizeString = (input: unknown): string => {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
};

// Check if string contains HTML tags
export const containsHtml = (input: string): boolean => {
  return /<[a-z][\s\S]*>/i.test(input);
};

// Validate whether a string is a valid Google Maps URL
export const isGoogleMapsUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    // Check Google Maps hosts and URL formats
    if (host === "maps.app.goo.gl") return true;
    if (host === "goo.gl" && path.startsWith("/maps")) return true;
    if (host.startsWith("maps.google.")) return true;
    if (
      (host === "google.com" ||
        host.endsWith(".google.com") ||
        /google\.[a-z.]+$/.test(host)) &&
      path.startsWith("/maps")
    ) {
      return true;
    }

    return false;
  } catch (_) {
    return false;
  }
};

// Helper: parse HH:mm or HH:mm:ss to minutes from midnight
export const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

// Get current date (YYYY-MM-DD) and current time (HH:mm) in target timezone
export const getNowInTimezone = (timeZone = "UTC") => {
  let validTz = timeZone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
  } catch (_) {
    validTz = "UTC";
  }

  const now = new Date();

  // en-CA formats as YYYY-MM-DD
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: validTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = dateFormatter.format(now);

  // en-GB formats as HH:mm:ss in 24h
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: validTz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const timeStr = timeFormatter.format(now);

  const [currH, currM] = timeStr.split(":").map((v) => parseInt(v, 10));
  const currentMinutes = currH * 60 + currM;

  return { todayStr, timeStr, currentMinutes };
};

// Sub-event track schema
export const subEventTrackSchema = z
  .object({
    name: z
      .string()
      .min(1, "Sub-event name is required")
      .max(50, "Sub-event name cannot exceed 50 characters")
      .transform(sanitizeString)
      .refine((v) => v.length >= 1, "Sub-event name cannot be empty"),
    limit: z
      .number()
      .int("Limit must be an integer")
      .positive("Limit must be greater than 0")
      .max(10000, "Limit cannot exceed 10,000"),
  });

export type SubEventTrack = z.infer<typeof subEventTrackSchema>;

// Full Event Validation Schema
export const createEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title cannot exceed 100 characters")
      .refine((val) => !containsHtml(val), {
        message: "HTML tags are not allowed in the title",
      }),

    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters")
      .max(2000, "Description cannot exceed 2000 characters")
      .refine((val) => !containsHtml(val), {
        message: "HTML tags are not allowed in the description",
      }),

    eventDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Event date must be in YYYY-MM-DD format"),

    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be in HH:mm 24-hour format"),

    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be in HH:mm 24-hour format"),

    venue: z
      .string()
      .trim()
      .max(200, "Venue cannot exceed 200 characters")
      .refine((val) => !containsHtml(val), {
        message: "HTML tags are not allowed in the venue",
      })
      .optional()
      .default(""),

    location: z
      .string()
      .trim()
      .max(1000, "Location link cannot exceed 1000 characters")
      .refine((val) => !val || isGoogleMapsUrl(val), {
        message:
          "Location must be a valid Google Maps link (e.g. https://maps.google.com/... or https://maps.app.goo.gl/...)",
      })
      .refine((val) => !containsHtml(val), {
        message: "HTML tags are not allowed in the location link",
      })
      .optional()
      .default(""),

    timezone: z.string().optional().default("UTC"),

    technical: z.array(subEventTrackSchema).max(20, "Cannot exceed 20 technical sub-events").default([]),
    nonTechnical: z.array(subEventTrackSchema).max(20, "Cannot exceed 20 non-technical sub-events").default([]),

    paid: z.boolean().default(false),

    amount: z
      .union([z.number(), z.string()])
      .refine(
        (val) => {
          if (typeof val === "string") {
            if (/e/i.test(val.trim())) return false;
            return !isNaN(Number(val));
          }
          return typeof val === "number" && !isNaN(val);
        },
        { message: "Amount must be a valid number and cannot use exponent notation" }
      )
      .transform((val) => Number(val))
      .default(0),

    swags: z.boolean().default(false),
    refreshments: z.boolean().default(false),

    // In edit mode or when already uploaded
    existingImageUrl: z.string().optional(),
  })
  .strict()
  // Cross-field validations
  .superRefine((data, ctx) => {
    const { todayStr, currentMinutes } = getNowInTimezone(data.timezone);

    // 1. Event date checks
    if (data.eventDate < todayStr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventDate"],
        message: "Event date must be today or a future date",
      });
    }

    // Max 1 year ahead check
    const [y, m, d] = data.eventDate.split("-").map(Number);
    const eventDateTime = new Date(Date.UTC(y, m - 1, d));
    const [cy, cm, cd] = todayStr.split("-").map(Number);
    const maxDateTime = new Date(Date.UTC(cy + 1, cm - 1, cd));

    if (eventDateTime > maxDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventDate"],
        message: "Event date cannot be more than 1 year in the future",
      });
    }

    // 2. Start time and End time checks
    const startM = parseTimeToMinutes(data.startTime);
    const endM = parseTimeToMinutes(data.endTime);

    if (startM !== null && endM !== null) {
      // Overnight / order check
      if (endM <= startM) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "End time must be after start time (overnight events are not supported)",
        });
      } else {
        const duration = endM - startM;
        if (duration < 60) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endTime"],
            message: "Event duration must be at least 1 hour (60 minutes)",
          });
        }
        if (duration > 480) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endTime"],
            message: "Event duration cannot exceed 8 hours",
          });
        }
      }
    }

    // 3. Today's event start time check
    if (data.eventDate === todayStr && startM !== null) {
      if (startM <= currentMinutes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startTime"],
          message: "Start time for today's event must be later than the current local time",
        });
      }
    }

    // 4. Sub-events check: at least one entry across technical and nonTechnical
    const totalTracks = data.technical.length + data.nonTechnical.length;
    if (totalTracks === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["technical"],
        message: "At least one sub-event track (technical or non-technical) is required",
      });
    }

    // 5. Check duplicate track names within categories (case-insensitive)
    const checkDuplicates = (list: SubEventTrack[], fieldName: "technical" | "nonTechnical") => {
      const seen = new Set<string>();
      for (let i = 0; i < list.length; i++) {
        const lower = list[i].name.toLowerCase();
        if (seen.has(lower)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [fieldName, i, "name"],
            message: `Duplicate sub-event name "${list[i].name}" in ${fieldName} tracks`,
          });
        }
        seen.add(lower);
      }
    };
    checkDuplicates(data.technical, "technical");
    checkDuplicates(data.nonTechnical, "nonTechnical");

    // 6. Pricing validation
    if (!data.paid) {
      // Force amount = 0
      data.amount = 0;
    } else {
      const amtStr = String(data.amount);
      if (/e/i.test(amtStr)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Exponent notation is not allowed",
        });
      } else if (isNaN(data.amount) || data.amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Registration amount must be a number greater than 0",
        });
      } else if (data.amount > 100000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Registration amount cannot exceed 100,000 INR",
        });
      } else {
        // Max 2 decimals check
        const parts = amtStr.split(".");
        if (parts.length > 1 && parts[1].length > 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["amount"],
            message: "Amount can have at most 2 decimal places",
          });
        }
      }
    }
  });

// Forbidden server-managed fields that client must never provide
export const FORBIDDEN_SERVER_FIELDS = [
  "userId",
  "likes",
  "comments",
  "fileId",
  "createdAt",
  "updatedAt",
];

// Validate image file (Multer file)
export const validateImageFile = (file?: Express.Multer.File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: "Event poster image is required" };
  }

  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: "Invalid image format. Only JPG, PNG, and WebP images are accepted",
    };
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: "Image file size exceeds the 5 MB limit",
    };
  }

  return { isValid: true };
};
