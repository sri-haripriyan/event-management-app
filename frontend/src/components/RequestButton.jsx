import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGroupByEventId, getUserEventRequestStatus, bulkJoinRequest } from "../services/api";
import { useAuth } from "../hooks/useAuth.jsx";
import Spinner from "./Spinner";
import { toast } from "react-toastify";
import {
  FiCheck,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSend,
  FiLayers,
} from "react-icons/fi";

const RequestButton = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const {
    data: subEvents,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["getGroupByEventId", eventId],
    queryFn: () => getGroupByEventId(eventId),
    enabled: !!eventId,
  });

  // Query authenticated request status for current user
  const { data: requestStatusData } = useQuery({
    queryKey: ["userEventRequestStatus", eventId],
    queryFn: () => getUserEventRequestStatus(eventId),
    enabled: !!eventId && !!user,
  });

  const getSubEventStatus = (subEvent) => {
    if (!subEvent) return "none";

    // 1. Check authenticated request status API response first
    const authStatus = requestStatusData?.statusMap?.[subEvent._id];
    if (authStatus === "already requested" || authStatus === "pending") {
      return "already requested";
    }
    if (authStatus === "approved") {
      return "approved";
    }
    if (authStatus === "rejected") {
      return "rejected";
    }

    // 2. Fallback to subEvent fields from getGroupByEventId
    if (subEvent.isMember || subEvent.requestStatus === "approved") {
      return "approved";
    }
    if (
      subEvent.requestStatus === "already requested" ||
      subEvent.requestStatus === "pending"
    ) {
      return "already requested";
    }
    if (subEvent.requestStatus === "rejected") {
      return "rejected";
    }
    return "none";
  };

  const availableSubEvents =
    subEvents?.filter((event) => getSubEventStatus(event) === "none") || [];

  const allAvailableSelected =
    availableSubEvents.length > 0 &&
    availableSubEvents.every((item) => selectedGroupIds.includes(item._id));

  const allAlreadyRequested =
    subEvents &&
    subEvents.length > 0 &&
    subEvents.every((event) => getSubEventStatus(event) === "already requested");

  const allApproved =
    subEvents &&
    subEvents.length > 0 &&
    subEvents.every((event) => getSubEventStatus(event) === "approved");

  const handleToggle = (id) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (allAvailableSelected) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(availableSubEvents.map((item) => item._id));
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: ({ groupIds, eventId }) =>
      bulkJoinRequest({ groupIds, eventId }),
    onMutate: async ({ groupIds }) => {
      await queryClient.cancelQueries({
        queryKey: ["getGroupByEventId", eventId],
      });
      await queryClient.cancelQueries({
        queryKey: ["userEventRequestStatus", eventId],
      });

      const prevGroupData = queryClient.getQueryData([
        "getGroupByEventId",
        eventId,
      ]);
      const prevStatusData = queryClient.getQueryData([
        "userEventRequestStatus",
        eventId,
      ]);

      // Optimistically update getGroupByEventId cache
      queryClient.setQueryData(["getGroupByEventId", eventId], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((item) =>
          groupIds.includes(item._id)
            ? { ...item, requestStatus: "already requested" }
            : item
        );
      });

      // Optimistically update userEventRequestStatus cache
      queryClient.setQueryData(["userEventRequestStatus", eventId], (old) => {
        if (!old) return old;
        const updatedStatusMap = { ...(old.statusMap || {}) };
        groupIds.forEach((id) => {
          updatedStatusMap[id] = "already requested";
        });
        return {
          ...old,
          statusMap: updatedStatusMap,
        };
      });

      setSelectedGroupIds([]);
      return { prevGroupData, prevStatusData };
    },
    onError: (err, variables, context) => {
      if (context?.prevGroupData) {
        queryClient.setQueryData(
          ["getGroupByEventId", eventId],
          context.prevGroupData
        );
      }
      if (context?.prevStatusData) {
        queryClient.setQueryData(
          ["userEventRequestStatus", eventId],
          context.prevStatusData
        );
      }
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to submit join request";
      toast.error(errorMsg);
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Join requests submitted successfully");
      queryClient.invalidateQueries({
        queryKey: ["getGroupByEventId", eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["userEventRequestStatus", eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["userJoinRequests", eventId],
      });
    },
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please login to register for sub-events");
      navigate("/login");
      return;
    }
    if (selectedGroupIds.length === 0) {
      toast.warn("Please select at least one sub-event to register");
      return;
    }
    mutate({ groupIds: selectedGroupIds, eventId });
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-on-surface-variant text-xs gap-2">
        <Spinner size="sm" />
        <span>Loading sub-events...</span>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="w-full p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
        Failed to load sub-events. Please try refreshing.
      </div>
    );
  }

  // 3. Empty State
  if (!subEvents || subEvents.length === 0) {
    return (
      <div className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-on-surface-variant text-xs text-center font-medium">
        No sub-events available to join for this event.
      </div>
    );
  }

  const isSubmitDisabled =
    selectedGroupIds.length === 0 ||
    isPending ||
    allAlreadyRequested ||
    allApproved;

  const getButtonText = () => {
    if (isPending) {
      return `Registering (${selectedGroupIds.length})...`;
    }
    if (selectedGroupIds.length > 0) {
      return `Register for ${selectedGroupIds.length} Selected Event${
        selectedGroupIds.length > 1 ? "s" : ""
      }`;
    }
    if (allAlreadyRequested) {
      return "All Sub-Events Requested";
    }
    if (allApproved) {
      return "All Sub-Events Approved";
    }
    return "Select Sub-Events to Register";
  };

  const getButtonStyles = () => {
    if (isPending) {
      return "bg-surface-container-high text-on-surface-variant cursor-wait border border-outline-variant/30";
    }
    if (selectedGroupIds.length > 0) {
      return "bg-primary-container hover:bg-surface-tint text-on-primary shadow-md shadow-primary-container/25 active:scale-[0.99] cursor-pointer";
    }
    if (allAlreadyRequested) {
      return "bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-400 cursor-not-allowed";
    }
    if (allApproved) {
      return "bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 cursor-not-allowed";
    }
    return "bg-surface-container-high text-on-surface-variant/60 cursor-not-allowed border border-outline-variant/30";
  };

  return (
    <div className="w-full flex flex-col gap-3 font-poppins">
      {/* Header with Title and Select All Controls */}
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
          <FiLayers className="text-primary-container" size={14} />
          <span>Sub-Events ({subEvents.length})</span>
        </span>
        {availableSubEvents.length > 1 && (
          <button
            type="button"
            onClick={handleToggleAll}
            className="text-xs font-semibold text-primary-container hover:text-surface-tint hover:underline transition select-none"
          >
            {allAvailableSelected ? "Deselect All" : "Select All Available"}
          </button>
        )}
      </div>

      {/* Individual Sub-Event Blocks */}
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 attendance-scrollbar">
        {subEvents.map((event) => {
          const status = getSubEventStatus(event);
          const isSelected = selectedGroupIds.includes(event._id);

          // 1. Already Requested Block
          if (status === "already requested") {
            return (
              <div
                key={event._id}
                className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 select-none cursor-not-allowed transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FiClock size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-on-surface truncate">
                      {event.name}
                    </div>
                    <div className="text-[11px] text-amber-700/80 dark:text-amber-300/80 font-medium">
                      Awaiting review
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                  Already Requested
                </span>
              </div>
            );
          }

          // 2. Approved Block
          if (status === "approved") {
            return (
              <div
                key={event._id}
                className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 select-none cursor-not-allowed transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FiCheckCircle size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-on-surface truncate">
                      {event.name}
                    </div>
                    <div className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 font-medium">
                      Enrolled
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                  Approved
                </span>
              </div>
            );
          }

          // 3. Rejected Block
          if (status === "rejected") {
            return (
              <div
                key={event._id}
                className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-3 select-none cursor-not-allowed opacity-80 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <FiXCircle size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-on-surface truncate">
                      {event.name}
                    </div>
                    <div className="text-[11px] text-rose-700/80 dark:text-rose-300/80 font-medium">
                      Not approved
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                  Rejected
                </span>
              </div>
            );
          }

          // 4. Available Block (Interactive Selection)
          return (
            <div
              key={event._id}
              onClick={() => handleToggle(event._id)}
              className={`group p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-3 ${
                isSelected
                  ? "bg-primary-container/10 border-primary-container ring-1 ring-primary-container/30 shadow-sm"
                  : "bg-surface-container-low hover:bg-surface-container border-outline-variant/30 hover:border-outline-variant/60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Select Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "bg-primary-container text-on-primary shadow-sm"
                      : "border-2 border-outline-variant/60 group-hover:border-primary-container/60 bg-surface-container-lowest"
                  }`}
                >
                  {isSelected && <FiCheck size={13} className="stroke-[3]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-on-surface truncate">
                    {event.name}
                  </div>
                  {event.limit && (
                    <div className="text-[11px] text-on-surface-variant font-medium">
                      Capacity: {event.membersCount || 0}/{event.limit}
                    </div>
                  )}
                </div>
              </div>

              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 border transition ${
                  isSelected
                    ? "bg-primary-container text-on-primary border-primary-container"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 group-hover:bg-primary-container/10 group-hover:text-primary-container group-hover:border-primary-container/30"
                }`}
              >
                {isSelected ? "Selected" : "Select"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleRegister}
        disabled={isSubmitDisabled}
        className={`w-full py-3 px-4 rounded-xl text-sm transition-all duration-200 select-none flex items-center justify-center gap-2 font-semibold ${getButtonStyles()}`}
      >
        {isPending && <Spinner size="sm" />}
        {!isPending && isSubmitDisabled && allAlreadyRequested && (
          <FiClock size={16} />
        )}
        {!isPending && isSubmitDisabled && allApproved && (
          <FiCheckCircle size={16} />
        )}
        {!isPending && selectedGroupIds.length > 0 && <FiSend size={15} />}
        <span>{getButtonText()}</span>
      </button>

      {/* Selected Items Counter Helper */}
      {selectedGroupIds.length > 0 && (
        <div className="text-center text-xs text-on-surface-variant font-medium">
          {selectedGroupIds.length} sub-event
          {selectedGroupIds.length > 1 ? "s" : ""} selected for batch registration
        </div>
      )}
    </div>
  );
};

export default RequestButton;
