import { z } from "zod";

/**
 * Timezone Strategy Documentation:
 * --------------------------------
 * Date and time validation uses the user's local timezone (via native JavaScript
 * Date and Intl APIs).
 * On form submission, `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone`
 * is sent with the payload so the backend validates times relative to the user's
 * actual timezone and avoids any UTC blind assumptions.
 */

// Check if string contains HTML tags
export const containsHtml = (input) => {
  if (typeof input !== "string") return false;
  return /<[a-z][\s\S]*>/i.test(input);
};

// Sanitize string by removing script and HTML tags
export const sanitizeString = (input) => {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
};

// Format Date object to YYYY-MM-DD in local time
export const formatDateToYYYYMMDD = (date) => {
  if (!date) return "";
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format Date object or time string to HH:mm (24-hour)
export const formatTimeToHHmm = (time) => {
  if (!time) return "";
  if (time instanceof Date && !isNaN(time.getTime())) {
    const hours = String(time.getHours()).padStart(2, "0");
    const minutes = String(time.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  const cleanStr = String(time).trim();
  const match24 = cleanStr.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::\d{2})?$/);
  if (match24) {
    const h = String(parseInt(match24[1], 10)).padStart(2, "0");
    const m = String(parseInt(match24[2], 10)).padStart(2, "0");
    return `${h}:${m}`;
  }
  const match12 = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const ampm = match12[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return "";
};

// Parse HH:mm to minutes from midnight
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const hhmm = formatTimeToHHmm(timeStr);
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
};

// Get today's local date as YYYY-MM-DD
export const getTodayLocalYYYYMMDD = () => {
  return formatDateToYYYYMMDD(new Date());
};

// Get current local time as minutes from midnight
export const getCurrentLocalMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// Zod Schema for Step 1
export const step1ZodSchema = z
  .object({
    eventName: z
      .string({ required_error: "Event title is required" })
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title cannot exceed 100 characters")
      .refine((val) => !containsHtml(val), {
        message: "HTML tags are not allowed in the title",
      }),

    description: z
      .string({ required_error: "Description is required" })
      .trim()
      .min(20, "Description must be at least 20 characters")
      .max(2000, "Description cannot exceed 2000 characters")
      .refine((val) => !containsHtml(val), {
        message: "HTML tags are not allowed in the description",
      }),

    eventDate: z
      .string({ required_error: "Event date is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Event date must be in YYYY-MM-DD format"),

    startTime: z
      .string({ required_error: "Start time is required" })
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be in HH:mm 24-hour format"),

    endTime: z
      .string({ required_error: "End time is required" })
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be in HH:mm 24-hour format"),
  })
  .superRefine((data, ctx) => {
    const todayStr = getTodayLocalYYYYMMDD();
    const currentM = getCurrentLocalMinutes();

    // Today or future check
    if (data.eventDate < todayStr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventDate"],
        message: "Event date must be today or a future date",
      });
    }

    // Max 1 year ahead check
    const [y, m, d] = data.eventDate.split("-").map(Number);
    const eventDateTime = new Date(y, m - 1, d);
    const now = new Date();
    const maxDateTime = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    if (eventDateTime > maxDateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventDate"],
        message: "Event date cannot be more than 1 year in the future",
      });
    }

    // Timing checks
    const startM = parseTimeToMinutes(data.startTime);
    const endM = parseTimeToMinutes(data.endTime);

    if (startM !== null && endM !== null) {
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

    // Today start time check
    if (data.eventDate === todayStr && startM !== null) {
      if (startM <= currentM) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startTime"],
          message: "Start time for today's event must be later than the current local time",
        });
      }
    }
  });

// Validate image file
export const validateImageFileFrontend = (file, existingImageUrl, mode) => {
  if (mode === "create" && !file && !existingImageUrl) {
    return "Event poster image is required";
  }
  if (file) {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const extension = file.name ? file.name.split(".").pop().toLowerCase() : "";
    const validExtensions = ["jpg", "jpeg", "png", "webp"];

    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      return "Invalid image format. Only JPG, PNG, and WebP images are accepted";
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      return "Image file size exceeds the 5 MB limit";
    }
  }
  return null;
};

