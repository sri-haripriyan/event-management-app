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
    <tr className="border-b border-outline-variant/20 hover:bg-surface-container-low text-on-surface text-center transition-colors text-sm">
      <td className="px-4 py-3">{data?.user?.userName}</td>
      <td className="px-4 py-3">{data?.user?.email}</td>
      <td className="px-4 py-3">{data?.group?.name}</td>
      <td className="px-4 py-3">{localStatus}</td>
      <td className="px-4 py-3 text-on-surface-variant">{formatTimestamp(data?.createdAt)}</td>
      <td className="text-center px-4 py-3">
        {localStatus === "pending" ? (
          <div className="flex gap-2 justify-center items-center">
            <button
              className="w-8 h-8 bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container rounded-full flex justify-center items-center shadow-sm disabled:opacity-50"
              onClick={() => mutate({ requestId, action: "approve" })}
              disabled={loadingAction === "approve"}>
              {loadingAction === "approve" ? (
                <span className="animate-spin w-4 h-4 border-2 border-primary-container border-t-transparent rounded-full"></span>
              ) : (
                <TiTick className="text-emerald-600" size={18} />
              )}
            </button>
            <button
              className="w-8 h-8 bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container rounded-full flex justify-center items-center shadow-sm disabled:opacity-50"
              onClick={() => mutate({ requestId, action: "reject" })}
              disabled={loadingAction === "reject"}>
              {loadingAction === "reject" ? (
                <span className="animate-spin w-4 h-4 border-2 border-primary-container border-t-transparent rounded-full"></span>
              ) : (
                <FaXmark className="text-rose-600" size={14} />
              )}
            </button>
          </div>
        ) : (
          <p className="font-medium text-xs uppercase">{localStatus}</p>
        )}
      </td>
    </tr>
  );
};

export default TableRow;
