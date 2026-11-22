import { useState, useMemo } from "react";
import { useParams, useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiEdit2,
  FiCalendar,
  FiClock,
  FiUser,
  FiUserPlus,
  FiTrash2,
  FiInfo,
  FiAlertCircle,
  FiX,
  FiShield,
  FiLayers,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiCheck,
  FiCopy,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiDollarSign,
} from "react-icons/fi";
import {
  Fetchevent,
  getGroupByEventId,
  addModerator,
  removeModerator,
  deleteEvent,
  getEventPaymentHistory,
} from "../services/api";
import { useAuth } from "../hooks/useAuth.jsx";
import Avatar from "../components/Avatar.jsx";
import Spinner from "../components/Spinner.jsx";

const ManageEvent = () => {
  const { eventId, id } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const queryEventId = searchParams.get("eventId") || searchParams.get("id");
  const storedEventId = typeof window !== "undefined" ? localStorage.getItem("lastManageEventId") : null;
  const currentEventId = eventId || id || queryEventId || storedEventId;

  // Persist currentEventId if valid
  if (currentEventId && typeof window !== "undefined") {
    try {
      localStorage.setItem("lastManageEventId", currentEventId);
    } catch (_) {}
  }

  // Determine if active view is Payment History
  const isPaymentsView =
    location.pathname.includes("view=payments") ||
    location.pathname.endsWith("/payments") ||
    searchParams.get("view") === "payments";

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // State for Add Moderator Modal
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [moderatorEmail, setModeratorEmail] = useState("");
  const [modalError, setModalError] = useState("");

  // State for Remove Moderator Confirmation Modal
  const [removeTarget, setRemoveTarget] = useState(null); // { subEvent, moderator }

  // State for Delete Event Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // State for Payment History filters & copy feedback
  const [paymentSearch, setPaymentSearch] = useState("");
  const [subEventFilter, setSubEventFilter] = useState("all");
  const [copiedTxId, setCopiedTxId] = useState(null);

  // 1. Fetch Event details
  const {
    data: eventData,
    isLoading: isEventLoading,
    error: eventError,
  } = useQuery({
    queryKey: ["getevents", currentEventId],
    queryFn: () => Fetchevent(currentEventId),
    enabled: !!currentEventId,
  });

  const event = eventData?.event;

  // 2. Fetch Sub-event groups
  const {
    data: subEventGroups,
    isLoading: isGroupsLoading,
    error: groupsError,
  } = useQuery({
    queryKey: ["getGroupByEventId", currentEventId],
    queryFn: () => getGroupByEventId(currentEventId),
    enabled: !!currentEventId,
  });

  // 3. Fetch Payment history for this event
  const {
    data: paymentData,
    isLoading: isPaymentsLoading,
    isRefetching: isPaymentsRefetching,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ["getEventPaymentHistory", currentEventId],
    queryFn: () => getEventPaymentHistory(currentEventId),
    enabled: !!currentEventId,
  });

  const payments = useMemo(() => {
    return Array.isArray(paymentData?.payments) ? paymentData.payments : [];
  }, [paymentData]);

  // Authorization checks
  const currentUserId = user?._id ? String(user._id) : null;
  const eventCreatorId = event?.userId?._id
    ? String(event.userId._id)
    : event?.userId
      ? String(event.userId)
      : null;

  // Event Host / Admin (creator, platform admin, or group admin)
  const isEventAdmin = Boolean(
    currentUserId &&
    (currentUserId === eventCreatorId ||
      user?.role === "admin" ||
      (Array.isArray(subEventGroups) &&
        subEventGroups.some((g) => {
          const groupAdminId = g?.admin?._id
            ? String(g.admin._id)
            : g?.admin
              ? String(g.admin)
              : null;
          return groupAdminId && groupAdminId === currentUserId;
        })))
  );

  // Check if user is a moderator of ANY sub-event in this event
  const isSubEventModerator = Boolean(
    currentUserId &&
    Array.isArray(subEventGroups) &&
    subEventGroups.some((g) => {
      const isMod =
        g?.isModerator === true ||
        (Array.isArray(g?.moderators) &&
          g.moderators.some((m) => {
            const modId = m?._id ? String(m._id) : m ? String(m) : null;
            return modId && modId === currentUserId;
          }));
      return Boolean(isMod);
    })
  );

  // Users permitted to access the settings page: Event Admin or Sub-Event Moderator
  const canAccessSettings = Boolean(isEventAdmin || isSubEventModerator);

  // Filter sub-events (exclude head group)
  const tracks = (subEventGroups || []).filter((g) => !g.isHead);

  // Copy transaction ID to clipboard
  const handleCopyTx = (txId) => {
    if (!txId || txId === "N/A") return;
    navigator.clipboard?.writeText(txId);
    setCopiedTxId(txId);
    toast.success("Transaction ID copied to clipboard!");
    setTimeout(() => setCopiedTxId(null), 2500);
  };

  // Filtered payments by search & track
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (subEventFilter !== "all") {
        const matchesTrack =
          p.subevent?.toLowerCase().includes(subEventFilter.toLowerCase()) ||
          (Array.isArray(p.subEvents) &&
            p.subEvents.some((s) => s?.toLowerCase() === subEventFilter.toLowerCase()));
        if (!matchesTrack) return false;
      }

      if (paymentSearch.trim()) {
        const q = paymentSearch.toLowerCase().trim();
        const matchesUser = p.username?.toLowerCase().includes(q);
        const matchesEmail = p.email?.toLowerCase().includes(q);
        const matchesPhone = p.phone?.toLowerCase().includes(q);
        const matchesTx = p.transactionId?.toLowerCase().includes(q);
        const matchesOrder = p.orderId?.toLowerCase().includes(q);
        const matchesSubevent = p.subevent?.toLowerCase().includes(q);
        return Boolean(
          matchesUser || matchesEmail || matchesPhone || matchesTx || matchesOrder || matchesSubevent
        );
      }

      return true;
    });
  }, [payments, paymentSearch, subEventFilter]);

  const totalCollectedRevenue = useMemo(() => {
    return payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [payments]);

  const uniqueAttendeesCount = useMemo(() => {
    const set = new Set(payments.map((p) => p.userId || p.email || p.username).filter(Boolean));
    return set.size;
  }, [payments]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error("No payment data available to export");
      return;
    }
    const headers = [
      "Username",
      "Email",
      "Phone",
      "Subevent",
      "Amount (INR)",
      "Transaction ID",
      "Order ID",
      "Status",
      "Date & Time",
    ];
    const rows = filteredPayments.map((p) => [
      `"${p.username || ""}"`,
      `"${p.email || ""}"`,
      `"${p.phone || ""}"`,
      `"${p.subevent || ""}"`,
      p.amount || 0,
      `"${p.transactionId || ""}"`,
      `"${p.orderId || ""}"`,
      `"${p.status || "paid"}"`,
      `"${p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN") : ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${event?.title || "event"}_payment_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Payment history exported successfully!");
  };

  // Mutation to Add Moderator
  const addModeratorMutation = useMutation({
    mutationFn: addModerator,
    onSuccess: (data) => {
      toast.success(data?.message || "Moderator added successfully!");
      queryClient.invalidateQueries({ queryKey: ["getGroupByEventId", currentEventId] });
      closeAddModal();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to add moderator";
      setModalError(msg);
      toast.error(msg);
    },
  });

  // Mutation to Remove Moderator
  const removeModeratorMutation = useMutation({
    mutationFn: removeModerator,
    onSuccess: (data) => {
      toast.success(data?.message || "Moderator removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["getGroupByEventId", currentEventId] });
      setRemoveTarget(null);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to remove moderator";
      toast.error(msg);
    },
  });

  // Mutation to Delete Event and its data
  const deleteEventMutation = useMutation({
    mutationFn: () => deleteEvent(currentEventId),
    onSuccess: (data) => {
      toast.success(data?.message || "Event deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["getevents"] });
      queryClient.removeQueries({ queryKey: ["getevents", currentEventId] });
      queryClient.removeQueries({ queryKey: ["getGroupByEventId", currentEventId] });
      setIsDeleteModalOpen(false);
      navigate("/events", { replace: true });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to delete event";
      toast.error(msg);
    },
  });

  const openAddModal = (subEvent) => {
    if (!isEventAdmin) return;
    setSelectedSubEvent(subEvent);
    setModeratorEmail("");
    setModalError("");
  };

  const closeAddModal = () => {
    setSelectedSubEvent(null);
    setModeratorEmail("");
    setModalError("");
  };

  const handleAddModeratorSubmit = (e) => {
    e.preventDefault();
    if (!isEventAdmin) {
      setModalError("Only event admin can add moderators.");
      return;
    }
    if (!selectedSubEvent || !moderatorEmail.trim()) {
      setModalError("Please enter a valid email address.");
      return;
    }
    setModalError("");
    addModeratorMutation.mutate({
      groupId: selectedSubEvent._id,
      email: moderatorEmail.trim(),
    });
  };

  const confirmRemoveModerator = () => {
    if (!isEventAdmin || !removeTarget) return;
    const { subEvent, moderator } = removeTarget;
    const groupId = subEvent?._id || subEvent?.id;
    const moderatorId = moderator?._id || moderator;
    if (!groupId || !moderatorId) {
      toast.error("Unable to identify sub-event or moderator ID");
      return;
    }
    removeModeratorMutation.mutate({
      groupId,
      moderatorId,
    });
  };

  if (isEventLoading || isGroupsLoading) {
    return (
      <div className="w-full min-h-screen bg-surface flex flex-col items-center justify-center pt-16">
        <Spinner />
        <p className="mt-4 text-sm text-on-surface-variant font-medium">Loading event details...</p>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="w-full min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center font-poppins pt-16">
        <FiAlertCircle className="text-5xl text-red-500 mb-3" />
        <h2 className="text-2xl font-bold text-on-surface">Event Not Found</h2>
        <p className="text-on-surface-variant mt-1 text-sm max-w-md">
          The event you are trying to manage does not exist or has been removed.
        </p>
        <Link
          to="/events"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-semibold text-sm hover:brightness-110 transition shadow-sm"
        >
          <FiArrowLeft /> Back to Events
        </Link>
      </div>
    );
  }

  if (event && !canAccessSettings) {
    return (
      <div className="w-full min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center font-poppins pt-16">
        <FiAlertCircle className="text-5xl text-red-500 mb-3" />
        <h2 className="text-2xl font-bold text-on-surface">Access Denied</h2>
        <p className="text-on-surface-variant mt-1 text-sm max-w-md">
          You are not authorized to view the settings for this event. Only the event host and assigned moderators can access this page.
        </p>
        <Link
          to={`/events/${currentEventId}`}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-semibold text-sm hover:brightness-110 transition shadow-sm"
        >
          <FiArrowLeft /> Back to Event
        </Link>
      </div>
    );
  }

  const handleBack = () => {
    if (isPaymentsView) {
      navigate(`/events/${currentEventId}/settings`);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(`/events/${currentEventId}`, { replace: true });
    }
  };

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface font-poppins pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Top Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition shadow-sm group shrink-0"
              title="Back"
            >
              <FiArrowLeft
                size={18}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium flex-wrap">
                <Link to="/events" className="hover:underline">
                  Events
                </Link>
                {event?.title && (
                  <>
                    <span>/</span>
                    <Link
                      to={`/events/${currentEventId}`}
                      replace
                      className="hover:underline max-w-[200px] truncate"
                      title={event.title}
                    >
                      {event.title}
                    </Link>
                  </>
                )}
                <span>/</span>
                {isPaymentsView ? (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(`/events/${currentEventId}/settings`)}
                      className="hover:underline text-on-surface-variant"
                    >
                      Settings
                    </button>
                    <span>/</span>
                    <span className="text-primary-container font-semibold">
                      Payment History
                    </span>
                  </>
                ) : (
                  <span className="text-primary-container font-semibold">
                    Settings
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface mt-0.5">
                {isPaymentsView ? "Payment History" : "Settings"}
              </h1>
            </div>
          </div>

        </div>

        {/* Event Quick Summary Banner */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
            {event?.file ? (
              <img
                src={event.file}
                alt={event.title}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-outline-variant/30 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container font-bold text-2xl border border-outline-variant/30 shrink-0">
                <FiLayers size={36} />
              </div>
            )}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface leading-snug">
                {event.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                {event?.eventDate && (
                  <span className="flex items-center gap-1.5">
                    <FiCalendar className="text-primary-container" />
                    {new Date(event.eventDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                {event?.startTime && (
                  <span className="flex items-center gap-1.5">
                    <FiClock className="text-primary-container" />
                    {event.startTime} {event?.endTime ? `- ${event.endTime}` : ""}
                  </span>
                )}
                {event?.venue && (
                  <span className="flex items-center gap-1.5 text-on-surface">
                    <span className="material-symbols-outlined text-sm text-primary-container">apartment</span>
                    <span>{event.venue}</span>
                  </span>
                )}
                {event?.location && (
                  <a
                    href={event.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-container hover:underline font-medium"
                  >
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>Map Location</span>
                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                  </a>
                )}
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-surface-container border border-outline-variant/40">
                  {event?.paid ? `Paid (₹${event.amount || 0})` : "Free Event"}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant line-clamp-2 max-w-2xl">
                {event?.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
            {isEventAdmin && (
              <button
                type="button"
                onClick={() => navigate(`/events/${currentEventId}/edit`)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs sm:text-sm shadow-sm hover:brightness-110 transition active:scale-95"
              >
                <FiEdit2 size={16} />
                <span>Edit event information</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isPaymentsView) {
                  navigate(`/events/${currentEventId}/settings`);
                } else {
                  navigate(`/events/${currentEventId}/settings/view=payments`);
                }
              }}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95 ${
                isPaymentsView
                  ? "bg-primary-container text-on-primary-container hover:brightness-110"
                  : "bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface"
              }`}
            >
              <FiCreditCard size={16} className={isPaymentsView ? "" : "text-primary-container"} />
              <span>{isPaymentsView ? "Back to Settings" : "Payment History"}</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
          <button
            type="button"
            onClick={() => navigate(`/events/${currentEventId}/settings`)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              !isPaymentsView
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <FiShield size={16} />
            <span>Sub-events & Moderators</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/events/${currentEventId}/settings/view=payments`)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              isPaymentsView
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <FiCreditCard size={16} />
            <span>Payment History</span>
            {payments.length > 0 && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isPaymentsView
                    ? "bg-on-primary-container/20 text-on-primary-container"
                    : "bg-surface-container border border-outline-variant/30 text-on-surface-variant"
                }`}
              >
                {payments.length}
              </span>
            )}
          </button>
        </div>

        {isPaymentsView ? (
          /* ========================================================================= */
          /* PAYMENT HISTORY VIEW */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Header & Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Revenue */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FiDollarSign size={16} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-on-surface">
                  ₹{totalCollectedRevenue.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-on-surface-variant">Gross collected via Razorpay</p>
              </div>

              {/* Total Transactions */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Transactions</span>
                  <div className="w-8 h-8 rounded-lg bg-primary-container/15 text-primary-container flex items-center justify-center">
                    <FiCreditCard size={16} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-on-surface">
                  {payments.length}
                </div>
                <p className="text-[11px] text-on-surface-variant">Successful payment orders</p>
              </div>

              {/* Unique Attendees */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-xs font-semibold uppercase tracking-wider">Paying Attendees</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <FiUser size={16} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-on-surface">
                  {uniqueAttendeesCount}
                </div>
                <p className="text-[11px] text-on-surface-variant">Unique verified purchasers</p>
              </div>
            </div>

            {/* Search, Filter & Actions Bar */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
                {/* Search Input */}
                <div className="relative w-full sm:max-w-md">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search username, email, phone, or transaction ID..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 focus:border-primary-container focus:ring-1 focus:ring-primary-container text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none transition"
                  />
                  {paymentSearch && (
                    <button
                      type="button"
                      onClick={() => setPaymentSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>

                {/* Sub-event filter */}
                {tracks.length > 0 && (
                  <select
                    value={subEventFilter}
                    onChange={(e) => setSubEventFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs sm:text-sm text-on-surface focus:border-primary-container outline-none transition"
                  >
                    <option value="all">All Sub-events ({tracks.length})</option>
                    {tracks.map((t) => (
                      <option key={t._id || t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => refetchPayments()}
                  disabled={isPaymentsLoading || isPaymentsRefetching}
                  className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-on-surface transition active:scale-95"
                  title="Refresh payment records"
                >
                  <FiRefreshCw
                    size={16}
                    className={isPaymentsLoading || isPaymentsRefetching ? "animate-spin" : ""}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={filteredPayments.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-semibold text-xs shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  <FiDownload size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-5">Attendee / Username</th>
                      <th className="py-3.5 px-5">Email</th>
                      <th className="py-3.5 px-5">Phone Number</th>
                      <th className="py-3.5 px-5">Subevent Registered To</th>
                      <th className="py-3.5 px-5">Amount</th>
                      <th className="py-3.5 px-5">Transaction ID</th>
                      <th className="py-3.5 px-5">Status & Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {isPaymentsLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Spinner />
                            <p className="text-xs text-on-surface-variant">Loading payment records...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredPayments.length > 0 ? (
                      filteredPayments.map((payment, idx) => {
                        const isCopied = copiedTxId === payment.transactionId;
                        const formattedDate = payment.createdAt
                          ? new Date(payment.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—";

                        return (
                          <tr
                            key={payment._id || idx}
                            className="hover:bg-surface-container-low/40 transition-colors"
                          >
                            {/* Attendee / Username */}
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  size="sm"
                                  name={payment.username}
                                  imageUrl={payment.userProfileImage}
                                  disableNavigate={true}
                                />
                                <div>
                                  <div className="font-semibold text-on-surface text-sm">
                                    {payment.username}
                                  </div>
                                  {payment.userId && (
                                    <div className="text-[11px] text-on-surface-variant font-mono">
                                      ID: {String(payment.userId).slice(-6)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              {payment.email && payment.email !== "N/A" ? (
                                <a
                                  href={`mailto:${payment.email}`}
                                  className="inline-flex items-center gap-1.5 text-on-surface hover:text-primary-container font-medium transition"
                                >
                                  <FiMail className="text-on-surface-variant text-sm shrink-0" />
                                  <span>{payment.email}</span>
                                </a>
                              ) : (
                                <span className="text-on-surface-variant/60">—</span>
                              )}
                            </td>

                            {/* Phone Number */}
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              {payment.phone && payment.phone !== "N/A" ? (
                                <a
                                  href={`tel:${payment.phone}`}
                                  className="inline-flex items-center gap-1.5 text-on-surface hover:text-primary-container font-medium transition"
                                >
                                  <FiPhone className="text-on-surface-variant text-sm shrink-0" />
                                  <span>{payment.phone}</span>
                                </a>
                              ) : (
                                <span className="text-on-surface-variant/60">—</span>
                              )}
                            </td>

                            {/* Subevent Registered To */}
                            <td className="py-3.5 px-5">
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {Array.isArray(payment.subEvents) && payment.subEvents.length > 0 ? (
                                  payment.subEvents.map((se, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-container/15 text-primary-container border border-primary-container/20"
                                    >
                                      {se}
                                    </span>
                                  ))
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container border border-outline-variant/40 text-on-surface">
                                    {payment.subevent || "General Registration"}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Amount */}
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
                              </div>
                              <div className="text-[10px] text-on-surface-variant font-medium">
                                {payment.currency || "INR"}
                              </div>
                            </td>

                            {/* Transaction ID */}
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-surface-container px-2 py-1 rounded-lg border border-outline-variant/30 text-on-surface">
                                <span className="truncate max-w-[150px]">{payment.transactionId}</span>
                                {payment.transactionId && payment.transactionId !== "N/A" && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyTx(payment.transactionId)}
                                    className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface transition"
                                    title="Copy transaction ID"
                                  >
                                    {isCopied ? (
                                      <FiCheck size={12} className="text-emerald-500" />
                                    ) : (
                                      <FiCopy size={12} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Status & Date */}
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {payment.status || "PAID"}
                                </span>
                                <div className="text-[11px] text-on-surface-variant">
                                  {formattedDate}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 px-5 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant/60">
                              <FiCreditCard size={24} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-on-surface">
                                {paymentSearch || subEventFilter !== "all"
                                  ? "No Matching Payment Records"
                                  : "No Payments Recorded Yet"}
                              </h4>
                              <p className="text-xs text-on-surface-variant mt-1">
                                {paymentSearch || subEventFilter !== "all"
                                  ? "Try clearing your search query or choosing a different sub-event track."
                                  : "Payments made by attendees during registration for this event will appear here automatically."}
                              </p>
                            </div>
                            {(paymentSearch || subEventFilter !== "all") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentSearch("");
                                  setSubEventFilter("all");
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-primary-container transition active:scale-95"
                              >
                                Clear Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* SUB-EVENTS & MODERATORS VIEW + DANGER ZONE */
          /* ========================================================================= */
          <>
            {/* Sub-events & Moderators Section */}
            <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
            <div>
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <FiShield className="text-primary-container" />
                <span>Sub-events & Moderators</span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {isEventAdmin
                  ? "Assign moderators to specific sub-event tracks to help oversee check-ins and member requests."
                  : "View assigned moderators for each sub-event track."}
              </p>
            </div>
            <div className="text-xs text-on-surface-variant font-medium">
              Total tracks: <span className="font-bold text-on-surface">{tracks.length}</span>
            </div>
          </div>

          {tracks.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 text-center space-y-3">
              <FiLayers className="text-4xl text-on-surface-variant/40 mx-auto" />
              <h3 className="text-base font-bold text-on-surface">No Sub-events Found</h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                This event does not have any sub-events created yet. You can add technical or non-technical sub-events by editing the event.
              </p>
              {isEventAdmin && (
                <button
                  onClick={() => navigate(`/events/${currentEventId}/edit`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs shadow-sm hover:brightness-110 transition active:scale-95"
                >
                  <FiEdit2 size={14} /> Add Sub-events
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {tracks.map((subEvent, index) => {
                const moderators = Array.isArray(subEvent.moderators)
                  ? subEvent.moderators
                  : [];
                const limitDisplay =
                  subEvent.limit && subEvent.limit > 0
                    ? `${subEvent.limit} seats`
                    : "Unlimited seats";

                return (
                  <div
                    key={subEvent._id || index}
                    className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* Sub-event Card Header */}
                    <div className="bg-surface-container-low px-5 py-4 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-bold text-on-surface">
                              {subEvent.name}
                            </h3>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant">
                              {limitDisplay}
                            </span>
                            {subEvent.membersCount !== undefined && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                {subEvent.membersCount} Enrolled
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {moderators.length} moderator{moderators.length === 1 ? "" : "s"} assigned
                          </p>
                        </div>
                      </div>

                      {/* Add Moderator Button */}
                      {isEventAdmin && (
                        <button
                          onClick={() => openAddModal(subEvent)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs shadow-sm hover:brightness-110 transition active:scale-95"
                        >
                          <FiUserPlus size={15} />
                          <span>Add Moderator</span>
                        </button>
                      )}
                    </div>

                    {/* Moderators Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-container-lowest border-b border-outline-variant/20 text-on-surface-variant uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="py-3 px-5">Moderator</th>
                            <th className="py-3 px-5">Email</th>
                            <th className="py-3 px-5">Phone</th>
                            <th className="py-3 px-5">Role / Status</th>
                            {isEventAdmin && <th className="py-3 px-5 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/15">
                          {moderators.length > 0 ? (
                            moderators.map((mod, modIdx) => {
                              const modObj = typeof mod === "object" ? mod : { _id: mod };
                              const modName = modObj.userName || "Moderator";
                              const modEmail = modObj.email || "—";
                              const modPhone = modObj.phone || "—";

                              return (
                                <tr
                                  key={modObj._id || modIdx}
                                  className="hover:bg-surface-container-low/40 transition-colors"
                                >
                                  {/* Moderator info */}
                                  <td className="py-3 px-5 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <Avatar
                                        size="sm"
                                        name={modName}
                                        imageUrl={modObj.profile_image_url}
                                        disableNavigate={true}
                                      />
                                      <div>
                                        <div className="font-semibold text-on-surface text-sm">
                                          {modName}
                                        </div>
                                        <div className="text-[11px] text-on-surface-variant">
                                          ID: {String(modObj._id).slice(-6)}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Email */}
                                  <td className="py-3 px-5 text-on-surface font-medium whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <FiMail className="text-on-surface-variant text-sm" />
                                      <span>{modEmail}</span>
                                    </div>
                                  </td>

                                  {/* Phone */}
                                  <td className="py-3 px-5 text-on-surface-variant whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <FiPhone className="text-on-surface-variant text-sm" />
                                      <span>{modPhone}</span>
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-3 px-5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Active Moderator
                                    </span>
                                  </td>

                                  {/* Action */}
                                  {isEventAdmin && (
                                    <td className="py-3 px-5 text-right whitespace-nowrap">
                                      <button
                                        onClick={() =>
                                          setRemoveTarget({
                                            subEvent,
                                            moderator: modObj,
                                          })
                                        }
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-500/10 font-medium transition active:scale-95 text-xs"
                                        title="Remove moderator"
                                      >
                                        <FiTrash2 size={13} />
                                        <span>Remove</span>
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={isEventAdmin ? 5 : 4} className="py-8 px-5 text-center">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/60">
                                    <FiUser size={18} />
                                  </div>
                                  <p className="text-xs font-medium text-on-surface-variant">
                                    No moderators assigned yet.
                                  </p>
                                  {isEventAdmin && (
                                    <button
                                      onClick={() => openAddModal(subEvent)}
                                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-primary-container transition active:scale-95"
                                    >
                                      <FiUserPlus size={14} /> Assign First Moderator
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Danger Zone: Delete Event */}
        {isEventAdmin && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <FiAlertCircle size={18} />
                  <span>Danger Zone</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 max-w-xl">
                  Permanently delete this event and all associated sub-events, attendee registrations and chat messages. This action is irreversible.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95 shrink-0"
              >
                <FiTrash2 size={16} />
                <span>Delete Event</span>
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD MODERATOR MODAL */}
      {/* ========================================================================= */}
      {isEventAdmin && selectedSubEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center font-bold">
                  <FiUserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Add Moderator</h3>
                  <p className="text-xs text-on-surface-variant">
                    Track: <span className="font-semibold text-on-surface">{selectedSubEvent?.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeAddModal}
                disabled={addModeratorMutation.isPending}
                className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddModeratorSubmit} className="p-6 space-y-5">
              {/* Rules / Eligibility Criteria Info Box */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs space-y-2 text-on-surface-variant">
                <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <FiInfo className="text-primary-container" />
                  <span>Moderator Eligibility Rules:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                  <li>User must already have an account registered on this platform.</li>
                  <li>User cannot be registered for any event as an attendee.</li>
                  <li>User cannot be an administrator of this event.</li>
                  <li>A user cannot be a moderator for two different events.</li>
                </ul>
              </div>

              {/* Error display */}
              {modalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-shake">
                  <FiAlertCircle className="shrink-0 mt-0.5" size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider">
                  Registered User Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={moderatorEmail}
                    onChange={(e) => {
                      setModeratorEmail(e.target.value);
                      if (modalError) setModalError("");
                    }}
                    placeholder="e.g. user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 focus:border-primary-container focus:ring-1 focus:ring-primary-container text-on-surface text-sm placeholder:text-on-surface-variant/40 outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Enter the exact email address used by the user when they signed up.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={addModeratorMutation.isPending}
                  className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addModeratorMutation.isPending || !moderatorEmail.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs sm:text-sm shadow-sm hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none transition active:scale-95"
                >
                  {addModeratorMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Validating & Adding...</span>
                    </>
                  ) : (
                    <>
                      <FiUserPlus size={16} />
                      <span>Add as Moderator</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REMOVE MODERATOR CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isEventAdmin && removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <FiTrash2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Remove Moderator?</h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-on-surface">
                {removeTarget.moderator?.userName || removeTarget.moderator?.email}
              </span>{" "}
              from the{" "}
              <span className="font-semibold text-on-surface">
                {removeTarget.subEvent?.name}
              </span>{" "}
              moderator team? They will no longer be able to manage attendance or review requests for this track.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                disabled={removeModeratorMutation.isPending}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveModerator}
                disabled={removeModeratorMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50"
              >
                {removeModeratorMutation.isPending ? (
                  <span>Removing...</span>
                ) : (
                  <>
                    <FiTrash2 size={14} />
                    <span>Confirm Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE EVENT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <FiTrash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Delete Event</h3>
                <p className="text-xs text-on-surface-variant truncate max-w-[280px]">
                  {event?.title}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 space-y-1.5">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                Are you sure you want to delete? Action is irreversible
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                This will permanently delete this event and all of its associated data including sub-events, attendee registrations, tickets, chat history, and payments.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteEventMutation.isPending}
                className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteEventMutation.mutate()}
                disabled={deleteEventMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50"
              >
                {deleteEventMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Deleting event...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 size={14} />
                    <span>Delete Event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvent;

