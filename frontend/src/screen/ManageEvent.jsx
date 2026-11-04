import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, ToastContainer } from "react-toastify";
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
} from "react-icons/fi";
import { Fetchevent, getGroupByEventId, addModerator, removeModerator } from "../services/api";
import { useAuth } from "../hooks/useAuth.jsx";
import Avatar from "../components/Avatar.jsx";
import Spinner from "../components/Spinner.jsx";

const ManageEvent = () => {
  const { eventId, id } = useParams();
  const currentEventId = eventId || id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // State for Add Moderator Modal
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [moderatorEmail, setModeratorEmail] = useState("");
  const [modalError, setModalError] = useState("");

  // State for Remove Moderator Confirmation Modal
  const [removeTarget, setRemoveTarget] = useState(null); // { subEvent, moderator }

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

  // Authorization check
  const currentUserId = user?._id ? String(user._id) : null;
  const eventCreatorId = event?.userId?._id
    ? String(event.userId._id)
    : event?.userId
      ? String(event.userId)
      : null;

  const isEventCreator = Boolean(
    currentUserId &&
    (currentUserId === eventCreatorId || user?.role === "admin")
  );

  // Filter sub-events (exclude head group)
  const tracks = (subEventGroups || []).filter((g) => !g.isHead);

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

  const openAddModal = (subEvent) => {
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
    if (!removeTarget) return;
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

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface font-poppins pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Top Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/events/${currentEventId}`)}
              className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition active:scale-95 border border-outline-variant/30 flex items-center justify-center"
              title="Back to Event"
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-primary-container">
                  Event Management
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant border border-outline-variant/30 font-medium">
                  {tracks.length} Sub-event{tracks.length === 1 ? "" : "s"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                Manage Event
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/events/${currentEventId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition active:scale-95"
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>View Public Page</span>
            </Link>

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
            <button
              onClick={() => navigate(`/events/${currentEventId}/edit`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs sm:text-sm shadow-sm hover:brightness-110 transition active:scale-95"
            >
              <FiEdit2 size={16} />
              <span>Edit event information</span>
            </button>
            {!event?.paid && (
              <button
                onClick={() => navigate(`/events/${currentEventId}/requests`)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition active:scale-95"
              >
                <span className="material-symbols-outlined text-base text-indigo-600">group</span>
                <span>Review Join Requests</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-events & Moderators Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
            <div>
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <FiShield className="text-primary-container" />
                <span>Sub-events & Moderators</span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Assign moderators to specific sub-event tracks to help oversee check-ins and member requests.
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
              <button
                onClick={() => navigate(`/events/${currentEventId}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs shadow-sm hover:brightness-110 transition active:scale-95"
              >
                <FiEdit2 size={14} /> Add Sub-events
              </button>
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
                      <button
                        onClick={() => openAddModal(subEvent)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs shadow-sm hover:brightness-110 transition active:scale-95"
                      >
                        <FiUserPlus size={15} />
                        <span>Add Moderator</span>
                      </button>
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
                            <th className="py-3 px-5 text-right">Actions</th>
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
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-8 px-5 text-center">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/60">
                                    <FiUser size={18} />
                                  </div>
                                  <p className="text-xs font-medium text-on-surface-variant">
                                    No moderators assigned to <span className="font-semibold text-on-surface">{subEvent.name}</span> yet.
                                  </p>
                                  <button
                                    onClick={() => openAddModal(subEvent)}
                                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-primary-container transition active:scale-95"
                                  >
                                    <FiUserPlus size={14} /> Assign First Moderator
                                  </button>
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
      </div>

      {/* ========================================================================= */}
      {/* ADD MODERATOR MODAL */}
      {/* ========================================================================= */}
      {selectedSubEvent && (
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
      {removeTarget && (
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
    </div>
  );
};

export default ManageEvent;

