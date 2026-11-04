import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEventJoinRequests,
  getGroupJoinRequests,
  updateJoinRequestStatus,
  Fetchevent,
} from "../services/api";
import { useSocketContext } from "../context/socketContext";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import { formatTimestamp } from "../utils/time";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiCheck,
  FiX,
  FiRotateCcw,
  FiSearch,
  FiUsers,
  FiAward,
  FiAlertCircle,
  FiExternalLink,
} from "react-icons/fi";

const Request = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [trackFilter, setTrackFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingActionId, setLoadingActionId] = useState(null);

  // Query event-specific join requests if eventId is present
  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (eventId) {
      navigate(`/events/${eventId}`, { replace: true });
    } else {
      navigate("/events", { replace: true });
    }
  };

  const {
    data: eventData,
    isLoading: isEventRequestsLoading,
    isError: isEventError,
    error: eventError,
    refetch: refetchEventRequests,
  } = useQuery({
    queryKey: ["eventJoinRequests", eventId],
    queryFn: () => getEventJoinRequests(eventId),
    enabled: !!eventId,
  });

  // Query general event metadata as fallback/enrichment
  const { data: eventDetails } = useQuery({
    queryKey: ["eventId", eventId],
    queryFn: () => Fetchevent(eventId),
    enabled: !!eventId && !eventData?.event,
  });

  // Query global join requests if accessed without eventId (legacy fallback)
  const {
    data: globalRequests,
    isLoading: isGlobalLoading,
    refetch: refetchGlobalRequests,
  } = useQuery({
    queryKey: ["requests"],
    queryFn: getGroupJoinRequests,
    enabled: !eventId,
  });

  // Real-time socket listener for incoming requests
  useEffect(() => {
    if (user?._id) {
      socket?.emit("register_admin", user._id);
    }

    const handleNewRequest = () => {
      if (eventId) {
        refetchEventRequests();
      } else {
        refetchGlobalRequests();
      }
    };

    socket?.on("new_request", handleNewRequest);
    return () => {
      socket?.off("new_request", handleNewRequest);
    };
  }, [socket, user, eventId, refetchEventRequests, refetchGlobalRequests]);

  // Mutation to update request status (supports 'approve', 'reject', 'pending')
  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ requestId, action }) =>
      updateJoinRequestStatus({ requestId, action }),
    onMutate: ({ requestId, action }) => {
      setLoadingActionId(`${requestId}-${action}`);
    },
    onSuccess: (response, { action }) => {
      toast.success(
        response?.data?.message || `Join request updated to ${action}ed`
      );
      setLoadingActionId(null);
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ["eventJoinRequests", eventId] });
        queryClient.invalidateQueries({ queryKey: ["getGroupByEventId", eventId] });
      }
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (err) => {
      setLoadingActionId(null);
      const errMsg =
        err?.response?.data?.message || err?.message || "Failed to update status";
      toast.error(errMsg);
    },
  });

  const event = eventData?.event || eventDetails?.event;
  const rawRequests = useMemo(() => {
    return eventId
      ? eventData?.requests || []
      : Array.isArray(globalRequests)
      ? globalRequests
      : [];
  }, [eventId, eventData?.requests, globalRequests]);

  // Filter requests by status, track, and search query
  const filteredRequests = useMemo(() => {
    return rawRequests.filter((req) => {
      // 1. Status Filter
      if (statusFilter !== "all" && req?.status !== statusFilter) {
        return false;
      }
      // 2. Track / Sub-Event Filter
      if (trackFilter !== "all" && req?.group?._id !== trackFilter) {
        return false;
      }
      // 3. Search query (name or email)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const userName = req?.user?.userName?.toLowerCase() || "";
        const email = req?.user?.email?.toLowerCase() || "";
        const groupName = req?.group?.name?.toLowerCase() || "";
        if (
          !userName.includes(query) &&
          !email.includes(query) &&
          !groupName.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rawRequests, statusFilter, trackFilter, searchQuery]);

  // Status counts
  const counts = useMemo(() => {
    if (eventData?.counts) return eventData.counts;
    const total = rawRequests.length;
    const pending = rawRequests.filter((r) => r.status === "pending").length;
    const approved = rawRequests.filter((r) => r.status === "approved").length;
    const rejected = rawRequests.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [rawRequests, eventData?.counts]);

  // Unique groups list for track filter dropdown
  const availableGroups = useMemo(() => {
    if (eventData?.groups) return eventData.groups;
    const map = new Map();
    rawRequests.forEach((r) => {
      if (r?.group?._id && !map.has(r.group._id)) {
        map.set(r.group._id, r.group);
      }
    });
    return Array.from(map.values());
  }, [rawRequests, eventData?.groups]);

  const isPaidEvent = Boolean(event?.paid);

  useEffect(() => {
    if (isPaidEvent) {
      toast.info("Join requests are not applicable for paid events");
      navigate(`/events/${eventId}`, { replace: true });
    }
  }, [isPaidEvent, eventId, navigate]);

  // Block full page if this is a paid event
  if (isPaidEvent) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface font-poppins pt-20">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 text-center flex flex-col items-center gap-4 shadow-xl">
          <span className="material-symbols-outlined text-5xl text-amber-500">
            monetization_on
          </span>
          <h2 className="text-xl font-extrabold text-on-surface">Paid Event</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Join requests are not applicable for paid events. Attendees register directly through payment.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:bg-surface-tint transition shadow-sm flex items-center gap-2 mt-2"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back to Event</span>
          </button>
        </div>
      </div>
    );
  }

  // Block full page if access error (e.g. 403 Forbidden or 400 Paid Event)
  if (isEventError) {
    const isForbidden = eventError?.response?.status === 403;
    const isPaid =
      eventError?.response?.status === 400 &&
      /paid event/i.test(eventError?.response?.data?.message || "");

    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface font-poppins pt-20">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 text-center flex flex-col items-center gap-4 shadow-xl">
          <span className="material-symbols-outlined text-5xl text-error">
            {isForbidden ? "lock" : isPaid ? "monetization_on" : "error"}
          </span>
          <h2 className="text-xl font-extrabold text-on-surface">
            {isForbidden
              ? "Access Denied"
              : isPaid
              ? "Paid Event"
              : "Failed to load requests"}
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {isForbidden
              ? "Only the event host or verified organizers have permission to view and manage join requests for this event."
              : isPaid
              ? "Join requests are not applicable for paid events. Attendees register directly through payment."
              : eventError?.response?.data?.message ||
                "There was an issue retrieving join requests."}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Event</span>
            </button>
            {!isForbidden && !isPaid && (
              <button
                type="button"
                onClick={() => refetchEventRequests()}
                className="px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:bg-surface-tint transition"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isLoading = eventId ? isEventRequestsLoading : isGlobalLoading;

  return (
    <div className="min-h-screen bg-surface font-poppins text-on-surface pt-20 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Top Header & Breadcrumb */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30">
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
                    to={`/events/${eventId}`}
                    replace
                    className="hover:underline max-w-[200px] truncate"
                    title={event.title}
                  >
                    {event.title}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-primary-container font-semibold">
                Join Requests
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface mt-0.5">
              Sub-Event Join Requests
            </h1>
          </div>
        </div>

        {eventId && (
          <Link
            to={`/events/${eventId}`}
            replace
            className="text-xs font-semibold text-primary-container hover:underline flex items-center gap-1.5 bg-primary-container/10 px-3.5 py-1.5 rounded-full border border-primary-container/20 shadow-sm"
          >
            <span>View Public Event</span>
            <FiExternalLink size={13} />
          </Link>
        )}
      </div>

      <div className="max-w-7xl mx-auto mt-6 space-y-6">
        {/* Event Header Banner with Status Metrics */}
        {event && (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-fade-in">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {event?.imageUrl && (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-outline-variant/30 shadow-inner">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary-container bg-primary-container/10 px-2.5 py-0.5 rounded-full border border-primary-container/20">
                  Event Organizer Portal
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-on-surface truncate mt-1">
                  {event.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-on-surface-variant font-medium">
                  {event.eventDate && (
                    <span className="flex items-center gap-1">
                      <FiCalendar className="text-primary-container" size={13} />
                      <span>{event.eventDate}</span>
                    </span>
                  )}
                  {event.startTime && (
                    <span className="flex items-center gap-1">
                      <FiClock className="text-primary-container" size={13} />
                      <span>
                        {event.startTime} - {event.endTime}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-center min-w-[90px]">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                  Total
                </span>
                <span className="text-xl font-extrabold text-on-surface">
                  {counts.total}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center min-w-[90px]">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 block">
                  Pending
                </span>
                <span className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
                  {counts.pending}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center min-w-[90px]">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 block">
                  Approved
                </span>
                <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {counts.approved}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center min-w-[90px]">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400 block">
                  Rejected
                </span>
                <span className="text-xl font-extrabold text-rose-700 dark:text-rose-300">
                  {counts.rejected}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-surface-container-low border border-outline-variant/30 w-fit">
              {[
                { id: "all", label: "All", count: counts.total },
                { id: "pending", label: "Pending", count: counts.pending },
                { id: "approved", label: "Approved", count: counts.approved },
                { id: "rejected", label: "Rejected", count: counts.rejected },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? "bg-primary-container text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      statusFilter === tab.id
                        ? "bg-on-primary/20 text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Right Controls: Sub-Event Track Filter & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Track filter dropdown */}
              {availableGroups.length > 0 && (
                <select
                  value={trackFilter}
                  onChange={(e) => setTrackFilter(e.target.value)}
                  className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs font-semibold outline-none focus:border-primary-container cursor-pointer"
                >
                  <option value="all">All Sub-Events ({availableGroups.length})</option>
                  {availableGroups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Search Bar */}
              <div className="relative min-w-[220px]">
                <FiSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search applicant name / email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary-container outline-none text-on-surface placeholder:text-on-surface-variant/60 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table / Card List */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-sm">
            <Spinner size="lg" />
            <p className="text-xs font-semibold text-on-surface-variant">
              Loading join requests...
            </p>
          </div>
        ) : isEventError ? (
          <div className="py-16 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-sm p-6 space-y-3">
            <FiAlertCircle className="mx-auto text-rose-500" size={32} />
            <h3 className="text-base font-bold text-on-surface">
              Failed to load join requests
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              {eventError?.response?.data?.message ||
                "You may not have moderator access to this event, or the event was not found."}
            </p>
            <button
              onClick={() => refetchEventRequests()}
              className="px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:bg-surface-tint shadow-sm transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-3xl shadow-sm p-6 space-y-3">
            <FiUsers className="mx-auto text-on-surface-variant/50" size={36} />
            <h3 className="text-base font-bold text-on-surface">
              No join requests found
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              {statusFilter !== "all" || trackFilter !== "all" || searchQuery
                ? "No requests match your selected filters. Try adjusting the search query or status."
                : "No attendees have requested to join sub-events for this event yet."}
            </p>
            {(statusFilter !== "all" || trackFilter !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setTrackFilter("all");
                  setSearchQuery("");
                }}
                className="text-xs font-semibold text-primary-container hover:underline"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 sm:px-6">Applicant</th>
                    <th className="py-3.5 px-4">Sub-Event Track</th>
                    <th className="py-3.5 px-4">Requested Date</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Change State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredRequests.map((req) => {
                    const reqId = req._id;
                    const status = req.status;
                    const group = req.group;
                    const applicant = req.user;
                    const isPendingAction =
                      loadingActionId?.startsWith(reqId);

                    return (
                      <tr
                        key={reqId}
                        className="hover:bg-surface-container-low/60 transition-colors"
                      >
                        {/* Applicant Name & Email */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <Avatar
                              size="sm"
                              name={applicant?.userName || "User"}
                              imageUrl={applicant?.profile_image_url}
                              className="shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-on-surface text-sm block truncate">
                                {applicant?.userName || "Anonymous"}
                              </span>
                              <span className="text-xs text-on-surface-variant block truncate">
                                {applicant?.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Sub-Event Track */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0">
                              <FiAward size={14} />
                            </div>
                            <div>
                              <span className="font-semibold text-on-surface block text-xs">
                                {group?.name || "General Track"}
                              </span>
                              {group?.limit && (
                                <span className="text-[10px] text-on-surface-variant">
                                  Capacity: {
                                    groupsData?.groups?.find((g) => (g?._id || g)?.toString() === (group?._id || group)?.toString())?.membersCount ??
                                    group?.membersCount ??
                                    0
                                  }/{group.limit}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Requested Date */}
                        <td className="py-4 px-4 text-on-surface-variant whitespace-nowrap">
                          {formatTimestamp(req.createdAt)}
                        </td>

                        {/* Current Status Pill Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {status === "pending" && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold">
                              <FiClock size={12} />
                              <span>Pending</span>
                            </span>
                          )}
                          {status === "approved" && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full font-semibold">
                              <FiCheckCircle size={12} />
                              <span>Approved</span>
                            </span>
                          )}
                          {status === "rejected" && (
                            <span className="inline-flex items-center gap-1 bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs px-2.5 py-1 rounded-full font-semibold">
                              <FiXCircle size={12} />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        {/* Admin / Moderator Action Controls (Can change state any time) */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center justify-center gap-2">
                            {/* Action to Approve */}
                            {status !== "approved" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateStatus({ requestId: reqId, action: "approve" })
                                }
                                disabled={isPendingAction}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                                title="Approve Request"
                              >
                                {loadingActionId === `${reqId}-approve` ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <FiCheck size={14} className="stroke-[2.5]" />
                                )}
                                <span>Approve</span>
                              </button>
                            )}

                            {/* Action to Reject */}
                            {status !== "rejected" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateStatus({ requestId: reqId, action: "reject" })
                                }
                                disabled={isPendingAction}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold text-xs transition flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                                title="Reject Request"
                              >
                                {loadingActionId === `${reqId}-reject` ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <FiX size={14} className="stroke-[2.5]" />
                                )}
                                <span>Reject</span>
                              </button>
                            )}

                            {/* Action to Move Back to Pending */}
                            {status !== "pending" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateStatus({ requestId: reqId, action: "pending" })
                                }
                                disabled={isPendingAction}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold text-xs transition flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                                title="Change back to Pending review"
                              >
                                {loadingActionId === `${reqId}-pending` ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <FiRotateCcw size={13} />
                                )}
                                <span>Pending</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Request;
