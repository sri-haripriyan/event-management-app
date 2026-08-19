import React, { useState, useEffect } from "react";
import { MdModeComment } from "react-icons/md";
import { formatCount } from "../utils/numberFormat";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLike } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";
import { FaHeart } from "react-icons/fa";
import { FiCalendar } from "react-icons/fi";

const formatEventDateTime = (dateStr, timeStr) => {
	if (!dateStr) return "No date";
	try {
		const dateObj = new Date(dateStr);
		if (isNaN(dateObj.getTime())) {
			return `${dateStr}${timeStr ? ` • ${timeStr} IST` : ""}`;
		}
		const options = { month: 'short', day: '2-digit', year: 'numeric' };
		const formattedDate = dateObj.toLocaleDateString('en-US', options);
		return `${formattedDate}${timeStr ? ` • ${timeStr} IST` : ""}`;
	} catch (e) {
		return dateStr;
	}
};

const Event = ({ event, toDisplay }) => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	// Sync initial liked state from backend
	const [isLiked, setIsLiked] = useState(false);
	const liked = event?.likes?.includes(user?._id);
	const [likeCount, setLikeCount] = useState(0);
	const count = event?.likes?.length;

	useEffect(() => {
		setIsLiked(liked);
		setLikeCount(count);
	}, [event]);

	const { mutate } = useMutation({
		mutationFn: () => updateLike(event?._id),
		onMutate: async () => {
			setIsLiked((prev) => !prev);
			setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
			await queryClient.cancelQueries(["event", event?._id]);
		},
		onError: (error) => {
			setIsLiked((prev) => !prev);
			setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
		},
		onSettled: () => {
			queryClient.invalidateQueries(["event", event?._id]);
		},
	});

	const handleLike = () => {
		mutate();
	};

	// Compute status overlay badge
	let statusBadge = null;
	if (event?.title?.toLowerCase().includes("hackathon")) {
		statusBadge = { text: "SOLD OUT", type: "soldout" };
	} else if (event?.title?.toLowerCase().includes("test1") || event?.title?.toLowerCase().includes("live")) {
		statusBadge = { text: "LIVE", type: "live" };
	}

	return (
		<div className="glass-card group shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden select-none flex flex-col justify-between h-full hover:scale-[1.01] hover:border-purple-500/25 duration-350 bg-slate-900/10 border border-white/5">
			<div className="relative aspect-[16/10] w-full overflow-hidden border-b border-white/5">
				{/* Status Overlay Badge */}
				{statusBadge && (
					<span
						className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase z-10 select-none ${
							statusBadge.type === "live"
								? "bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
								: "bg-orange-400 text-slate-950 shadow-[0_0_12px_rgba(251,146,60,0.4)]"
						}`}
					>
						{statusBadge.text}
					</span>
				)}

				{/* Price / Free Badge */}
				{event?.paid ? (
					<span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-700/50 text-white text-[11px] font-semibold px-3 py-1 rounded-full z-10 select-none">
						₹{event?.amount}
					</span>
				) : (
					<span className="absolute top-3 right-3 bg-cyan-950/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 text-[11px] font-semibold px-3 py-1 rounded-full z-10 select-none">
						Free
					</span>
				)}

				<Link to={`/events/${event?._id}`} className="w-full h-full block">
					<img
						src={event?.imageUrl || "/api/placeholder/400/320"}
						alt={event?.title || "Event Image"}
						className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
					/>
				</Link>
			</div>

			<div className="p-5 flex-grow flex flex-col justify-between">
				<div>
					{/* Date-Time Row */}
					<div className="flex items-center gap-2 text-xs text-slate-400 mb-2.5">
						<FiCalendar className="text-slate-500 text-sm" />
						<span>{formatEventDateTime(event?.eventDate, event?.startTime)}</span>
					</div>

					{/* Title */}
					<h2 className="text-xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors duration-200 truncate">
						<Link to={`/events/${event?._id}`}>{event?.title || "Untitled Event"}</Link>
					</h2>
				</div>

				{toDisplay && (
					<div className="mt-2 w-full pt-4 border-t border-white/5 flex items-center justify-between">
						{/* User Info */}
						<div className="flex items-center gap-2">
							<div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/10">
								<Avatar
									size="sm"
									imageUrl={event?.userId?.profile_image_url}
									name={event?.userId?.userName}
								/>
							</div>
							<span className="text-slate-400 text-xs font-medium truncate max-w-[80px] sm:max-w-[120px]">
								{event?.userId?.userName}
							</span>
						</div>

						{/* Stats */}
						<div className="flex items-center gap-4 text-xs">
							{/* Likes */}
							<div className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition cursor-pointer" onClick={handleLike}>
								<FaHeart
									size={14}
									className={`transition-transform active:scale-75 duration-200 ${
										isLiked ? "text-red-500" : "text-slate-500"
									}`}
								/>
								<span className="text-slate-400 font-medium">{formatCount(likeCount)}</span>
							</div>

							{/* Comments */}
							<div className="flex items-center gap-1.5 text-slate-400">
								<MdModeComment size={14} className="text-slate-500" />
								<span className="text-slate-400 font-medium">
									{formatCount(event?.comments || 0)}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Event;
