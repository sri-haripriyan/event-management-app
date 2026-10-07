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
		<div className="group shadow-sm rounded-2xl overflow-hidden select-none flex flex-col justify-between h-full hover:shadow-md hover:border-primary-container/40 transition-all duration-300 bg-surface-container-lowest border border-outline-variant/30">
			<div className="relative aspect-[16/10] w-full overflow-hidden border-b border-surface-container-high">
				{/* Status Overlay Badge */}
				{statusBadge && (
					<span
						className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase z-10 select-none ${
							statusBadge.type === "live"
								? "bg-cyan-500 text-white shadow-sm"
								: "bg-orange-500 text-white shadow-sm"
						}`}
					>
						{statusBadge.text}
					</span>
				)}

				{/* Price / Free Badge */}
				{event?.paid ? (
					<span className="absolute top-3 right-3 bg-primary-container text-on-primary text-[11px] font-semibold px-3 py-1 rounded-full z-10 select-none shadow-sm">
						₹{event?.amount}
					</span>
				) : (
					<span className="absolute top-3 right-3 bg-secondary-container text-on-secondary-container text-[11px] font-semibold px-3 py-1 rounded-full z-10 select-none shadow-sm">
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
					<div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2.5">
						<FiCalendar className="text-outline text-sm" />
						<span>{formatEventDateTime(event?.eventDate, event?.startTime)}</span>
					</div>

					{/* Title */}
					<h2 className="text-xl font-bold text-on-surface mb-4 group-hover:text-primary-container transition-colors duration-200 truncate">
						<Link to={`/events/${event?._id}`}>{event?.title || "Untitled Event"}</Link>
					</h2>
				</div>

				{toDisplay && (
					<div className="mt-2 w-full pt-4 border-t border-surface-container-high flex items-center justify-between">
						{/* User Info */}
						<div className="flex items-center gap-2">
							<div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-outline-variant/50">
								<Avatar
									size="sm"
									imageUrl={event?.userId?.profile_image_url}
									name={event?.userId?.userName}
								/>
							</div>
							<span className="text-on-surface-variant text-xs font-medium truncate max-w-[80px] sm:max-w-[120px]">
								{event?.userId?.userName}
							</span>
						</div>

						{/* Stats */}
						<div className="flex items-center gap-4 text-xs">
							{/* Likes */}
							<div className="flex items-center gap-1.5 text-on-surface-variant hover:text-red-500 transition cursor-pointer" onClick={handleLike}>
								<FaHeart
									size={14}
									className={`transition-transform active:scale-75 duration-200 ${
										isLiked ? "text-red-500" : "text-outline"
									}`}
								/>
								<span className="text-on-surface-variant font-medium">{formatCount(likeCount)}</span>
							</div>

							{/* Comments */}
							<div className="flex items-center gap-1.5 text-on-surface-variant">
								<MdModeComment size={14} className="text-outline" />
								<span className="text-on-surface-variant font-medium">
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
