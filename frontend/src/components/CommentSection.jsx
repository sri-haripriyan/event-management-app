import React, { useEffect, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";

const CommentSection = ({ eventId }) => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto mt-10 px-6">
      <div className="bg-slate-900/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-slate-800/80 pb-3">
          Comments
        </h2>
        
        {user ? (
          <CommentForm eventId={eventId} />
        ) : (
          <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl text-slate-400 text-sm font-light text-center">
            Please <a href="/login" className="text-purple-400 hover:text-purple-350 font-semibold underline transition">login</a> to share your thoughts on this event.
          </div>
        )}

        <CommentList eventId={eventId} />
      </div>
    </div>
  );
};

export default CommentSection;
