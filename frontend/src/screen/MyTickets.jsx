import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { getPanelData } from "../services/api";
import { getTicketStatus } from "../utils/ticketUtils";
import TicketQRModal from "../components/TicketQRModal";
import Spinner from "../components/Spinner";

const MyTickets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Filtering & Sorting State
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'checked-in' | 'expired'
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest' | 'oldest'

  // Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch registered tickets / participated events
  const {
    data: panelData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["profile-panel", user?._id],
    queryFn: getPanelData,
    enabled: !!user,
  });

  // Extract participated events
  const rawEvents = useMemo(() => {
    return panelData?.participatedEvents || [];
  }, [panelData?.participatedEvents]);

  // Keep selected ticket synchronized on background refetch
  useEffect(() => {
    if (selectedTicket && rawEvents.length > 0) {
      const updated = rawEvents.find(
        (e) =>
          (e._id && e._id === selectedTicket._id) ||
          (e.applicationId && e.applicationId === selectedTicket.applicationId)
      );
      if (updated) {
        setSelectedTicket(updated);
      }
    }
  }, [rawEvents, selectedTicket]);

  // Filter and Sort tickets
  const filteredTickets = useMemo(() => {
    let list = rawEvents.map((ev) => ({
      ...ev,
      ticketMeta: getTicketStatus(ev),
    }));

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.subEvent?.toLowerCase().includes(q) ||
          t.appliedTo?.toLowerCase().includes(q) ||
          t.reference?.toLowerCase().includes(q) ||
          t.location?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus === "active") {
      list = list.filter((t) => !t.ticketMeta.isExpired && !t.ticketMeta.isScanned);
    } else if (filterStatus === "checked-in") {
      list = list.filter((t) => t.ticketMeta.isScanned);
    } else if (filterStatus === "expired") {
      list = list.filter((t) => t.ticketMeta.isExpired);
    }

    // Sort order
    list.sort((a, b) => {
      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [rawEvents, filterStatus, searchQuery, sortOrder]);

  // Group tickets by organizing event
  const groupedEvents = useMemo(() => {
    const map = new Map();
    filteredTickets.forEach((ticket) => {
      const parentId = String(ticket.organizingEventId || ticket._id);
      if (!map.has(parentId)) {
        map.set(parentId, {
          organizingEventId: parentId,
          organizingEventTitle: ticket.organizingEventTitle || ticket.title,
          eventDate: ticket.eventDate,
          startTime: ticket.startTime,
          endTime: ticket.endTime,
          location: ticket.location,
          imageUrl: ticket.imageUrl,
          passes: [],
        });
      }
      map.get(parentId).passes.push(ticket);
    });
    return Array.from(map.values());
  }, [filteredTickets]);

  // Overall counts for stats row
  const stats = useMemo(() => {
    const enriched = rawEvents.map((ev) => getTicketStatus(ev));
    return {
      total: rawEvents.length,
      active: enriched.filter((m) => !m.isExpired && !m.isScanned).length,
      checkedIn: enriched.filter((m) => m.isScanned).length,
      expired: enriched.filter((m) => m.isExpired).length,
    };
  }, [rawEvents]);

  // Helper date formatter
  const formatEventDate = (dateStr) => {
    if (!dateStr) return { day: "01", month: "JAN", year: "2026" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = String(dateStr).split(/[-/\s]/);
      return {
        day: parts[0] || "01",
        month: (parts[1] || "JAN").slice(0, 3).toUpperCase(),
        year: parts[2] || "2026",
      };
    }
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return { day, month, year };
  };

  const handleDownloadQR = (qrUrl, title) => {
    if (!qrUrl) {
      toast.error("QR Code image is not ready yet");
      return;
    }
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `${title.replace(/\s+/g, "_")}_Ticket_QR.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Ticket QR downloaded!");
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary">
      {/* Main Content */}
      <main className="w-full pt-20 pb-16 flex-1">
        <div className="max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">

          {/* Hero Header Banner */}
          <div className="relative rounded-2xl bg-gradient-to-r from-surface-container-high via-surface-container-low to-surface-container-lowest p-8 border border-outline-variant/30 shadow-sm overflow-hidden">
            {/* Ambient Lighting Orbs */}
            <div className="absolute -right-16 -top-16 w-80 h-80 bg-primary-container/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-secondary-container/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col gap-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/15 text-primary-container text-xs font-bold uppercase tracking-wider w-fit">
                  <span className="material-symbols-outlined text-sm">confirmation_number</span>
                  <span>Ticket Wallet &amp; Access Passes</span>
                </div>
                <h1 className="font-headline-lg text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
                  My Tickets &amp; QR Passes
                </h1>
                <p className="font-body-md text-on-surface-variant text-sm md:text-base leading-relaxed">
                  Your registered event passes are stored here. Present the persisted QR code at the venue gate for instant check-in verification.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary hover:bg-surface-tint font-label-md text-sm font-semibold transition-all shadow-md active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">explore</span>
                  <span>Explore More Events</span>
                </Link>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/30 transition-colors"
                  title="Refresh Tickets"
                >
                  <span className="material-symbols-outlined text-xl">refresh</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-outline-variant/20">
              <div className="bg-surface-container-lowest/80 backdrop-blur rounded-xl p-4 border border-outline-variant/20 flex flex-col">
                <span className="text-xs text-on-surface-variant font-medium">Total Passes</span>
                <span className="font-headline-lg text-2xl font-bold text-on-surface mt-1">
                  {stats.total}
                </span>
                <span className="text-[11px] text-outline mt-0.5">Registered experiences</span>
              </div>

              <div className="bg-surface-container-lowest/80 backdrop-blur rounded-xl p-4 border border-outline-variant/20 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant font-medium">Valid QR Passes</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="font-headline-lg text-2xl font-bold text-emerald-400 mt-1">
                  {stats.active}
                </span>
                <span className="text-[11px] text-outline mt-0.5">Ready for entry</span>
              </div>

              <div className="bg-surface-container-lowest/80 backdrop-blur rounded-xl p-4 border border-outline-variant/20 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant font-medium">Checked In</span>
                  <span className="material-symbols-outlined text-xs text-indigo-400">verified</span>
                </div>
                <span className="font-headline-lg text-2xl font-bold text-indigo-400 mt-1">
                  {stats.checkedIn}
                </span>
                <span className="text-[11px] text-outline mt-0.5">Already scanned at gate</span>
              </div>

              <div className="bg-surface-container-lowest/80 backdrop-blur rounded-xl p-4 border border-outline-variant/20 flex flex-col">
                <span className="text-xs text-on-surface-variant font-medium">Expired Passes</span>
                <span className="font-headline-lg text-2xl font-bold text-on-surface-variant mt-1">
                  {stats.expired}
                </span>
                <span className="text-[11px] text-outline mt-0.5">Event time concluded</span>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === "all"
                    ? "bg-primary-container text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                All Passes ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("active")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterStatus === "active"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Active Valid QRs ({stats.active})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("checked-in")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterStatus === "checked-in"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-xs">verified</span>
                <span>Checked In ({stats.checkedIn})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("expired")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterStatus === "expired"
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-xs">timer_off</span>
                <span>Expired ({stats.expired})</span>
              </button>
            </div>

            {/* Search and Sort */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by title, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low rounded-lg text-xs text-on-surface placeholder:text-outline border border-outline-variant/20 focus:outline-none focus:border-primary-container"
                />
              </div>

              {/* Sort Switcher */}
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
                className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 text-xs font-semibold text-on-surface flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-sm text-outline">sort</span>
                <span>{sortOrder === "newest" ? "Newest" : "Oldest"}</span>
              </button>
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 animate-pulse flex flex-col md:flex-row gap-6"
                >
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="w-32 h-6 bg-surface-container-high rounded" />
                    <div className="w-48 h-4 bg-surface-container-low rounded" />
                    <div className="w-24 h-4 bg-surface-container-low rounded" />
                  </div>
                  <div className="w-44 h-44 bg-surface-container-high rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-error/20 flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-4xl text-error">error_outline</span>
              <h2 className="text-lg font-bold text-on-surface">Failed to load tickets</h2>
              <p className="text-xs text-on-surface-variant max-w-sm">
                There was a problem retrieving your tickets from the server.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 px-4 py-2 rounded-xl bg-primary-container text-on-primary font-semibold text-xs transition-colors hover:bg-surface-tint"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && filteredTickets.length === 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-16 text-center border border-outline-variant/30 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-4xl">confirmation_number</span>
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <h2 className="text-xl font-bold text-on-surface">
                  {searchQuery || filterStatus !== "all"
                    ? "No tickets match your filter"
                    : "No event tickets yet"}
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your search query or switching your status filter to see other passes."
                    : "When you register for an event, your official digital passport with a persisted QR code will automatically appear here."}
                </p>
              </div>
              {searchQuery || filterStatus !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("all");
                    setSearchQuery("");
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  to="/events"
                  className="mt-2 px-6 py-2.5 rounded-xl bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-md hover:bg-surface-tint active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">explore</span>
                  <span>Browse Upcoming Events</span>
                </Link>
              )}
            </div>
          )}

          {/* Populated Tickets Grid - Grouped by Organizing Event */}
          {!isLoading && !isError && groupedEvents.length > 0 && (
            <div className="flex flex-col gap-10">
              {groupedEvents.map((group) => {
                const groupDate = formatEventDate(group.eventDate);
                return (
                  <section
                    key={group.organizingEventId}
                    className="flex flex-col gap-4 bg-surface-container-low/40 p-5 md:p-6 rounded-3xl border border-outline-variant/20 shadow-sm"
                  >
                    {/* Organizing Event Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/20">
                      <div className="flex items-center gap-3.5">
                        {group.imageUrl ? (
                          <img
                            src={group.imageUrl}
                            alt={group.eventTitle}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-outline-variant/30 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary-container/15 flex items-center justify-center text-primary-container shrink-0">
                            <span className="material-symbols-outlined text-2xl">event</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-container bg-primary-container/15 px-2 py-0.5 rounded-md">
                              <span className="material-symbols-outlined text-[13px]">corporate_fare</span>
                              Organizing Event
                            </span>
                            <span className="text-xs text-on-surface-variant font-medium">
                              {groupDate.month} {groupDate.day}, {groupDate.year}
                            </span>
                          </div>
                          <h2 className="text-lg md:text-xl font-extrabold text-on-surface tracking-tight line-clamp-1">
                            {group.eventTitle}
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant border border-outline-variant/30 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary-container">confirmation_number</span>
                          <span>
                            {group.passes.length} {group.passes.length === 1 ? "Sub-event Pass" : "Sub-event Passes"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Sub-event passes for this organizing event */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {group.passes.map((ticket, idx) => {
                        const { day, month, year } = formatEventDate(ticket.eventDate || ticket.createdAt);
                        const isPaid = ticket.paid === true || (ticket.amount && ticket.amount > 0);
                        const amountFormatted = ticket.amount ? `$${Number(ticket.amount).toFixed(2)}` : "$99.00";
                        const isVirtual =
                          String(ticket.location).toLowerCase().includes("virtual") ||
                          String(ticket.location).toLowerCase().includes("online");
                        const meta = ticket.ticketMeta;
                        const subeventName = ticket.subEvent || ticket.appliedTo || "General Entry";

                        return (
                          <div
                            key={ticket.applicationId || ticket._id || idx}
                            className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row overflow-hidden group"
                          >
                            {/* Top Ribbon Accent */}
                            <div
                              className={`absolute top-0 inset-x-0 h-1.5 ${
                                meta.isExpired
                                  ? "bg-zinc-600"
                                  : meta.isScanned
                                  ? "bg-indigo-600"
                                  : "bg-gradient-to-r from-emerald-500 via-primary-container to-purple-600"
                              }`}
                            />

                            {/* Main Ticket Info (Left) */}
                            <div className="flex-1 p-6 flex flex-col justify-between gap-5">
                              <div className="flex flex-col gap-3">
                                {/* Status Badges Row */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* QR Expiry Badge */}
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                      meta.isExpired
                                        ? "bg-zinc-800/40 text-zinc-400 border-zinc-700/60"
                                        : "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        meta.isExpired ? "bg-zinc-400" : "bg-emerald-400 animate-pulse"
                                      }`}
                                    />
                                    <span>{meta.isExpired ? "QR Expired" : "QR Active"}</span>
                                  </span>

                                  {/* Check-In Status Badge */}
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                      meta.isScanned
                                        ? "bg-indigo-950/40 text-indigo-300 border-indigo-500/30"
                                        : "bg-amber-950/40 text-amber-300 border-amber-500/30"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-xs">
                                      {meta.isScanned ? "verified" : "qr_code_scanner"}
                                    </span>
                                    <span>{meta.isScanned ? "Checked In" : "Not Scanned"}</span>
                                  </span>

                                  {/* Pricing Pill */}
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                      isPaid
                                        ? "bg-secondary-container/40 text-on-secondary-container"
                                        : "bg-tertiary-container/30 text-tertiary"
                                    }`}
                                  >
                                    {isPaid ? `Paid (${amountFormatted})` : "Free RSVP"}
                                  </span>
                                </div>

                                {/* Subevent Track Title */}
                                <div className="flex flex-col gap-1">
                                  <div className="inline-flex items-center gap-1.5 text-xs text-primary-container font-semibold">
                                    <span className="material-symbols-outlined text-sm">category</span>
                                    <span>Sub-event Track</span>
                                  </div>
                                  <h3 className="font-headline-md text-xl font-bold tracking-tight text-on-surface line-clamp-2 group-hover:text-primary-container transition-colors">
                                    {subeventName}
                                  </h3>
                                </div>

                                {/* Timing & Venue */}
                                <div className="flex flex-col gap-1.5 text-xs text-on-surface-variant font-medium">
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base text-outline">
                                      calendar_today
                                    </span>
                                    <span>
                                      {month} {day}, {year} • {ticket.startTime ? `${ticket.startTime} - ` : ""}
                                      {ticket.endTime || "All Day"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base text-outline">
                                      {isVirtual ? "language" : "place"}
                                    </span>
                                    <span className="truncate">
                                      {ticket.location || (isVirtual ? "Online / Virtual Stream" : "ACN. Main Auditorium")}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base text-outline">
                                      person
                                    </span>
                                    <span className="truncate">
                                      Attendee: <b>{user?.userName || "Alex Rivera"}</b>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Ticket Footer Meta */}
                              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                                <span className="font-mono text-outline font-semibold">
                                  {ticket.reference || `#LUM-${String(ticket.applicationId || ticket._id).slice(-5).toUpperCase()}`}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setIsModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 font-semibold text-primary-container hover:underline"
                                >
                                  <span>Full Pass Details</span>
                                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                              </div>
                            </div>

                            {/* Perforated Divider (Hidden on mobile) */}
                            <div className="relative hidden md:flex flex-col items-center justify-between py-2">
                              <div className="w-5 h-5 -mt-2.5 rounded-full bg-surface border border-outline-variant/30" />
                              <div className="w-[1px] h-full border-r-2 border-dashed border-outline-variant/30 my-2" />
                              <div className="w-5 h-5 -mb-2.5 rounded-full bg-surface border border-outline-variant/30" />
                            </div>

                            {/* QR Code Stub (Right) */}
                            <div className="w-full md:w-56 p-6 bg-surface-container-low/60 flex flex-col items-center justify-center text-center gap-3 border-t md:border-t-0 md:border-l border-outline-variant/20 shrink-0">
                              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                                Subevent QR Pass
                              </span>

                              {/* Persisted QR Code Box */}
                              <div
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setIsModalOpen(true);
                                }}
                                className="relative p-2.5 bg-white rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105 group/qr"
                                title="Click to expand QR Code"
                              >
                                {ticket.qrCodeUrl ? (
                                  <img
                                    src={ticket.qrCodeUrl}
                                    alt={`QR for ${subeventName}`}
                                    className={`w-36 h-36 object-contain rounded ${
                                      meta.isExpired ? "opacity-60 grayscale" : "opacity-100"
                                    }`}
                                  />
                                ) : (
                                  <div className="w-36 h-36 flex flex-col items-center justify-center text-zinc-400 gap-1.5">
                                    <Spinner size="sm" />
                                    <span className="text-[10px]">Loading QR...</span>
                                  </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-2xl">fullscreen</span>
                                </div>
                              </div>

                              {/* Sub-text / Composite Label */}
                              <span className="text-[11px] font-semibold text-on-surface-variant">
                                {meta.compositeLabel}
                              </span>

                              {/* Actions */}
                              <div className="flex items-center gap-2 w-full mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setIsModalOpen(true);
                                  }}
                                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-surface-tint font-label-sm text-xs font-semibold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">qr_code_2</span>
                                  <span>View Pass</span>
                                </button>

                                {ticket.qrCodeUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadQR(ticket.qrCodeUrl, subeventName)}
                                    className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors"
                                    title="Download QR Image"
                                  >
                                    <span className="material-symbols-outlined text-base">download</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low py-8 border-t border-surface-container-high/60 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-on-surface-variant text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface">ACN. Events</span>
            <span>•</span>
            <span>Verified Digital Passport System</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/events" className="hover:text-on-surface transition-colors">
              Directory
            </Link>
            <Link to="/profile" className="hover:text-on-surface transition-colors">
              User Profile
            </Link>
            <span>© 2025 ACN. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Ticket Pass Modal */}
      <TicketQRModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicket(null);
        }}
        event={selectedTicket}
        currentUser={user}
      />
    </div>
  );
};

export default MyTickets;
