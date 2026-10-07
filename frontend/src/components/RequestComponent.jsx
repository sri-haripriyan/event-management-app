import React, { useEffect } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGroupJoinRequests } from "../services/api";
import TableRow from "./TableRow";
import Spinner from "./Spinner";
import { useSocketContext } from "../context/socketContext";
import { useAuth } from "../hooks/useAuth";

const RequestComponent = () => {
  const { socket } = useSocketContext();
  const { user } = useAuth();
  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["requests"],
    queryFn: getGroupJoinRequests,
  });
  useEffect(() => {
    socket?.emit("register_admin", user._id);

    socket?.on("new_request", (newRequest) => {
      refetch();
    });

    return () => {
      socket?.off("new_request");
    };
  }, []);

  const [sortBy, setSortBy] = useState(data?.status || "all");

  const handleChange = (e) => {
    setSortBy(e.target.value);
  };

  // Filter the data based on the selected status
  const filteredData = data?.filter((item) => item?.status === sortBy) || [];

  if (error) return <p>Error loading requests</p>;

  return (
    <div className="overflow-x-auto">
      {isPending && (
        <div className="flex justify-center items-center h-screen w-screen">
          <Spinner />
        </div>
      )}
      <div className="flex items-center p-2 gap-2">
        <label htmlFor="sortBy" className="text-on-surface text-sm font-medium">
          Sort By:
        </label>
        <select
          id="sortBy"
          name="sortBy"
          className="text-on-surface bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40 cursor-pointer text-sm outline-none"
          onChange={handleChange}>
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
        <table className="min-w-full text-on-surface text-sm">
          <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface font-semibold">
            <tr>
              <th className="px-4 py-3">User Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {sortBy === "all"
              ? data?.map((item) => <TableRow key={item?._id} data={item} />)
              : filteredData?.map((item) => (
                  <TableRow key={item?._id} data={item} />
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestComponent;
