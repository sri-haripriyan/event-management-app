import React, { useRef, useMemo } from "react";
import {
  formatDateToYYYYMMDD,
  formatTimeToHHmm,
  getTodayLocalYYYYMMDD,
  parseTimeToMinutes,
} from "../../utils/eventValidation";

/**
 * EventDateTime Component
 * -----------------------
 * Dedicated date and time picker component for the event creation form.
 * Replaces the third-party react-datepicker with a lightweight, accessible,
 * responsive, and modern implementation that supports:
 * - Event date picker with min (today) and max (1 year ahead) bounds
 * - Quick date selection presets (Today, Tomorrow, +1 Week)
 * - 24-hour Start Time and End Time pickers
 * - Quick duration presets (+1h, +2h, +3h, +4h)
 * - Real-time duration calculation badge with validation status
 * - Persistent inline error messages until validation succeeds
 */
const EventDateTime = ({
  formData,
  handleChange,
  handleBlur,
  errors = {},
}) => {
  const dateInputRef = useRef(null);
  const startTimeInputRef = useRef(null);
  const endTimeInputRef = useRef(null);

  // Formatted date string (YYYY-MM-DD)
  const dateValue = useMemo(() => {
    return formatDateToYYYYMMDD(formData?.eventDate);
  }, [formData?.eventDate]);

  // Formatted start time string (HH:mm)
  const startTimeValue = useMemo(() => {
    return formatTimeToHHmm(formData?.startTime);
  }, [formData?.startTime]);

  // Formatted end time string (HH:mm)
  const endTimeValue = useMemo(() => {
    return formatTimeToHHmm(formData?.endTime);
  }, [formData?.endTime]);

  // Min and max date bounds
  const todayStr = useMemo(() => getTodayLocalYYYYMMDD(), []);
  const maxDateStr = useMemo(() => {
    const now = new Date();
    const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    return formatDateToYYYYMMDD(maxDate);
  }, []);

  // Quick date presets
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDateToYYYYMMDD(d);
  }, []);

  const nextWeekStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDateToYYYYMMDD(d);
  }, []);

  // Human-readable formatted date preview
  const formattedDatePreview = useMemo(() => {
    if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return "";
    const [y, m, d] = dateValue.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [dateValue]);

  // Calculate duration between startTime and endTime
  const durationInfo = useMemo(() => {
    if (!startTimeValue || !endTimeValue) return null;
    const startM = parseTimeToMinutes(startTimeValue);
    const endM = parseTimeToMinutes(endTimeValue);
    if (startM === null || endM === null) return null;

    const diff = endM - startM;
    if (diff <= 0) {
      return {
        valid: false,
        text: "End time must be after start time (no overnight events)",
        isError: true,
      };
    }

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    const timeText = `${hours > 0 ? `${hours}h ` : ""}${mins > 0 ? `${mins}m` : ""}`.trim();

    if (diff < 60) {
      return {
        valid: false,
        text: `Duration: ${timeText} (Minimum 1 hour required)`,
        isError: true,
      };
    }
    if (diff > 480) {
      return {
        valid: false,
        text: `Duration: ${timeText} (Maximum 8 hours allowed)`,
        isError: true,
      };
    }

    return {
      valid: true,
      text: `Duration: ${timeText}`,
      isError: false,
    };
  }, [startTimeValue, endTimeValue]);

  // Apply quick duration preset to end time based on start time
  const applyDurationPreset = (hoursToAdd) => {
    if (!startTimeValue) return;
    const startM = parseTimeToMinutes(startTimeValue);
    if (startM === null) return;

    const newEndM = startM + hoursToAdd * 60;
    if (newEndM >= 1440) return; // Cannot exceed midnight (same-day events only)

    const h = String(Math.floor(newEndM / 60)).padStart(2, "0");
    const m = String(newEndM % 60).padStart(2, "0");
    const newEndTimeStr = `${h}:${m}`;
    handleChange?.("endTime", newEndTimeStr);
  };

  const handleOpenPicker = (ref) => {
    if (ref.current && typeof ref.current.showPicker === "function") {
      try {
        ref.current.showPicker();
      } catch {
        // Fallback to focusing the input if showPicker fails
        ref.current.focus();
      }
    } else if (ref.current) {
      ref.current.focus();
    }
  };

  return (
    <div className="space-y-5">
      {/* Date Selection Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center pl-1">
          <label
            htmlFor="event-date-input"
            className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
          >
            Event Date <span className="text-rose-500">*</span>
          </label>
          {formattedDatePreview && (
            <span className="text-[11px] font-medium text-primary-container bg-primary-container/10 px-2 py-0.5 rounded-full">
              📅 {formattedDatePreview}
            </span>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            ref={dateInputRef}
            id="event-date-input"
            type="date"
            name="eventDate"
            value={dateValue}
            min={todayStr}
            max={maxDateStr}
            onChange={(e) => handleChange?.("eventDate", e.target.value)}
            onBlur={() => handleBlur?.("eventDate")}
            className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 pl-11 text-on-surface outline-none transition text-sm focus:ring-1 cursor-pointer font-sans ${
              errors.eventDate
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-outline-variant/40 focus:border-primary-container focus:ring-primary-container/30"
            }`}
          />
          <button
            type="button"
            onClick={() => handleOpenPicker(dateInputRef)}
            aria-label="Open date calendar picker"
            className="absolute left-3.5 text-on-surface-variant hover:text-primary-container transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">calendar_today</span>
          </button>
        </div>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] text-on-surface-variant/70 self-center pr-1">Quick pick:</span>
          <button
            type="button"
            onClick={() => handleChange?.("eventDate", todayStr)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition ${
              dateValue === todayStr
                ? "bg-primary-container/15 border-primary-container/50 text-primary-container font-semibold"
                : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleChange?.("eventDate", tomorrowStr)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition ${
              dateValue === tomorrowStr
                ? "bg-primary-container/15 border-primary-container/50 text-primary-container font-semibold"
                : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60"
            }`}
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => handleChange?.("eventDate", nextWeekStr)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition ${
              dateValue === nextWeekStr
                ? "bg-primary-container/15 border-primary-container/50 text-primary-container font-semibold"
                : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60"
            }`}
          >
            In 1 Week
          </button>
        </div>

        {/* Inline Error */}
        {errors.eventDate && (
          <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1" role="alert">
            <span className="material-symbols-outlined text-sm">error</span>
            {errors.eventDate}
          </p>
        )}
      </div>

      {/* Time Selection Section */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Start Time Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="event-start-time-input"
              className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1 block"
            >
              Start Time (24h) <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                ref={startTimeInputRef}
                id="event-start-time-input"
                type="time"
                name="startTime"
                value={startTimeValue}
                onChange={(e) => handleChange?.("startTime", e.target.value)}
                onBlur={() => handleBlur?.("startTime")}
                className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 pl-11 text-on-surface outline-none transition text-sm focus:ring-1 cursor-pointer font-sans ${
                  errors.startTime
                    ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-outline-variant/40 focus:border-primary-container focus:ring-primary-container/30"
                }`}
              />
              <button
                type="button"
                onClick={() => handleOpenPicker(startTimeInputRef)}
                aria-label="Open start time picker"
                className="absolute left-3.5 text-on-surface-variant hover:text-primary-container transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">schedule</span>
              </button>
            </div>
            {errors.startTime && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1" role="alert">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.startTime}
              </p>
            )}
          </div>

          {/* End Time Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="event-end-time-input"
              className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1 block"
            >
              End Time (24h) <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                ref={endTimeInputRef}
                id="event-end-time-input"
                type="time"
                name="endTime"
                value={endTimeValue}
                onChange={(e) => handleChange?.("endTime", e.target.value)}
                onBlur={() => handleBlur?.("endTime")}
                className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 pl-11 text-on-surface outline-none transition text-sm focus:ring-1 cursor-pointer font-sans ${
                  errors.endTime
                    ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-outline-variant/40 focus:border-primary-container focus:ring-primary-container/30"
                }`}
              />
              <button
                type="button"
                onClick={() => handleOpenPicker(endTimeInputRef)}
                aria-label="Open end time picker"
                className="absolute left-3.5 text-on-surface-variant hover:text-primary-container transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">schedule</span>
              </button>
            </div>
            {errors.endTime && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1" role="alert">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.endTime}
              </p>
            )}
          </div>
        </div>

        {/* Quick Duration Presets (available when startTime is populated) */}
        {startTimeValue && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-1">
            <span className="text-[11px] text-on-surface-variant/70 pr-1">Set duration:</span>
            {[1, 2, 3, 4, 6].map((hrs) => (
              <button
                key={hrs}
                type="button"
                onClick={() => applyDurationPreset(hrs)}
                className="px-2 py-0.5 text-[11px] font-medium bg-surface-container-low border border-outline-variant/30 hover:border-primary-container hover:text-primary-container text-on-surface-variant rounded-md transition"
              >
                +{hrs}h
              </button>
            ))}
          </div>
        )}

        {/* Duration Calculation Status Banner */}
        {durationInfo && !errors.startTime && !errors.endTime && (
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium transition ${
              durationInfo.valid
                ? "bg-primary-container/10 border-primary-container/30 text-primary-container"
                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}
          >
            <span className="material-symbols-outlined text-base shrink-0">
              {durationInfo.valid ? "check_circle" : "info"}
            </span>
            <span>{durationInfo.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDateTime;