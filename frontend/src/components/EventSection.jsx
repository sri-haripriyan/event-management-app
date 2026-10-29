import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EventOptions from "./EventOptions.jsx";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiCoffee,
  FiGift,
  FiAward,
  FiMessageSquare,
  FiHeart,
  FiCheck,
  FiCheckCircle,
  FiXCircle,
  FiSend,
  FiArrowRight,
  FiInfo,
} from "react-icons/fi";
import { formatTimestamp } from "../utils/time.js";
import { useAuth } from "../hooks/useAuth.jsx";
import Avatar from "./Avatar.jsx";
import Spinner from "./Spinner";
import {
  getGroupByEventId,
  getUserEventRequestStatus,
  bulkJoinRequest,
} from "../services/api";
import { toast } from "react-toastify";

const EventSection = ({ event }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  // Fetch groups for this event
  const { data: subEventGroups } = useQuery({
    queryKey: ["getGroupByEventId", event?._id],
    queryFn: () => getGroupByEventId(event?._id),
    enabled: !!event?._id,
  });

  // Fetch authenticated user request status
  const { data: requestStatusData } = useQuery({
    queryKey: ["userEventRequestStatus", event?._id],
    queryFn: () => getUserEventRequestStatus(event?._id),
    enabled: !!event?._id && !!user,
  });

  const getTrackName = (track) => {
    if (!track) return "";
    return typeof track === "string" ? track : track?.name || "";
  };

  const getGroupForTrack = (track) => {
    const name = getTrackName(track).trim().toLowerCase();
    if (!name || !subEventGroups) return null;
    return subEventGroups.find(
      (g) => g.name?.trim().toLowerCase() === name
    );
  };

  const getTrackDetails = (track) => {
    const trackName = getTrackName(track);
    const group = getGroupForTrack(track);
    const groupId = group?._id;
    const limit = (typeof track === "object" && track?.limit) || group?.limit || null;
    const membersCount = group?.membersCount || 0;

    let status = "none";
    let statusLabel = "Available";

    // 1. Authenticated API data
    if (groupId && requestStatusData?.statusMap?.[groupId]) {
      const apiStatus = requestStatusData.statusMap[groupId];
      if (apiStatus === "already requested" || apiStatus === "pending") {
        status = "already requested";
        statusLabel = "Already Requested";
      } else if (apiStatus === "approved") {
        status = "approved";
        statusLabel = "Approved";
      } else if (apiStatus === "rejected") {
        status = "rejected";
        statusLabel = "Rejected";
      }
    } else if (requestStatusData?.subEvents && trackName) {
      const match = requestStatusData.subEvents.find(
        (s) => s.groupName?.trim().toLowerCase() === trackName.trim().toLowerCase()
      );
      if (match) {
        if (match.status === "already requested" || match.status === "pending") {
          status = "already requested";
          statusLabel = "Already Requested";
        } else if (match.status === "approved") {
          status = "approved";
          statusLabel = "Approved";
        } else if (match.status === "rejected") {
          status = "rejected";
          statusLabel = "Rejected";
        }
      }
    } else if (group) {
      if (group.isMember || group.requestStatus === "approved") {
        status = "approved";
        statusLabel = "Approved";
      } else if (
        group.requestStatus === "already requested" ||
        group.requestStatus === "pending"
      ) {
        status = "already requested";
        statusLabel = "Already Requested";
      } else if (group.requestStatus === "rejected") {
        status = "rejected";
        statusLabel = "Rejected";
      }
    }

    const isAvailable = status === "none";
    const isSelected = groupId ? selectedGroupIds.includes(groupId) : false;

    return {
      trackName,
      group,
      groupId,
      limit,
      membersCount,
      status,
      statusLabel,
      isAvailable,
      isSelected,
    };
  };

  const technicalTracks = event?.technical || [];
  const nonTechnicalTracks = event?.nonTechnical || [];

  const handleToggleTrack = (groupId) => {
    if (!user) {
      toast.info("Please login to select sub-events");
      navigate("/login");
      return;
    }
    if (!groupId) {
      toast.warn("Sub-event configuration is pending for this track");
      return;
    }
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleToggleAllInList = (tracks) => {
    if (!user) {
      toast.info("Please login to select sub-events");
      navigate("/login");
      return;
    }
    const availableGroupIds = tracks
      .map((t) => getTrackDetails(t))
      .filter((d) => d.isAvailable && d.groupId)
      .map((d) => d.groupId);

    if (availableGroupIds.length === 0) return;

    const allSelected = availableGroupIds.every((id) => selectedGroupIds.includes(id));
    if (allSelected) {
      setSelectedGroupIds((prev) => prev.filter((id) => !availableGroupIds.includes(id)));
    } else {
      setSelectedGroupIds((prev) => Array.from(new Set([...prev, ...availableGroupIds])));
    }
  };

  // Mutation for Free Events (Bulk join request)
  const { mutate: requestJoin, isPending } = useMutation({
    mutationFn: ({ groupIds, eventId }) => bulkJoinRequest({ groupIds, eventId }),
    onMutate: async ({ groupIds }) => {
      await queryClient.cancelQueries({ queryKey: ["getGroupByEventId", event?._id] });
      await queryClient.cancelQueries({ queryKey: ["userEventRequestStatus", event?._id] });

      const prevGroupData = queryClient.getQueryData(["getGroupByEventId", event?._id]);
      const prevStatusData = queryClient.getQueryData(["userEventRequestStatus", event?._id]);

      queryClient.setQueryData(["getGroupByEventId", event?._id], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((item) =>
          groupIds.includes(item._id)
            ? { ...item, requestStatus: "already requested" }
            : item
        );
      });

      queryClient.setQueryData(["userEventRequestStatus", event?._id], (old) => {
        if (!old) return old;
        const newMap = { ...(old.statusMap || {}) };
        groupIds.forEach((id) => {
          newMap[id] = "already requested";
        });
        return {
          ...old,
          statusMap: newMap,
        };
      });

      setSelectedGroupIds([]);
      return { prevGroupData, prevStatusData };
    },
    onError: (err, variables, context) => {
      if (context?.prevGroupData) {
        queryClient.setQueryData(["getGroupByEventId", event?._id], context.prevGroupData);
      }
      if (context?.prevStatusData) {
        queryClient.setQueryData(["userEventRequestStatus", event?._id], context.prevStatusData);
      }
      const errorMsg =
        err?.response?.data?.message || err?.response?.data?.error || "Failed to submit request";
      toast.error(errorMsg);
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Join requests submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["getGroupByEventId", event?._id] });
      queryClient.invalidateQueries({ queryKey: ["userEventRequestStatus", event?._id] });
      queryClient.invalidateQueries({ queryKey: ["userJoinRequests", event?._id] });
    },
  });

  const handleFreeRegister = () => {
    if (!user) {
      toast.info("Please login to request sub-events");
      navigate("/login");
      return;
    }
    if (selectedGroupIds.length === 0) {
      toast.warn("Please select at least one sub-event to request");
      return;
    }
    requestJoin({ groupIds: selectedGroupIds, eventId: event?._id });
  };

  const handlePaidProceed = () => {
    if (!user) {
      toast.info("Please login to proceed to payment");
      navigate("/login");
      return;
    }
    if (selectedGroupIds.length === 0) {
      toast.warn("Please select at least one sub-event to proceed to payment");
      return;
    }
    const query = `?groupIds=${selectedGroupIds.join(",")}&groupId=${selectedGroupIds[0]}`;
    navigate(`/payments/${event?._id}${query}`, {
      state: { selectedGroupIds, groupId: selectedGroupIds[0] },
    });
  };

  // Find names of all selected subevents for display
  const selectedTrackNames = selectedGroupIds
    .map((id) => {
      const group = subEventGroups?.find((g) => g._id === id);
      return group?.name || null;
    })
    .filter(Boolean);

  const allSubEvents = subEventGroups || [];
  const allAlreadyRequested =
    allSubEvents.length > 0 &&
    allSubEvents.every((g) => {
      const st = requestStatusData?.statusMap?.[g._id] || g.requestStatus;
      return st === "already requested" || st === "pending";
    });

  const allApproved =
    allSubEvents.length > 0 &&
    allSubEvents.every((g) => {
      const st = requestStatusData?.statusMap?.[g._id] || g.requestStatus;
      return st === "approved" || g.isMember;
    });

  // Render an individual sub-event block
  const renderSubEventBlock = (track, index) => {
    const {
      trackName,
      group,
      groupId,
      limit,
      membersCount,
      status,
      isAvailable,
      isSelected,
    } = getTrackDetails(track);

    const isAlreadyRequested = status === "already requested";
    const isApproved = status === "approved";
    const isRejected = status === "rejected";

    return (
      <div
        key={groupId || index}
        onClick={() => isAvailable && groupId && handleToggleTrack(groupId)}
        className={`p-3.5 rounded-2xl border transition-all duration-200 select-none flex items-center justify-between gap-3 ${
          isAlreadyRequested
            ? "bg-amber-500/10 border-amber-500/25 cursor-not-allowed"
            : isApproved
            ? "bg-emerald-500/10 border-emerald-500/25 cursor-not-allowed"
            : isRejected
            ? "bg-rose-500/10 border-rose-500/25 cursor-not-allowed opacity-80"
            : isSelected
            ? "bg-primary-container/10 border-primary-container ring-2 ring-primary-container/25 shadow-sm cursor-pointer"
            : "bg-surface-container-low hover:bg-surface-container border-outline-variant/30 hover:border-outline-variant/60 cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Custom Checkbox / Status Icon */}
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
              isAlreadyRequested
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : isApproved
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : isRejected
                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                : isSelected
                ? "bg-primary-container text-on-primary shadow-sm"
                : "border-2 border-outline-variant/60 group-hover:border-primary-container/60 bg-surface-container-lowest"
            }`}
          >
            {isAlreadyRequested && <FiClock size={13} />}
            {isApproved && <FiCheckCircle size={13} />}
            {isRejected && <FiXCircle size={13} />}
            {isAvailable && isSelected && <FiCheck size={13} className="stroke-[3]" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-on-surface truncate">
              {trackName}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-on-surface-variant">
              {limit && (
                <span className="font-medium text-[11px] bg-surface-container px-2 py-0.5 rounded-md">
                  Capacity: {membersCount}/{limit}
                </span>
              )}
              {isAlreadyRequested && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Awaiting review
                </span>
              )}
              {isApproved && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Enrolled member
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div className="shrink-0">
          {isAlreadyRequested && (
            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <FiClock size={12} />
              Already Requested
            </span>
          )}
          {isApproved && (
            <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <FiCheckCircle size={12} />
              Approved
            </span>
          )}
          {isRejected && (
            <span className="bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <FiXCircle size={12} />
              Rejected
            </span>
          )}
          {isAvailable && (
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold transition border ${
                isSelected
                  ? "bg-primary-container text-on-primary border-primary-container shadow-sm"
                  : "bg-surface-container-high/60 text-on-surface-variant border-outline-variant/40 hover:bg-primary-container/10 hover:text-primary-container hover:border-primary-container/30"
              }`}
            >
              {isSelected ? "Selected" : "Select"}
            </span>
          )}
        </div>
      </div>
    );
  };

  const isCreatorOrHost =
    user &&
    (user?._id === event?.userId?._id ||
      user?._id === event?.userId ||
      user?.isHost);

  return (
    <div className="w-full text-on-surface font-poppins pb-10">
      {/* Top Header Navigation */}
      <div className="max-w-7xl mx-auto px-6 pt-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/30 hover:border-outline-variant/60 shadow-sm transition"
          aria-label="Go back"
        >
          <FiArrowLeft
            className="text-on-surface-variant group-hover:text-on-surface group-hover:-translate-x-0.5 transition-transform"
            size={18}
          />
        </button>
        <EventOptions event={event} />
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Event details (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4">
              {event?.title}
            </h1>

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-4 text-on-surface-variant text-sm">
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline-variant/30 shadow-sm">
                <FiCalendar className="text-primary-container" />
                <span>{event?.eventDate}</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline-variant/30 shadow-sm">
                <FiClock className="text-primary-container" />
                <span>
                  {event?.startTime} - {event?.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* Event Image */}
          <div className="relative w-full rounded-2xl overflow-hidden aspect-video border border-outline-variant/30 shadow-md">
            <div className="relative w-full h-full">
              <img
                src={event?.imageUrl}
                alt={event?.title}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* About/Description Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/30 pb-2">
              About the Event
            </h2>
            <p className="text-on-surface-variant text-base leading-relaxed whitespace-pre-line font-normal">
              {event?.description}
            </p>
          </div>

          {/* Sub-Events section with SEPARATE containers for Technical & Non-Technical */}
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
              <div>
                <h2 className="text-xl font-bold text-on-surface">
                  Sub-Events Breakdown
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Select multiple sub-events to request entry or proceed to registration.
                </p>
              </div>
              {selectedGroupIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedGroupIds([])}
                  className="text-xs text-rose-500 hover:underline font-semibold"
                >
                  Clear Selection ({selectedGroupIds.length})
                </button>
              )}
            </div>

            {/* Instruction banner guiding users to select and join */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-container/10 via-primary-container/5 to-transparent border border-primary-container/20 flex items-start gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <FiInfo size={19} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-on-surface">
                  Select and Join Your Sub-Events
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Browse the tracks below and click on individual blocks in the <strong className="text-primary-container font-semibold">Technical</strong> and <strong className="text-secondary-lumina font-semibold">Non-Technical</strong> containers to select them. You can pick multiple sub-events and {event?.paid ? "proceed to payment" : "send join requests"} at once to secure your spot.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Technical Events Container */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-primary-container flex items-center gap-2">
                        <FiAward size={18} />
                        <span>Technical Tracks ({technicalTracks.length})</span>
                      </h3>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Click blocks below to select technical sub-events
                      </p>
                    </div>
                    {technicalTracks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleToggleAllInList(technicalTracks)}
                        className="text-xs font-semibold text-primary-container hover:underline px-2 py-1 rounded-md hover:bg-primary-container/10 transition"
                      >
                        Toggle All
                      </button>
                    )}
                  </div>

                  {technicalTracks.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {technicalTracks.map((tech, index) =>
                        renderSubEventBlock(tech, index)
                      )}
                    </div>
                  ) : (
                    <p className="text-on-surface-variant/70 text-sm italic py-4 text-center">
                      No technical tracks scheduled.
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Non-Technical Events Container */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-secondary-lumina flex items-center gap-2">
                        <FiAward size={18} />
                        <span>Non-Technical Tracks ({nonTechnicalTracks.length})</span>
                      </h3>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Click blocks below to select non-technical sub-events
                      </p>
                    </div>
                    {nonTechnicalTracks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleToggleAllInList(nonTechnicalTracks)}
                        className="text-xs font-semibold text-secondary-lumina hover:underline px-2 py-1 rounded-md hover:bg-secondary-lumina/10 transition"
                      >
                        Toggle All
                      </button>
                    )}
                  </div>

                  {nonTechnicalTracks.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {nonTechnicalTracks.map((nonTech, index) =>
                        renderSubEventBlock(nonTech, index)
                      )}
                    </div>
                  ) : (
                    <p className="text-on-surface-variant/70 text-sm italic py-4 text-center">
                      No non-technical tracks scheduled.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Inline Action Bar under containers when sub-events are selected */}
            {selectedGroupIds.length > 0 && (
              <div className="p-4 rounded-2xl bg-surface-container-low border border-primary-container/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center font-bold text-base">
                    {selectedGroupIds.length}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">
                      {selectedGroupIds.length} Sub-Event
                      {selectedGroupIds.length > 1 ? "s" : ""} Selected
                    </h4>
                    <p className="text-xs text-on-surface-variant">
                      {event?.paid
                        ? "Click below to proceed to the payment checkout."
                        : "Click below to send join requests to the organizers."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={event?.paid ? handlePaidProceed : handleFreeRegister}
                  disabled={isPending}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition duration-200 shadow-md flex items-center justify-center gap-2 ${
                    event?.paid
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                      : "bg-primary-container hover:bg-surface-tint text-on-primary"
                  }`}
                >
                  {isPending ? (
                    <Spinner size="sm" />
                  ) : event?.paid ? (
                    <>
                      <span>Proceed to Payment</span>
                      <FiArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      <FiSend size={15} />
                      <span>Submit Request ({selectedGroupIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Organizer Info */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <Avatar
                size="md"
                name={event?.userId?.userName}
                imageUrl={event?.userId?.profile_image_url}
                className="ring-2 ring-primary-container/20"
              />
              <div>
                <span className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                  Organized by
                </span>
                <h3 className="text-lg font-bold text-on-surface">
                  {event?.userId?.userName}
                </h3>
                <p className="text-on-surface-variant text-sm font-normal">
                  {event?.userId?.email}
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                Created on
              </span>
              <p className="text-on-surface text-sm font-medium">
                {formatTimestamp(event?.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Card (1/3 width, Sticky) */}
        <div className="lg:col-span-1">
          <div
            className="sticky top-24 bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-3xl shadow-sm flex flex-col gap-6 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Header Pricing / Type */}
            <div className="pb-4 border-b border-outline-variant/30">
              <span className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold block mb-1">
                Registration Ticket
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-on-surface">
                  {event?.paid ? `₹${event?.amount}` : "Free Entry"}
                </span>
                {event?.paid && (
                  <span className="text-xs text-primary-container bg-primary-container/10 px-2.5 py-0.5 rounded-full border border-primary-container/20 font-semibold">
                    Paid
                  </span>
                )}
              </div>
            </div>

            {/* Inclusions */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase text-on-surface-variant tracking-wider font-bold">
                Event Inclusions
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                    event?.swags
                      ? "bg-primary-container/10 border-primary-container/20 text-primary-container"
                      : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant/70"
                  }`}
                >
                  <FiGift size={16} />
                  <span>Swags {event?.swags ? "Included" : "None"}</span>
                </div>

                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                    event?.refreshments
                      ? "bg-primary-container/10 border-primary-container/20 text-primary-container"
                      : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant/70"
                  }`}
                >
                  <FiCoffee size={16} />
                  <span>
                    Refreshments {event?.refreshments ? "Included" : "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance & Organizer Quick link (for host/organizer) */}
            {isCreatorOrHost && (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to={`/events/${event?._id}/attendance`}
                  className="block w-full text-center bg-primary-container hover:bg-surface-tint text-on-primary font-medium py-3 rounded-xl transition duration-200 shadow-md shadow-primary-container/20"
                >
                  Proceed to Attendance
                </Link>
                <Link
                  className="w-full text-center bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold py-2.5 rounded-xl transition duration-200 shadow-sm flex items-center justify-center gap-2 text-sm border border-outline-variant/30"
                  to={`/events/${event?._id}/attendance`}
                >
                  <span className="material-symbols-outlined text-base">
                    qr_code_scanner
                  </span>
                  <span>Gate Attendance &amp; Scanner</span>
                </Link>
              </div>
            )}

            {/* Attendee Registration & Multi-Select Application Section */}
            {!isCreatorOrHost && (
              <div className="pt-2 flex flex-col gap-3 font-poppins">
                <span className="text-xs uppercase text-on-surface-variant tracking-wider font-bold">
                  Registration &amp; Sub-Events
                </span>

                {/* Selected tracks list pill display */}
                {selectedGroupIds.length > 0 ? (
                  <div className="flex flex-col gap-2 p-3 rounded-2xl bg-surface-container-low border border-primary-container/25">
                    <div className="flex items-center justify-between text-xs font-semibold text-primary-container">
                      <span>{selectedGroupIds.length} Selected:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedGroupIds([])}
                        className="text-on-surface-variant/70 hover:text-rose-500 transition"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto attendance-scrollbar">
                      {selectedTrackNames.map((name, i) => (
                        <span
                          key={i}
                          className="bg-primary-container/15 text-primary-container text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                        >
                          <span className="truncate max-w-[140px]">{name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant space-y-1.5 font-medium">
                    <div className="flex items-center gap-2 text-primary-container font-semibold">
                      <FiInfo size={16} className="shrink-0" />
                      <span>How to select &amp; join:</span>
                    </div>
                    <p className="text-on-surface-variant/90 leading-relaxed text-[11.5px]">
                      1. Select one or more sub-events from the <strong>Technical</strong> or <strong>Non-Technical</strong> containers.
                    </p>
                    <p className="text-on-surface-variant/90 leading-relaxed text-[11.5px]">
                      2. Click <strong>{event?.paid ? "Proceed to Payment" : "Request to Join"}</strong> below to register.
                    </p>
                  </div>
                )}

                {/* Action button: Paid vs Free */}
                {event?.paid ? (
                  <button
                    type="button"
                    onClick={handlePaidProceed}
                    disabled={selectedGroupIds.length === 0}
                    className={`block w-full text-center font-semibold py-3 rounded-xl transition duration-200 shadow-md ${
                      selectedGroupIds.length > 0
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/20 active:scale-[0.99] cursor-pointer"
                        : "bg-surface-container-high text-on-surface-variant/60 cursor-not-allowed border border-outline-variant/30"
                    }`}
                  >
                    {selectedGroupIds.length > 0
                      ? `Proceed to Payment (${selectedGroupIds.length})`
                      : "Select Sub-Events to Pay"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFreeRegister}
                    disabled={selectedGroupIds.length === 0 || isPending}
                    className={`block w-full text-center font-semibold py-3 rounded-xl transition duration-200 shadow-md ${
                      selectedGroupIds.length > 0 && !isPending
                        ? "bg-primary-container hover:bg-surface-tint text-on-primary shadow-primary-container/20 active:scale-[0.99] cursor-pointer"
                        : allAlreadyRequested
                        ? "bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-400 cursor-not-allowed"
                        : allApproved
                        ? "bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 cursor-not-allowed"
                        : "bg-surface-container-high text-on-surface-variant/60 cursor-not-allowed border border-outline-variant/30"
                    }`}
                  >
                    {isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <Spinner size="sm" />
                        <span>Submitting Requests...</span>
                      </div>
                    ) : selectedGroupIds.length > 0 ? (
                      `Request to Join (${selectedGroupIds.length} Selected)`
                    ) : allAlreadyRequested ? (
                      "All Sub-Events Requested"
                    ) : allApproved ? (
                      "All Sub-Events Approved"
                    ) : (
                      "Select Sub-Events to Request"
                    )}
                  </button>
                )}

                {/* Banner when all sub-events have been requested */}
                {allAlreadyRequested && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs">
                    <FiClock className="shrink-0 text-amber-600" size={15} />
                    <span>
                      All sub-events have been requested and are awaiting organizer review.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Like and comment section inside the card */}
            <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span className="flex items-center gap-1.5">
                <FiMessageSquare size={16} className="text-primary-container" />
                <span>{event?.comments || 0} Comments</span>
              </span>
              <span className="flex items-center gap-1.5">
                <FiHeart size={16} className="text-rose-500 fill-rose-500/20" />
                <span>{event?.likes?.length || 0} Likes</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSection;