// Validate Step 1
export const validateStep1 = (formData, file, mode = "create") => {
  const errors = {};

  const dateStr = formatDateToYYYYMMDD(formData.eventDate);
  const startStr = formatTimeToHHmm(formData.startTime);
  const endStr = formatTimeToHHmm(formData.endTime);

  const payload = {
    eventName: formData.eventName ? String(formData.eventName).trim() : "",
    description: formData.description ? String(formData.description).trim() : "",
    eventDate: dateStr,
    startTime: startStr,
    endTime: endStr,
  };

  const result = step1ZodSchema.safeParse(payload);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
  }

  // Image validation
  const imageError = validateImageFileFrontend(file, formData.existingImageUrl, mode);
  if (imageError) {
    errors.imageUrl = imageError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate Step 2: Sub-events and Pricing
export const validateStep2 = (formData) => {
  const errors = {};

  const technical = Array.isArray(formData.technical) ? formData.technical : [];
  const nonTechnical = Array.isArray(formData.nonTechnical) ? formData.nonTechnical : [];
  const totalTracks = technical.length + nonTechnical.length;

  if (totalTracks === 0) {
    errors.subEvents = "At least one sub-event track (technical or non-technical) is required";
  }

  if (technical.length > 20) {
    errors.technical = "Technical sub-events cannot exceed 20 items";
  }
  if (nonTechnical.length > 20) {
    errors.nonTechnical = "Non-technical sub-events cannot exceed 20 items";
  }

  // Check sub-event items for length, limit, and duplicate names
  const seenTechnical = new Set();
  technical.forEach((t, i) => {
    const trimmed = (t?.name || "").trim();
    if (!trimmed) {
      errors[`technical_${i}`] = "Sub-event name cannot be empty";
    } else if (trimmed.length > 50) {
      errors[`technical_${i}`] = "Sub-event name cannot exceed 50 characters";
    } else {
      const lower = trimmed.toLowerCase();
      if (seenTechnical.has(lower)) {
        errors[`technical_${i}`] = `Duplicate sub-event name "${trimmed}" in technical tracks`;
      }
      seenTechnical.add(lower);
    }
  });

  const seenNonTechnical = new Set();
  nonTechnical.forEach((t, i) => {
    const trimmed = (t?.name || "").trim();
    if (!trimmed) {
      errors[`nonTechnical_${i}`] = "Sub-event name cannot be empty";
    } else if (trimmed.length > 50) {
      errors[`nonTechnical_${i}`] = "Sub-event name cannot exceed 50 characters";
    } else {
      const lower = trimmed.toLowerCase();
      if (seenNonTechnical.has(lower)) {
        errors[`nonTechnical_${i}`] = `Duplicate sub-event name "${trimmed}" in non-technical tracks`;
      }
      seenNonTechnical.add(lower);
    }
  });

  // Pricing validation
  if (formData.paid) {
    const amountVal = formData.amount;
    const amountStr = String(amountVal ?? "").trim();

    if (amountVal === "" || amountVal === null || amountVal === undefined) {
      errors.amount = "Registration amount is required for paid events";
    } else if (/e/i.test(amountStr)) {
      errors.amount = "Exponent notation is not allowed";
    } else {
      const num = Number(amountVal);
      if (isNaN(num)) {
        errors.amount = "Amount must be a valid number";
      } else if (num <= 0) {
        errors.amount = "Registration amount must be greater than 0";
      } else if (num > 100000) {
        errors.amount = "Registration amount cannot exceed 100,000 INR";
      } else {
        const parts = amountStr.split(".");
        if (parts.length > 1 && parts[1].length > 2) {
          errors.amount = "Amount can have at most 2 decimal places";
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate Step 3: Inclusions
export const validateStep3 = (formData) => {
  const errors = {};
  if (typeof formData.swags !== "boolean") {
    errors.swags = "Swags must be a boolean";
  }
  if (typeof formData.refreshments !== "boolean") {
    errors.refreshments = "Refreshments must be a boolean";
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate a single field on demand.
 * Returns error string if invalid, or null if valid.
 */
export const validateSingleField = (name, value, allFormData = {}, file = null, mode = "create") => {
  const currentData = { ...allFormData, [name]: value };

  switch (name) {
    case "eventName":
    case "title": {
      const trimmed = typeof value === "string" ? value.trim() : "";
      if (!trimmed) return "Event title is required";
      if (trimmed.length < 3) return "Title must be at least 3 characters";
      if (trimmed.length > 100) return "Title cannot exceed 100 characters";
      if (containsHtml(trimmed)) return "HTML tags are not allowed in the title";
      return null;
    }

    case "description": {
      const trimmed = typeof value === "string" ? value.trim() : "";
      if (!trimmed) return "Description is required";
      if (trimmed.length < 20) return "Description must be at least 20 characters";
      if (trimmed.length > 2000) return "Description cannot exceed 2000 characters";
      if (containsHtml(trimmed)) return "HTML tags are not allowed in the description";
      return null;
    }

    case "imageUrl":
    case "file": {
      return validateImageFileFrontend(file, currentData.existingImageUrl, mode);
    }

    case "eventDate": {
      const dateStr = formatDateToYYYYMMDD(value);
      if (!dateStr) return "Event date is required";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "Event date must be in YYYY-MM-DD format";

      const todayStr = getTodayLocalYYYYMMDD();
      if (dateStr < todayStr) return "Event date must be today or a future date";

      const [y, m, d] = dateStr.split("-").map(Number);
      const eventDateTime = new Date(y, m - 1, d);
      const now = new Date();
      const maxDateTime = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      if (eventDateTime > maxDateTime) {
        return "Event date cannot be more than 1 year in the future";
      }
      return null;
    }

    case "startTime": {
      const startStr = formatTimeToHHmm(value);
      if (!startStr) return "Start time is required";
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startStr)) {
        return "Start time must be in HH:mm 24-hour format";
      }

      const dateStr = formatDateToYYYYMMDD(currentData.eventDate);
      const todayStr = getTodayLocalYYYYMMDD();
      const startM = parseTimeToMinutes(startStr);
      const currentM = getCurrentLocalMinutes();

      if (dateStr === todayStr && startM !== null && startM <= currentM) {
        return "Start time for today's event must be later than the current local time";
      }
      return null;
    }

    case "endTime": {
      const endStr = formatTimeToHHmm(value);
      if (!endStr) return "End time is required";
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(endStr)) {
        return "End time must be in HH:mm 24-hour format";
      }

      const startStr = formatTimeToHHmm(currentData.startTime);
      const startM = parseTimeToMinutes(startStr);
      const endM = parseTimeToMinutes(endStr);

      if (startM !== null && endM !== null) {
        if (endM <= startM) {
          return "End time must be after start time (overnight events are not supported)";
        }
        const duration = endM - startM;
        if (duration < 60) {
          return "Event duration must be at least 1 hour (60 minutes)";
        }
        if (duration > 480) {
          return "Event duration cannot exceed 8 hours";
        }
      }
      return null;
    }

    case "amount": {
      if (!currentData.paid) return null;
      const amountStr = String(value ?? "").trim();
      if (amountStr === "" || value === null || value === undefined) {
        return "Registration amount is required for paid events";
      }
      if (/e/i.test(amountStr)) {
        return "Exponent notation is not allowed";
      }
      const num = Number(value);
      if (isNaN(num)) {
        return "Amount must be a valid number";
      }
      if (num <= 0) {
        return "Registration amount must be greater than 0";
      }
      if (num > 100000) {
        return "Registration amount cannot exceed 100,000 INR";
      }
      const parts = amountStr.split(".");
      if (parts.length > 1 && parts[1].length > 2) {
        return "Amount can have at most 2 decimal places";
      }
      return null;
    }

    case "subEvents": {
      const technical = Array.isArray(currentData.technical) ? currentData.technical : [];
      const nonTechnical = Array.isArray(currentData.nonTechnical) ? currentData.nonTechnical : [];
      const totalTracks = technical.length + nonTechnical.length;
      if (totalTracks === 0) {
        return "At least one sub-event track (technical or non-technical) is required";
      }
      if (technical.length > 20) {
        return "Technical sub-events cannot exceed 20 items";
      }
      if (nonTechnical.length > 20) {
        return "Non-technical sub-events cannot exceed 20 items";
      }
      return null;
    }

    default:
      return null;
  }
};

// Validate Full Form (re-checks everything right before submission)
export const validateFullForm = (formData, file, mode = "create") => {
  const step1 = validateStep1(formData, file, mode);
  const step2 = validateStep2(formData);
  const step3 = validateStep3(formData);

  const allErrors = {
    ...step1.errors,
    ...step2.errors,
    ...step3.errors,
  };

  const fieldsOrder = [
    "eventName",
    "description",
    "imageUrl",
    "eventDate",
    "startTime",
    "endTime",
    "subEvents",
    "amount",
  ];

  let firstErrorField = null;
  let firstStepWithError = null;

  for (const field of fieldsOrder) {
    if (allErrors[field]) {
      firstErrorField = field;
      if (["eventName", "description", "imageUrl", "eventDate", "startTime", "endTime"].includes(field)) {
        firstStepWithError = 1;
      } else if (["subEvents", "amount"].includes(field)) {
        firstStepWithError = 2;
      } else {
        firstStepWithError = 3;
      }
      break;
    }
  }

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
    firstErrorField,
    firstStepWithError,
  };
};
