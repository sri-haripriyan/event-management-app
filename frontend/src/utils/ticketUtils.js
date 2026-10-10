/**
 * Ticket Expiry & Check-in Timing Utilities
 *
 * Expiry Rule:
 * - currentTime < eventEndTime  -> Active
 * - currentTime >= eventEndTime -> Expired
 */

export function parseEventEndDateTime(eventDate, endTime) {
  if (!eventDate) return null;
  const cleanDate = String(eventDate).trim();
  const cleanTime = (endTime ? String(endTime) : "").trim();

  if (cleanTime) {
    // Check for standard 12h or 24h formats e.g., "7:30:00 PM", "7:30 PM", "19:30"
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

    const combined = new Date(`${cleanDate} ${cleanTime}`);
    if (!isNaN(combined.getTime())) {
      return combined;
    }
  }

  // Fallback to end of day of eventDate (23:59:59.999)
  const d = new Date(cleanDate);
  if (!isNaN(d.getTime())) {
    d.setHours(23, 59, 59, 999);
    return d;
  }

  return null;
}

export function getTicketStatus(event) {
  // Prefer server-provided eventEndTime if valid, otherwise compute locally
  let endDateTime = event?.eventEndTime ? new Date(event.eventEndTime) : null;
  if (!endDateTime || isNaN(endDateTime.getTime())) {
    endDateTime = parseEventEndDateTime(event?.eventDate, event?.endTime);
  }

  const now = new Date();
  
  // Expiry boundary: currentTime < eventEndTime -> Active, currentTime >= eventEndTime -> Expired
  const isExpired = endDateTime ? now.getTime() >= endDateTime.getTime() : false;
  const expiryStatus = isExpired ? "Expired" : "Active";

  const isScanned =
    event?.checkIn?.status === "SCANNED" ||
    (event?.checkInStatus === "SCANNED");
  const checkInStatus = isScanned ? "SCANNED" : "NOT_SCANNED";
  const scannedAt = event?.checkIn?.scannedAt || event?.scannedAt || null;

  // Composite descriptor for UI clarity
  let compositeLabel = "";
  let compositeVariant = "";

  if (!isExpired && !isScanned) {
    compositeLabel = "Active & Unused";
    compositeVariant = "active-unscanned";
  } else if (!isExpired && isScanned) {
    compositeLabel = "Active & Checked In";
    compositeVariant = "active-scanned";
  } else if (isExpired && !isScanned) {
    compositeLabel = "Expired & Unused";
    compositeVariant = "expired-unscanned";
  } else {
    compositeLabel = "Expired & Checked In";
    compositeVariant = "expired-scanned";
  }

  return {
    isExpired,
    expiryStatus, // "Active" | "Expired"
    isScanned,
    checkInStatus, // "NOT_SCANNED" | "SCANNED"
    scannedAt,
    compositeLabel,
    compositeVariant,
    endDateTime,
  };
}
