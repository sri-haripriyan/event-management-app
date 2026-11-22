export function formatTimestamp(isoTimestamp) {
  const date = new Date(isoTimestamp);

  // Extract individual components
  const day = String(date.getDate()).padStart(2, "0"); // Ensure two digits for day
  const month = date.toLocaleString("en-US", { month: "short" }); // Get short month
  const year = date.getFullYear(); // Get full year
  const hours = String(date.getHours()).padStart(2, "0"); // Ensure two digits for hours
  const minutes = String(date.getMinutes()).padStart(2, "0"); // Ensure two digits for minutes

  // Return formatted string
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

export default function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractDateString(val) {
  if (!val) return "";
  if (typeof val === "string") {
    const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = val instanceof Date ? val : new Date(val);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
}

function extractTimeMinutes(timeStr) {
  if (!timeStr) return null;
  const str = String(timeStr).trim();
  const match24 = str.match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const ampm = match12[3].toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }
  return null;
}

/**
 * Computes the temporal status of an event:
 * - "upcoming": Event has not started yet
 * - "live": Event has started and is currently ongoing
 * - "ended": Event has completed / passed end time
 * - "unknown": Unable to determine from event data
 */
export function getEventTimeStatus(event, customNow = null) {
  if (!event) {
    return { status: "unknown", isLive: false, hasStarted: false, hasEnded: false };
  }

  // Explicit override if set
  if (event.isLive === true) {
    return { status: "live", isLive: true, hasStarted: true, hasEnded: false };
  }

  const now = customNow instanceof Date ? customNow : new Date();

  let startDate = null;
  let endDate = null;

  // 1. Check startAt and endAt Date fields (saved in DB with IST offset +05:30)
  if (event.startAt) {
    const d = new Date(event.startAt);
    if (!isNaN(d.getTime())) startDate = d;
  }
  if (event.endAt) {
    const d = new Date(event.endAt);
    if (!isNaN(d.getTime())) endDate = d;
  }

  const dateStr = extractDateString(event.eventDate);
  const startMinutes = extractTimeMinutes(event.startTime);
  const endMinutes = extractTimeMinutes(event.endTime);

  // 2. Parse ISO with IST offset (+05:30) if startAt/endAt not populated
  if (!startDate && dateStr && startMinutes !== null) {
    const sh = String(Math.floor(startMinutes / 60)).padStart(2, "0");
    const sm = String(startMinutes % 60).padStart(2, "0");
    const startIso = `${dateStr}T${sh}:${sm}:00+05:30`;
    const d = new Date(startIso);
    if (!isNaN(d.getTime())) startDate = d;
  }

  if (!endDate && dateStr && endMinutes !== null) {
    const eh = String(Math.floor(endMinutes / 60)).padStart(2, "0");
    const em = String(endMinutes % 60).padStart(2, "0");
    const endIso = `${dateStr}T${eh}:${em}:00+05:30`;
    const d = new Date(endIso);
    if (!isNaN(d.getTime())) endDate = d;
  }

  // 3. Fallback comparison using local date & minutes if Date constructor was inconclusive
  if (!startDate && dateStr) {
    const todayStr = extractDateString(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (dateStr < todayStr) {
      return { status: "ended", isLive: false, hasStarted: true, hasEnded: true };
    }
    if (dateStr > todayStr) {
      return { status: "upcoming", isLive: false, hasStarted: false, hasEnded: false };
    }

    if (startMinutes !== null) {
      if (currentMinutes < startMinutes) {
        return { status: "upcoming", isLive: false, hasStarted: false, hasEnded: false };
      }
      if (endMinutes !== null && currentMinutes > endMinutes) {
        return { status: "ended", isLive: false, hasStarted: true, hasEnded: true };
      }
      return { status: "live", isLive: true, hasStarted: true, hasEnded: false };
    }
  }

  if (!startDate) {
    return { status: "unknown", isLive: false, hasStarted: false, hasEnded: false };
  }

  const nowMs = now.getTime();
  const startMs = startDate.getTime();

  if (nowMs < startMs) {
    return { status: "upcoming", isLive: false, hasStarted: false, hasEnded: false, startDate, endDate };
  }

  if (endDate) {
    const endMs = endDate.getTime();
    if (nowMs > endMs) {
      return { status: "ended", isLive: false, hasStarted: true, hasEnded: true, startDate, endDate };
    }
  }

  return { status: "live", isLive: true, hasStarted: true, hasEnded: false, startDate, endDate };
}

export function isEventLive(event, customNow = null) {
  return getEventTimeStatus(event, customNow).isLive;
}

