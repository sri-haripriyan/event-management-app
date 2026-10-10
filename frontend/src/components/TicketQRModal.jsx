import { useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scanTicketCheckIn } from "../services/api";
import { getTicketStatus } from "../utils/ticketUtils";
import Spinner from "./Spinner";

const TicketQRModal = ({ isOpen, onClose, event, currentUser }) => {
  const queryClient = useQueryClient();
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Scan / Check-in Mutation
  const { mutate: performCheckIn, isPending: isCheckingIn } = useMutation({
    mutationFn: scanTicketCheckIn,
    onSuccess: (data) => {
      toast.success(data?.message || "Ticket successfully scanned & checked in!");
      queryClient.invalidateQueries({ queryKey: ["profile-panel"] });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Check-in validation failed";
      toast.error(msg);
    },
  });

  if (!isOpen || !event) return null;

  const status = getTicketStatus(event);
  const isPaid = event.paid === true || (event.amount && event.amount > 0);
  const amountFormatted = event.amount ? `$${Number(event.amount).toFixed(2)}` : "$99.00";

  const handleSimulateScan = () => {
    if (status.isScanned) {
      toast.info("This ticket is already checked in.");
      return;
    }
    const payload = {
      applicationId: event.applicationId,
      eventId: event._id,
      qrPayload: `${event._id}==${event.applicationId}`,
    };
    performCheckIn(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="relative bg-gradient-to-r from-primary-container via-purple-700 to-indigo-800 text-on-primary p-6 pb-5 flex items-start justify-between">
          <div className="flex flex-col gap-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">confirmation_number</span>
              <span className="text-xs font-semibold tracking-wider uppercase opacity-90">
                Official Digital Passport
              </span>
            </div>
            <h3 className="font-headline-md text-xl md:text-2xl font-bold tracking-tight text-white line-clamp-1">
              {event.subEvent || event.appliedTo || event.title}
            </h3>
            <p className="text-xs text-white/90">
              Organizing Event: <span className="font-semibold">{event.organizingEventTitle || event.title}</span>
            </p>
            <p className="text-xs text-white/80 font-mono">
              Ref: {event.reference || `#LUM-${String(event.applicationId || event._id).slice(-5).toUpperCase()}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close ticket modal"
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[calc(85vh-100px)]">
          {/* Status Badges Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Expiry Status */}
            <div
              className={`p-3 rounded-xl border flex flex-col gap-1 ${
                status.isExpired
                  ? "bg-zinc-900/50 border-zinc-700/60 text-zinc-300"
                  : "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                  QR Expiry
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    status.isExpired ? "bg-zinc-400" : "bg-emerald-400 animate-pulse"
                  }`}
                />
              </div>
              <span className="font-headline-sm text-base font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">
                  {status.isExpired ? "timer_off" : "timer"}
                </span>
                {status.expiryStatus}
              </span>
              <span className="text-[11px] text-outline">
                {status.isExpired
                  ? "Event ended (expired at end time)"
                  : "Active until event end time"}
              </span>
            </div>

            {/* Check-In Status */}
            <div
              className={`p-3 rounded-xl border flex flex-col gap-1 ${
                status.isScanned
                  ? "bg-indigo-950/30 border-indigo-500/30 text-indigo-300"
                  : "bg-amber-950/30 border-amber-500/30 text-amber-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                  Check-In
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    status.isScanned ? "bg-indigo-400" : "bg-amber-400"
                  }`}
                />
              </div>
              <span className="font-headline-sm text-base font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">
                  {status.isScanned ? "verified" : "qr_code_scanner"}
                </span>
                {status.isScanned ? "SCANNED" : "NOT_SCANNED"}
              </span>
              <span className="text-[11px] text-outline truncate">
                {status.isScanned
                  ? status.scannedAt
                    ? `Checked in at ${new Date(status.scannedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Checked In at gate"
                  : "Ready to scan at venue"}
              </span>
            </div>
          </div>

          {/* Combined Status Summary Banner */}
          <div className="px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-medium">Ticket State:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                status.compositeVariant === "active-unscanned"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : status.compositeVariant === "active-scanned"
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                  : status.compositeVariant === "expired-unscanned"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-zinc-500/15 text-zinc-300 border border-zinc-500/30"
              }`}
            >
              {status.compositeLabel}
            </span>
          </div>

          {/* Persisted QR Code Display Container */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 flex flex-col items-center justify-center text-center gap-3">
            <div className="p-3.5 bg-white rounded-xl shadow-lg flex items-center justify-center">
              {event.qrCodeUrl ? (
                <img
                  src={event.qrCodeUrl}
                  alt={`QR Code for ${event.title}`}
                  className={`w-52 h-52 object-contain rounded-md transition-opacity duration-300 ${
                    status.isExpired ? "opacity-60 grayscale" : "opacity-100"
                  }`}
                />
              ) : (
                <div className="w-52 h-52 flex flex-col items-center justify-center text-zinc-400 gap-2">
                  <span className="material-symbols-outlined text-4xl animate-spin">
                    progress_activity
                  </span>
                  <span className="text-xs font-medium">Retrieving persisted QR...</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-semibold text-on-surface">
                {event.applicationId
                  ? `TICKET ID: ${event.applicationId}`
                  : `REF: ${event.reference}`}
              </span>
              <p className="text-[11px] text-on-surface-variant max-w-xs">
                {status.isExpired
                  ? "This ticket has reached its end time and is expired."
                  : status.isScanned
                  ? "This ticket has already been verified and checked in."
                  : "Present this single persisted QR code upon entry at the reception counter."}
              </p>
            </div>
          </div>

          {/* Event Schedule & Details */}
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20 flex flex-col gap-2.5 text-xs text-on-surface">
            {(event.subEvent || event.appliedTo) && (
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">category</span>
                  Sub-event Track
                </span>
                <span className="font-bold text-primary-container truncate max-w-[200px]">
                  {event.subEvent || event.appliedTo}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">calendar_today</span>
                Event Date
              </span>
              <span className="font-semibold">{event.eventDate || "Date TBD"}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">schedule</span>
                Timing
              </span>
              <span className="font-semibold">
                {event.startTime ? `${event.startTime} - ` : ""}
                {event.endTime || "TBD"}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">pin_drop</span>
                Venue
              </span>
              <span className="font-semibold truncate max-w-[200px]">
                {event.location || "ACN. Hall Studio"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">person</span>
                Attendee
              </span>
              <span className="font-semibold">
                {currentUser?.userName || "Alex Rivera"}
              </span>
            </div>
          </div>

          {/* Organizer / Gate Scan Simulation Action (for validation & testing) */}
          {event.applicationId && (
            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                disabled={isCheckingIn || status.isScanned}
                onClick={handleSimulateScan}
                className={`w-full py-2.5 px-4 rounded-xl font-label-md text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                  status.isScanned
                    ? "bg-surface-container-high text-outline cursor-not-allowed border border-outline-variant/20"
                    : "bg-primary-container text-on-primary hover:bg-surface-tint active:scale-[0.98]"
                }`}
              >
                {isCheckingIn ? (
                  <>
                    <Spinner size="sm" />
                    <span>Validating check-in...</span>
                  </>
                ) : status.isScanned ? (
                  <>
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Already Checked In (Cannot scan again)</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                    <span>Simulate Entry Scan &amp; Check In</span>
                  </>
                )}
              </button>
              <span className="text-[10px] text-center text-outline">
                Simulates venue scanner validation: updates check-in to SCANNED and prevents repeat scans.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketQRModal;
