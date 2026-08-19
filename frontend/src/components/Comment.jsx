import React from "react";
import { formatTimestamp } from "../utils/time";
import Avatar from "./Avatar";

const Comment = ({ comment }) => {
  return (
    <div
      key={comment?._id}
      className="flex space-x-4 p-4 bg-slate-900/60 border border-white/5 w-full font-poppins rounded-2xl shadow-sm hover:border-purple-500/10 transition duration-300"
    >
      <div className="flex flex-col w-full">
        <div className="flex w-full items-center space-x-2 justify-between">
          <span className="font-semibold text-white flex items-center gap-2">
            <div className="ring-1 ring-white/10 rounded-full overflow-hidden">
              <Avatar
                size="sm"
                imageUrl={comment?.user?.profile_image_url}
                name={comment?.user?.userName}
              />
            </div>
            <span className="text-slate-200 text-sm font-semibold">{comment?.user?.userName}</span>
          </span>
          <span className="text-xs text-slate-500">
            {formatTimestamp(comment?.createdAt)}
          </span>
        </div>
        <p className="mt-2 text-slate-300 text-sm font-light leading-relaxed pl-1">{comment?.comment}</p>
      </div>
    </div>
  );
};

export default Comment;
