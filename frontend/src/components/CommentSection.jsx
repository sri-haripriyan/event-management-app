import React, { useEffect, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";

const CommentSection = ({ eventId }) => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto mt-10 px-6">
      <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-on-surface border-b border-outline-variant/30 pb-3">
          Comments
        </h2>
        
        {user ? (
          <CommentForm eventId={eventId} />
        ) : (
          <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl text-on-surface-variant text-sm font-normal text-center">
            Please <a href="/login" className="text-primary-container hover:text-surface-tint font-semibold underline transition">login</a> to share your thoughts on this event.
          </div>
        )}

        <CommentList eventId={eventId} />
      </div>
    </div>
  );
};

export default CommentSection;
