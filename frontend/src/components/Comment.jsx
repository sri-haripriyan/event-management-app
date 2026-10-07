import React from "react";
import { formatTimestamp } from "../utils/time";
import Avatar from "./Avatar";

const Comment = ({ comment }) => {
  return (
    <div
      key={comment?._id}
      className="flex space-x-4 p-4 bg-surface-container-lowest border border-outline-variant/30 w-full font-poppins rounded-2xl shadow-sm hover:border-primary-container/30 transition duration-300"
    >
      <div className="flex flex-col w-full">
        <div className="flex w-full items-center space-x-2 justify-between">
          <span className="font-semibold text-on-surface flex items-center gap-2">
            <div className="ring-1 ring-outline-variant/30 rounded-full overflow-hidden">
              <Avatar
                size="sm"
                imageUrl={comment?.user?.profile_image_url}
                name={comment?.user?.userName}
              />
            </div>
            <span className="text-on-surface text-sm font-semibold">{comment?.user?.userName}</span>
          </span>
          <span className="text-xs text-on-surface-variant font-medium">
            {formatTimestamp(comment?.createdAt)}
          </span>
        </div>
        <p className="mt-2 text-on-surface-variant text-sm font-normal leading-relaxed pl-1">{comment?.comment}</p>
      </div>
    </div>
  );
};

export default Comment;
