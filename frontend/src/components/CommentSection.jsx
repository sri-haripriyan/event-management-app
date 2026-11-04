import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import CommentList from "./CommentList";
import CommentForm from "./CommentForm";

const CommentSection = ({ eventId, event }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleConnectWithHost = () => {
    if (!user) {
      navigate("/login");
    } else {
      navigate(`/chats?eventId=${eventId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 px-6">
      {/* Connect with event host section above the comments */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 sm:p-6 rounded-3xl shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary-container/15 text-primary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">forum</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-on-surface">
              Have questions or want to discuss?
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Connect directly with the event host and attendees in the community chat.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConnectWithHost}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container hover:brightness-110 font-semibold text-xs sm:text-sm transition shadow-sm shrink-0 active:scale-95"
          title="Connect with event host in community chat"
        >
          <span className="material-symbols-outlined text-lg">chat</span>
          <span>Connect with event host</span>
        </button>
      </div>

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
