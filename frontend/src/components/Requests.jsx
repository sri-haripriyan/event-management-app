import { useQuery } from "@tanstack/react-query";
import React from "react";
import { getGroupJoinRequests } from "../services/api";

const Requests = () => {
  const groupId = "6783b0471263a1852ba837d5";
  const {
    isLoading,
    error,
    isError,
    data: requests,
  } = useQuery({
    queryKey: ["requests", groupId],
    queryFn: () => getGroupJoinRequests(groupId),
    enabled: !!groupId,
   
  });
  

  return (
    <div className="relative h-[88vh] overflow-y-auto">
      <table className="w-full text-sm 2xl:text-base text-left rtl:text-right text-on-surface-variant rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-lowest">
        <thead className="text-xs uppercase bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
          <tr className="h-10">
            <th scope="col" className="px-6 py-3 font-semibold">
              User
            </th>
            <th scope="col" className="px-6 py-3 font-semibold">
              Group
            </th>
            <th className="px-6 py-3 font-semibold">Status</th>
            <th className="px-14 py-3 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/20">
          {requests?.map((request, i) => (
            <tr
              key={i}
              className="odd:bg-surface-container-lowest even:bg-surface-container-low/40 hover:bg-surface-container-low transition-colors text-on-surface"
            >
              <td className="px-6 py-4 font-medium">
                {request?.user?.userName}
              </td>
              <td className="px-6 py-4">{request?.group?.name}</td>
              <td className="px-6 py-4 font-semibold text-primary-container">{request?.status}</td>
              <td className="flex justify-around px-6 py-4">
                <button className="text-emerald-600 font-medium hover:underline" onClick={() => {}}>
                  Approve
                </button>
                <button className="text-rose-500 font-medium hover:underline">Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Requests;
