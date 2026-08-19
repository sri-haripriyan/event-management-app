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
        <label htmlFor="sortBy" className="text-slate-100">
          Sort By:
        </label>
        <select
          id="sortBy"
          name="sortBy"
          className="text-slate-100 bg-zinc-600 px-3 py-1 rounded border border-zinc-400 cursor-pointer "
          onChange={handleChange}>
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <table className="min-w-full border border-zinc-800 text-zinc-200">
        <thead className="bg-zinc-900">
          <tr>
            <th className="px-4 py-2">User Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Group</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Created At</th>
            <th className="px-4 py-2">Action</th>
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
  );
};

export default RequestComponent;
