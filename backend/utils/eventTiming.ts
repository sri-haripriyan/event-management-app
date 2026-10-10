/**
 * Utility for event timing and ticket expiry boundary calculations.
 * 
 * Expiry Rule:
 * - currentTime < eventEndTime  -> Active
 * - currentTime >= eventEndTime -> Expired
 */

export function parseEventEndDateTime(eventDate?: string, endTime?: string): Date | null {
  if (!eventDate) return null;
  const cleanDate = String(eventDate).trim();
  const cleanTime = (endTime ? String(endTime) : "").trim();

  if (cleanTime) {
    // Try matching 12-hour or 24-hour time e.g. "7:30:00 PM", "7:30 PM", "19:30"
    const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    const dateParsed = new Date(cleanDate);
    if (timeMatch && !isNaN(dateParsed.getTime())) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      const meridiem = timeMatch[4] ? timeMatch[4].toUpperCase() : null;

      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;

      const result = new Date(dateParsed);
      result.setHours(hours, minutes, seconds, 0);
      return result;
    }

    // Try combined string directly
    const combined = new Date(`${cleanDate} ${cleanTime}`);
    if (!isNaN(combined.getTime())) {
      return combined;
    }
  }

  // Fallback to end of day of eventDate (23:59:59.999) if endTime is not present or cannot be parsed
  const d = new Date(cleanDate);
  if (!isNaN(d.getTime())) {
    d.setHours(23, 59, 59, 999);
    return d;
  }

  return null;
}

export function computeTicketStatus(
  eventDate?: string,
  endTime?: string,
  checkIn?: { status?: string; scannedAt?: Date | string | null }
) {
  const endDateTime = parseEventEndDateTime(eventDate, endTime);
  const now = new Date();

  // Boundary condition: currentTime < eventEndTime -> Active, currentTime >= eventEndTime -> Expired
  const isExpired = endDateTime ? now.getTime() >= endDateTime.getTime() : false;
  const expiryStatus = isExpired ? "Expired" : "Active";

  const isScanned = checkIn?.status === "SCANNED";
  const checkInStatus = isScanned ? "SCANNED" : "NOT_SCANNED";
  const scannedAt = isScanned ? checkIn?.scannedAt || null : null;

  return {
    eventEndTime: endDateTime ? endDateTime.toISOString() : null,
    expiryStatus, // "Active" | "Expired"
    checkInStatus, // "NOT_SCANNED" | "SCANNED"
    scannedAt,
    isExpired,
  };
}
