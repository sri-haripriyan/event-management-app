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
      <form action="" onSubmit={handleSubmit} className="w-full flex gap-2">
        <select
          onChange={handleChange}
          className=" p-2 rounded-md bg-white text-black"
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
          <div className="p-2 w-12 rounded-lg bg-zinc-500">
            <Spinner size="sm" />
          </div>
        ) : (
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-lg">
            join 
          </button>
        )}
      </form>
    </div>
  );
};

export default RequestButton;
