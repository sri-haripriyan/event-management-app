import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { createComment } from "../services/api";
import { useNavigate } from "react-router-dom";

const CommentForm = ({ eventId }) => {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user]);

  // Mutation to create a comment
  const { isPending, mutate } = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries(["comments", eventId]);
      setCommentText("");
    },

  });

  // Handle Comment Submission
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!commentText.trim()) return;
    mutate({
      comment: commentText,
      user: user?._id,
      event: eventId,
    });
  };
  return (
    <form
      onSubmit={handleAddComment}
      className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-2xl w-full font-poppins flex flex-col justify-end items-end gap-3"
    >
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Write your comment here..."
        rows="3"
        className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-slate-200 outline-none text-sm focus:ring-1 focus:ring-purple-500/30 transition duration-200 max-h-[90px] min-h-[90px] resize-none"
      />
      <button
        type="submit"
        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium transition text-xs shadow-md shadow-purple-950/20 active:scale-[0.98]"
        disabled={isPending}
      >
        {isPending ? "Adding..." : "Add Comment"}
      </button>
    </form>
  );
};

export default CommentForm;
