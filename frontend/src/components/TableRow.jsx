import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatTimestamp } from "../utils/time";
import { FaXmark } from "react-icons/fa6";
import { TiTick } from "react-icons/ti";
import { approve } from "../services/api";
import { toast } from "react-toastify";

const TableRow = ({ data }) => {
  const requestId = data?._id;
  const queryClient = useQueryClient();
 

  const [localStatus, setLocalStatus] = useState(data?.status);
  const [loadingAction, setLoadingAction] = useState(null); 

  const { mutate } = useMutation({
    mutationFn: ({ requestId, action }) => approve({ requestId, action }),
    onMutate: ({ action }) => {
      setLoadingAction(action); // Set loading state to action type
    },
    onSuccess: (response, { action }) => {
      toast.success(response?.data?.message);

      // Update local state only after success
      setLocalStatus(action === "approve" ? "approved" : "rejected");

      // Reset loading state
      setLoadingAction(null);

      // Refetch data from backend
      queryClient.invalidateQueries(["requests"]);
    },
    onError: () => {
      toast.error("Try again");

      // Reset loading state on error
      setLoadingAction(null);
    },
  });

  return (
    <tr className="border-b hover:bg-zinc-500 hover:text-black text-white text-center">
      <td className="px-4 py-2">{data?.user?.userName}</td>
      <td className="px-4 py-2">{data?.user?.email}</td>
      <td className="px-4 py-2">{data?.group?.name}</td>
      <td className="px-4 py-2">{localStatus}</td>
      <td className="px-4 py-2">{formatTimestamp(data?.createdAt)}</td>
      <td className="text-center px-4 py-2">
        {localStatus === "pending" ? (
          <div className="flex gap-1 justify-around items-center">
            <button
              className="w-8 h-8 bg-black rounded-full flex justify-center items-center disabled:opacity-50"
              onClick={() => mutate({ requestId, action: "approve" })}
              disabled={loadingAction === "approve"}>
              {loadingAction === "approve" ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <TiTick color="green" />
              )}
            </button>
            <button
              className="w-8 h-8 bg-black rounded-full flex justify-center items-center disabled:opacity-50"
              onClick={() => mutate({ requestId, action: "reject" })}
              disabled={loadingAction === "reject"}>
              {loadingAction === "reject" ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <FaXmark color="red" />
              )}
            </button>
          </div>
        ) : (
          <p>{localStatus}</p>
        )}
      </td>
    </tr>
  );
};

export default TableRow;
