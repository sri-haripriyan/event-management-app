import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatTimestamp } from "../utils/time";
import { FaXmark } from "react-icons/fa6";
import { TiTick } from "react-icons/ti";
import { FiRotateCcw } from "react-icons/fi";
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
      setLoadingAction(action);
    },
    onSuccess: (response, { action }) => {
      toast.success(response?.data?.message || `Status updated to ${action}`);
      setLocalStatus(
        action === "approve"
          ? "approved"
          : action === "reject"
          ? "rejected"
          : "pending"
      );
      setLoadingAction(null);
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["eventJoinRequests"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
      setLoadingAction(null);
    },
  });

  return (
    <tr className="border-b border-outline-variant/20 hover:bg-surface-container-low text-on-surface text-center transition-colors text-sm">
      <td className="px-4 py-3 font-semibold text-left">{data?.user?.userName}</td>
      <td className="px-4 py-3 text-on-surface-variant text-left">{data?.user?.email}</td>
      <td className="px-4 py-3 font-medium">{data?.group?.name}</td>
      <td className="px-4 py-3">
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
            localStatus === "approved"
              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
              : localStatus === "rejected"
              ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
              : "bg-amber-500/15 text-amber-600 border border-amber-500/30"
          }`}
        >
          {localStatus}
        </span>
      </td>
      <td className="px-4 py-3 text-on-surface-variant">
        {formatTimestamp(data?.createdAt)}
      </td>
      <td className="text-center px-4 py-3">
        <div className="flex gap-1.5 justify-center items-center">
          {/* Action: Approve */}
          {localStatus !== "approved" && (
            <button
              className="w-7 h-7 bg-surface-container-lowest border border-outline-variant/30 hover:bg-emerald-500/10 hover:border-emerald-500/30 rounded-full flex justify-center items-center shadow-sm disabled:opacity-50 transition"
              onClick={() => mutate({ requestId, action: "approve" })}
              disabled={loadingAction === "approve"}
              title="Approve"
            >
              {loadingAction === "approve" ? (
                <span className="animate-spin w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full"></span>
              ) : (
                <TiTick className="text-emerald-600" size={16} />
              )}
            </button>
          )}

          {/* Action: Reject */}
          {localStatus !== "rejected" && (
            <button
              className="w-7 h-7 bg-surface-container-lowest border border-outline-variant/30 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-full flex justify-center items-center shadow-sm disabled:opacity-50 transition"
              onClick={() => mutate({ requestId, action: "reject" })}
              disabled={loadingAction === "reject"}
              title="Reject"
            >
              {loadingAction === "reject" ? (
                <span className="animate-spin w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full"></span>
              ) : (
                <FaXmark className="text-rose-600" size={12} />
              )}
            </button>
          )}

          {/* Action: Change to Pending */}
          {localStatus !== "pending" && (
            <button
              className="w-7 h-7 bg-surface-container-lowest border border-outline-variant/30 hover:bg-amber-500/10 hover:border-amber-500/30 rounded-full flex justify-center items-center shadow-sm disabled:opacity-50 transition"
              onClick={() => mutate({ requestId, action: "pending" })}
              disabled={loadingAction === "pending"}
              title="Set to Pending"
            >
              {loadingAction === "pending" ? (
                <span className="animate-spin w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full"></span>
              ) : (
                <FiRotateCcw className="text-amber-600" size={12} />
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TableRow;
