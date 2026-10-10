import React, { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getEventAttendance, markEventAttendance } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/Spinner";

const AttendancePage = () => {
  const { eventId, title: paramTitle } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'present' | 'absent'

  // Scanner state & Synchronous lock
  const html5QrCodeRef = useRef(null);
  const isScanLockedRef = useRef(false);
  const lastScannedCodeRef = useRef("");
  const lastScanTimeRef = useRef(0);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Dedicated persistent scan result state
  const [scanResult, setScanResult] = useState(null);

  // Fetch Event Attendance Roster
  const {
    data: attendanceData,
    isLoading,
    isError,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ["attendance", eventId],
    queryFn: () => getEventAttendance(eventId),
    enabled: !!eventId && !!user,
  });

  const eventTitle =
    attendanceData?.event?.title || paramTitle || "Event Attendance & Gate Check-in";
  const attendances = useMemo(
    () => attendanceData?.attendances || [],
    [attendanceData?.attendances]
  );

  const presentCount = useMemo(
    () => attendances.filter((a) => a.isAttended === true).length,
    [attendances]
  );
  const totalCount = attendances.length;
  const absentCount = totalCount - presentCount;

  // Processing state for row-specific manual check-in
  const [processingApplicantId, setProcessingApplicantId] = useState(null);

  // Scan Attendance Mutation
  const {
    mutate: performScan,
    isPending: isScanning,
  } = useMutation({
    mutationKey: ["mark-attendance", eventId],
    mutationFn: markEventAttendance,
    onSuccess: async (res, variables) => {
      // 1. Refetch attendance data from the backend so the UI updates only after the request is confirmed successful
      await queryClient.invalidateQueries({ queryKey: ["attendance", eventId] });
      await refetch();

      const scannedData = res?.data;
      const attendeeName = scannedData?.userName || "Attendee";
      const regId = scannedData?.registrationId || scannedData?._id || "N/A";
      const track = scannedData?.appliedTo || "General Entry";
      const scannedTime = scannedData?.scannedAt || scannedData?.checkIn?.scannedAt || new Date();

      toast.success(res?.message || `Checked in ${attendeeName}!`);

      // 2. Update scan result card in UI only after the backend request was confirmed successful
      setScanResult({
        type: "success",
        statusBadge: "Checked In",
        title: "Entry Verified & Approved",
        message: res?.message || "Attendance marked successfully in database.",
        timestamp: new Date(),
        attendee: {
          userName: attendeeName,
          registrationId: regId,
          status: "Present / Checked In",
          appliedTo: track,
          email: scannedData?.email || "N/A",
          profile_image_url: scannedData?.profile_image_url || "",
          scannedAt: scannedTime,
        },
      });

      // 3. Mark last scanned code to avoid immediate re-triggering of the exact same pass
      const qrPayload = variables?.decodedText?.qrPayload || variables?.decodedText?.applicationId || "";
      lastScannedCodeRef.current = String(qrPayload).trim();
      lastScanTimeRef.current = Date.now();

      setProcessingApplicantId(null);

      // 4. DO NOT PAUSE/STOP THE SCANNER ON SUCCESS.
      // Scanner stays active and ready to scan the next pass after a brief 800ms debounce
      setTimeout(() => {
        isScanLockedRef.current = false;
      }, 800);
    },
    onError: async (err) => {
      setProcessingApplicantId(null);

      // On duplicate scan (409), invalid QR, or any error: PAUSE/STOP the scanner
      await stopScanner();

      const status = err?.response?.status;
      const resData = err?.response?.data;

      if (status === 409) {
        // HTTP 409 Conflict: Ticket has already been scanned
        const attendeeData = resData?.data || resData?.ticket?.user;
        const attendeeName = attendeeData?.userName || "Attendee";
        const regId = attendeeData?.registrationId || attendeeData?._id || resData?.ticket?.applicationId || "N/A";
        const track = attendeeData?.appliedTo || "General Entry";
        const scannedTime =
          resData?.scannedAt ||
          resData?.checkIn?.scannedAt ||
          attendeeData?.scannedAt ||
          attendeeData?.checkIn?.scannedAt ||
          new Date();

        setScanResult({
          type: "already_scanned",
          statusBadge: "Already checked in",
          title: "Ticket Already Used",
          message: resData?.message || "Ticket has already been scanned and checked in.",
          timestamp: new Date(),
          attendee: {
            userName: attendeeName,
            registrationId: regId,
            status: "Already checked in",
            appliedTo: track,
            email: attendeeData?.email || "N/A",
            profile_image_url: attendeeData?.profile_image_url || "",
            scannedAt: scannedTime,
          },
        });
        toast.warning(resData?.message || "Ticket has already been checked in!");
      } else if (status === 404) {
        setScanResult({
          type: "invalid_qr",
          statusBadge: "Invalid QR Code",
          title: "Ticket Not Found",
          message: resData?.message || "No registration found in the system for this QR code.",
          timestamp: new Date(),
          attendee: null,
        });
        toast.error("Invalid QR Code: Registration not found");
      } else if (status === 400) {
        setScanResult({
          type: "invalid_qr",
          statusBadge: "Invalid QR Code",
          title: "Ticket Rejected",
          message: resData?.message || "Invalid ticket QR code data or ticket does not belong to this event.",
          timestamp: new Date(),
          attendee: null,
        });
        toast.error(resData?.message || "Invalid QR code format");
      } else if (status === 403) {
        setScanResult({
          type: "unauthorized",
          statusBadge: "Unauthorized Access",
          title: "Permission Denied",
          message: resData?.message || "You are not authorized to mark attendance for this event.",
          timestamp: new Date(),
          attendee: null,
        });
        toast.error("Unauthorized: Host access required");
      } else if (!err?.response) {
        setScanResult({
          type: "network_error",
          statusBadge: "Network Error",
          title: "Connection Failed",
          message: "Unable to reach the server. Please check your network connection and retry.",
          timestamp: new Date(),
          attendee: null,
        });
        toast.error("Network error: Server unreachable");
      } else {
        setScanResult({
          type: "error",
          statusBadge: "System Error",
          title: "Verification Failed",
          message: resData?.message || err?.message || "An unexpected error occurred while verifying the ticket.",
          timestamp: new Date(),
          attendee: null,
        });
        toast.error(resData?.message || "Check-in verification failed");
      }
    },
    onSettled: () => {
      setProcessingApplicantId(null);
    },
  });

  // Scanner Lifecycle
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState?.();
        // State 2 is SCANNING in html5-qrcode
        if (state === 2 || html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.error("Camera Stop Error", err);
      }
    }
    setIsScannerRunning(false);
  };

  const handleQrDetected = async (decodedText) => {
    const rawCode = String(decodedText || "").trim();
    if (!rawCode) return;

    // Synchronous lock check: ignore duplicate frames while request is in-flight
    if (isScanLockedRef.current) return;

    // Prevent immediate re-triggering of the exact same code within 3.5 seconds
    if (
      lastScannedCodeRef.current === rawCode &&
      Date.now() - lastScanTimeRef.current < 3500
    ) {
      return;
    }

    isScanLockedRef.current = true;

    // Note: Do NOT stop the camera here; keep scanner active if scan is successful
    try {
      let decodedEvent = eventId;
      let appId = rawCode;

      if (rawCode.includes("==")) {
        const [partEv, partApp] = rawCode.split("==");
        decodedEvent = partEv?.trim();
        appId = partApp?.trim();
      }

      performScan({
        eventId: decodedEvent,
        decodedText: {
          eventId: decodedEvent,
          applicationId: appId,
          qrPayload: rawCode,
        },
      });
    } catch (err) {
      console.error("QR Parse Error", err);
      // Malformed/unparsable QR: pause/stop scanner
      await stopScanner();
      setScanResult({
        type: "invalid_qr",
        statusBadge: "Invalid QR Code",
        title: "Malformed QR Payload",
        message: "Unable to parse ticket information from this QR code.",
        timestamp: new Date(),
        attendee: null,
      });
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    isScanLockedRef.current = false;

    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("reader");
    }

    try {
      const config = { fps: 15, qrbox: { width: 260, height: 260 } };
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => handleQrDetected(decodedText),
        () => {
          // ignore frames without QR
        }
      );
      setIsScannerRunning(true);
    } catch (err) {
      console.error("Camera Start Error (environment)", err);
      // Fallback to front camera if environment not found
      try {
        const config = { fps: 15, qrbox: { width: 260, height: 260 } };
        await html5QrCodeRef.current.start(
          { facingMode: "user" },
          config,
          (decodedText) => handleQrDetected(decodedText),
          () => {}
        );
        setIsScannerRunning(true);
      } catch (fallbackErr) {
        setCameraError(
          fallbackErr?.message || "Camera access permission denied or unavailable"
        );
        toast.error("Could not access camera. Please allow camera permissions.");
      }
    }
  };

  // Operator manual trigger to scan next ticket
  const handleScanNextTicket = () => {
    isScanLockedRef.current = false;
    lastScannedCodeRef.current = "";
    lastScanTimeRef.current = 0;
    setCameraError(null);
    startScanner();
  };

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("reader");
    return () => {
      if (html5QrCodeRef.current) {
        try {
          const state = html5QrCodeRef.current.getState?.();
          if (state === 2 || html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
        } catch (_) {}
      }
    };
  }, []);

  // Filtered Attendees list
  const filteredAttendances = useMemo(() => {
    let list = [...attendances];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.userName?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          String(a.appliedTo).toLowerCase().includes(q) ||
          String(a._id).toLowerCase().includes(q)
      );
    }

    if (statusFilter === "present") {
      list = list.filter((a) => a.isAttended);
    } else if (statusFilter === "absent") {
      list = list.filter((a) => !a.isAttended);
    }

    return list;
  }, [attendances, searchQuery, statusFilter]);

  // Handle Manual Quick Check-In
  const handleManualCheckIn = async (applicant) => {
    if (applicant.isAttended) {
      toast.info("Attendee is already checked in.");
      return;
    }
    if (isScanLockedRef.current || isScanning) return;
    isScanLockedRef.current = true;
    setProcessingApplicantId(applicant._id);
    await stopScanner();

    performScan({
      eventId,
      decodedText: {
        eventId,
        applicationId: applicant._id,
        qrPayload: `${eventId}==${applicant._id}`,
      },
    });
  };

  // Authorization or Critical Error State
  if (isError) {
    const isForbidden = fetchError?.response?.status === 403;
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 text-center flex flex-col items-center gap-4 shadow-xl">
          <span className="material-symbols-outlined text-5xl text-error">
            {isForbidden ? "lock" : "error"}
          </span>
          <h2 className="text-xl font-extrabold text-on-surface">
            {isForbidden ? "Access Denied" : "Failed to load attendance"}
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isForbidden
              ? "Only the event host or verified organizers have permission to manage gate check-ins and view attendance rosters for this event."
              : fetchError?.response?.data?.message ||
                "There was an issue retrieving the attendance data from the server."}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => navigate(`/events/${eventId}`)}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
            >
              Back to Event
            </button>
            {!isForbidden && (
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:bg-surface-tint transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col selection:bg-primary-container selection:text-on-primary">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/events/${eventId}`)}
              className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface flex items-center justify-center transition-colors shrink-0 shadow-sm"
              title="Return to event page"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-container bg-primary-container/15 px-2 py-0.5 rounded">
                  Gate Management
                </span>
                <span className="text-xs text-on-surface-variant">Live Verification</span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold text-on-surface truncate">
                {eventTitle}
              </h1>
            </div>
          </div>

          {/* Quick Metrics Header Pills */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs font-semibold">
              <span className="text-on-surface-variant">Total:</span>
              <span className="text-on-surface">{totalCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Present: {presentCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Absent: {absentCount}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Attendee Roster Table (7 cols on lg) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-xl">
                groups
              </span>
              <h2 className="text-lg font-bold text-on-surface">Registered Attendees</h2>
              <span className="text-xs text-on-surface-variant font-medium">
                ({filteredAttendances.length})
              </span>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-primary-container text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("present")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  statusFilter === "present"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span>Present</span>
                <span className="text-[10px] opacity-80">({presentCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("absent")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  statusFilter === "absent"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span>Absent</span>
                <span className="text-[10px] opacity-80">({absentCount})</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search by attendee name, email, or track..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface placeholder:text-outline border border-outline-variant/20 focus:outline-none focus:border-primary-container"
            />
          </div>

          {/* Table Container */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm flex flex-col">
            <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider text-[10px] z-10">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Attendee</th>
                    <th className="py-3 px-4">Sub-event Track</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {isLoading && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-outline">
                        <div className="flex flex-col items-center gap-2">
                          <Spinner size="md" />
                          <span>Loading attendance roster...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoading && filteredAttendances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-outline">
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-3xl">search_off</span>
                          <span className="font-semibold text-on-surface">
                            No attendees found
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {searchQuery
                              ? "Try adjusting your search criteria"
                              : "No attendee registrations found for this event"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    filteredAttendances.map((applicant, idx) => {
                      const isPresent = applicant.isAttended;
                      return (
                        <tr
                          key={applicant._id || idx}
                          className={`hover:bg-surface-container-high/40 transition-colors ${
                            isPresent ? "bg-emerald-950/10" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-outline font-mono">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {applicant.profile_image_url ? (
                                <img
                                  src={applicant.profile_image_url}
                                  alt={applicant.userName}
                                  className="w-7 h-7 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-primary-container/20 text-primary-container font-bold text-xs flex items-center justify-center shrink-0">
                                  {applicant.userName?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-on-surface truncate">
                                  {applicant.userName}
                                </span>
                                <span className="text-[11px] text-on-surface-variant truncate">
                                  {applicant.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-on-surface-variant">
                            <span className="inline-block px-2 py-0.5 rounded bg-surface-container text-[11px] font-semibold text-on-surface max-w-[150px] truncate">
                              {applicant.appliedTo || "General Entry"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                isPresent
                                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                                  : "bg-amber-950/40 text-amber-300 border-amber-500/30"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPresent ? "bg-emerald-400" : "bg-amber-400"
                                }`}
                              />
                              <span>{isPresent ? "Present" : "Absent"}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isPresent ? (
                              <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                                <span className="material-symbols-outlined text-sm">verified</span>
                                <span>Checked In</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleManualCheckIn(applicant)}
                                disabled={isScanning}
                                className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-tint hover:text-on-primary text-[11px] font-semibold text-on-surface transition-all shadow-sm active:scale-95 disabled:opacity-60 flex items-center gap-1.5 ml-auto"
                              >
                                {isScanning && processingApplicantId === applicant._id ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  "Mark Present"
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Column: Live QR Code Scanner & Realtime Result (5 cols on lg) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-md flex flex-col items-center gap-5">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-xl">
                  qr_code_scanner
                </span>
                <h3 className="text-base font-bold text-on-surface">Live Ticket Scanner</h3>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isScannerRunning
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 animate-pulse"
                    : "bg-surface-container text-outline border-outline-variant/30"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isScannerRunning ? "bg-emerald-400" : "bg-outline"
                  }`}
                />
                <span>{isScannerRunning ? "Camera Active" : "Camera Standby"}</span>
              </span>
            </div>

            {/* Video Viewport Box */}
            <div className="relative w-full aspect-square max-w-[320px] bg-black/90 rounded-2xl overflow-hidden border-2 border-dashed border-outline-variant/40 flex flex-col items-center justify-center shadow-inner">
              <div id="reader" className="w-full h-full" />

              {!isScannerRunning && (
                <div className="absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-3">
                  <span className="material-symbols-outlined text-5xl text-outline">
                    {scanResult?.type === "invalid_qr"
                      ? "qr_code_scanner"
                      : scanResult?.type === "already_scanned"
                      ? "warning"
                      : "camera_alt"}
                  </span>
                  <p className="text-xs text-on-surface-variant font-medium max-w-[220px]">
                    {scanResult
                      ? "Scanner is paused. Click below to scan the next attendee pass."
                      : "Position an attendee QR pass in front of the lens for instant gate entry verification."}
                  </p>
                  <button
                    type="button"
                    onClick={handleScanNextTicket}
                    disabled={isScanning}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-semibold text-xs shadow-md hover:bg-surface-tint active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">
                      {scanResult ? "refresh" : "videocam"}
                    </span>
                    <span>{scanResult ? "Scan Next Ticket" : "Start Camera"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Controls */}
            {isScannerRunning && (
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={stopScanner}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-error/10 hover:bg-error/20 text-error font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">videocam_off</span>
                  <span>Stop Camera</span>
                </button>
              </div>
            )}

            {cameraError && (
              <p className="text-[11px] text-error text-center font-medium">
                {cameraError}
              </p>
            )}
          </div>

          {/* Scanner Feedback Box */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">history</span>
                <span>Recent Scan Result</span>
              </h4>

              {scanResult && !isScannerRunning && (
                <button
                  type="button"
                  onClick={handleScanNextTicket}
                  disabled={isScanning}
                  className="text-xs text-primary-container hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                  <span>Scan Next</span>
                </button>
              )}
            </div>

            {isScanning && (
              <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-center gap-2 text-xs text-on-surface-variant animate-pulse">
                <Spinner size="sm" />
                <span>Verifying ticket registration...</span>
              </div>
            )}

            {!isScanning && scanResult && (
              <div
                className={`p-4 rounded-xl border flex flex-col gap-3 animate-fade-in ${
                  scanResult.type === "success"
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : scanResult.type === "already_scanned"
                    ? "bg-amber-950/20 border-amber-500/30"
                    : "bg-error/10 border-error/30"
                }`}
              >
                {/* Header Status Badge Row */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${
                      scanResult.type === "success"
                        ? "text-emerald-400 bg-emerald-950/60 border-emerald-500/30"
                        : scanResult.type === "already_scanned"
                        ? "text-amber-400 bg-amber-950/60 border-amber-500/30"
                        : "text-error bg-error/20 border-error/30"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {scanResult.type === "success"
                        ? "verified"
                        : scanResult.type === "already_scanned"
                        ? "warning"
                        : "cancel"}
                    </span>
                    <span>{scanResult.statusBadge}</span>
                  </span>

                  <span className="text-[10px] text-outline font-mono">
                    {new Date(scanResult.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>

                {/* Attendee Details Card (Rendered for both Success and Already Checked In) */}
                {scanResult.attendee ? (
                  <div className="flex flex-col gap-2 pt-1 border-t border-outline-variant/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-outline uppercase tracking-wider font-semibold">
                          Attendee Name
                        </span>
                        <h4 className="text-base font-extrabold text-on-surface truncate">
                          {scanResult.attendee.userName}
                        </h4>
                        <span className="text-xs text-on-surface-variant truncate">
                          {scanResult.attendee.email}
                        </span>
                      </div>

                      {scanResult.attendee.profile_image_url && (
                        <img
                          src={scanResult.attendee.profile_image_url}
                          alt={scanResult.attendee.userName}
                          className="w-9 h-9 rounded-full object-cover border border-outline-variant/30 shrink-0"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-outline uppercase tracking-wider">
                          Registration ID
                        </span>
                        <span className="font-mono text-on-surface text-[11px] truncate">
                          #{String(scanResult.attendee.registrationId).slice(-8).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-outline uppercase tracking-wider">
                          Attendance Status
                        </span>
                        <span
                          className={`font-semibold text-xs ${
                            scanResult.type === "success"
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }`}
                        >
                          {scanResult.attendee.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs text-on-surface-variant">
                      <span className="inline-block px-2 py-0.5 rounded bg-surface-container text-[11px] font-semibold text-on-surface">
                        Track: {scanResult.attendee.appliedTo}
                      </span>
                      {scanResult.attendee.scannedAt && (
                        <span className="text-[10px] text-outline font-mono">
                          {scanResult.type === "already_scanned" ? "First scanned: " : "Scanned: "}
                          {new Date(scanResult.attendee.scannedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    {scanResult.type === "already_scanned" && (
                      <p className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2 rounded-lg border border-amber-500/20 font-medium leading-relaxed mt-1">
                        ⚠️ <b>Already checked in:</b> This registration pass has already been marked present and cannot be reused.
                      </p>
                    )}
                  </div>
                ) : (
                  /* Error / Invalid QR outcome */
                  <div className="flex flex-col gap-1.5 pt-1 border-t border-outline-variant/20">
                    <h5 className="text-sm font-bold text-on-surface">
                      {scanResult.title}
                    </h5>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {scanResult.message}
                    </p>
                    <p className="text-[11px] text-outline mt-1 italic">
                      Camera scanner paused. Check ticket origin or click below to scan next attendee.
                    </p>
                  </div>
                )}

                {/* Quick Action Button within Result */}
                {!isScannerRunning && (
                  <button
                    type="button"
                    onClick={handleScanNextTicket}
                    className="mt-1 w-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                    <span>Scan Next Ticket</span>
                  </button>
                )}
              </div>
            )}

            {!isScanning && !scanResult && (
              <div className="text-center py-6 flex flex-col items-center gap-1 text-outline">
                <span className="material-symbols-outlined text-3xl">qr_code</span>
                <p className="text-xs">No tickets scanned yet during this session.</p>
                <p className="text-[11px] text-on-surface-variant">
                  Start the camera above to begin gate verification.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AttendancePage;
