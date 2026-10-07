import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { getGroupByEventId } from "../services/api";
import { request } from "../services/api";
import Spinner from "./Spinner";
import { toast, ToastContainer } from "react-toastify";

const RequestButton = () => {
  const { eventId } = useParams();
  const [groupId, setGroupId] = useState(null);
  const {
    data,
    error,
    isError,
    isPending: eventPending,
    isLoading,
  } = useQuery({
    queryKey: ["getGroupByEventId", eventId],
    queryFn: () => getGroupByEventId(eventId),
  });
  const handleChange = (e) => {
        setGroupId(e.target.value);
  };
  const { mutate, isPending } = useMutation({
    mutationFn: ({ groupId, eventId }) => request({ groupId, eventId }),
    onError: (error) => {
      toast.error(error?.response?.data?.message);
    },
    onSuccess: (data) => {
      toast(data?.data?.message);
          },
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({ groupId, eventId });
  };
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full flex gap-2 items-center">
        <select
          onChange={handleChange}
          className="flex-1 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-sm outline-none"
          defaultValue={""}>
          <option value="" disabled>
            Select an Event
          </option>
          {data?.map((event, index) => (
            <option key={index} value={event?._id}>
              {event?.name}
            </option>
          ))}
        </select>
        {isPending ? (
          <div className="p-2 w-12 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : (
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary-container hover:bg-surface-tint text-on-primary rounded-xl font-medium text-sm transition duration-200 shadow-sm active:scale-[0.98]">
            Join 
          </button>
        )}
      </form>
    </div>
  );
};

export default RequestButton;
