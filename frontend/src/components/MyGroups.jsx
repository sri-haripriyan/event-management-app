import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getgroups } from "../services/api";
import EventCard from "./EventCard";
import Spinner from "./Spinner";
import { toast } from "react-toastify";

const MyGroups = () => {
  const { data, error, isError, isPending } = useQuery({
    queryKey: ["getgroups"],
    queryFn: () => getgroups("admin"),
  });

  if (isPending)
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  if (isError) return toast.error(error?.response?.data?.message);

  if (data?.message) return <p>{toast.data?.message}</p>; // Show "no group found" message

  return (
    <div className="md:p-6 space-y-6">
      {data?.length > 0 ? (
        data?.map((event) => <EventCard key={event?._id} event={event} />)
      ) : (
        <p>No groups available.</p>
      )}
    </div>
  );
};

export default MyGroups;
