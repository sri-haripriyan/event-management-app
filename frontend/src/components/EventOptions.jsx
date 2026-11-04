import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { SlOptionsVertical } from "react-icons/sl";
import { MdDelete } from "react-icons/md";
import { CiEdit } from "react-icons/ci";
import { IoShareSocialOutline } from "react-icons/io5";
import { deleteEvent } from "../services/api";
import { useAuth } from "../hooks/useAuth.jsx";

const EventOptions = ({ event, subEventGroups = [] }) => {
	const { user } = useAuth();
	const [isDropdown, setIsDropdown] = useState(false);
	const navigate = useNavigate();

	const currentUserId = user?._id ? String(user._id) : null;
	const eventCreatorId = event?.userId?._id
		? String(event.userId._id)
		: event?.userId
		? String(event.userId)
		: null;

	// 1. Creator of THIS event or platform super-admin
	const isEventCreator = Boolean(
		currentUserId &&
			eventCreatorId &&
			(currentUserId === eventCreatorId || user?.role === "admin")
	);

	// 2. Sub-event Admin or Moderator for THIS specific event
	const isSubEventModeratorOrAdmin = Boolean(
		currentUserId &&
			Array.isArray(subEventGroups) &&
			subEventGroups.some((g) => {
				const groupAdminId = g?.admin?._id
					? String(g.admin._id)
					: g?.admin
					? String(g.admin)
					: null;
				const isAdm = g?.isAdmin === true || (groupAdminId && groupAdminId === currentUserId);
				const isMod =
					g?.isModerator === true ||
					(Array.isArray(g?.moderators) &&
						g.moderators.some((m) => {
							const modId = m?._id ? String(m._id) : m ? String(m) : null;
							return modId && modId === currentUserId;
						}));
				return Boolean(isAdm || isMod);
			})
	);

	// Controls strictly only for admins and moderators of THIS event
	const canManageEvent = Boolean(isEventCreator || isSubEventModeratorOrAdmin);

	const shareEvent = async () => {
		const eventUrl = `${location.origin}/events/${event?._id}`;
		if (navigator.share) {
			navigator.share({
				url: eventUrl,
			});
		} else {
			await navigator.clipboard.writeText(eventUrl);
			toast.success("Copied to clipboard!");
		}
	};

	const { mutate, isPending } = useMutation({
		mutationFn: deleteEvent,
		onSuccess: (data) => {
			navigate("/events");
			toast.success(data?.message);
		},
		onError: (error) => {
			toast.error(error?.message || error);
		},
	});

	const handleDelete = (e) => {
		e.preventDefault();
		mutate(event?._id);
	};

	return (
		<div
			className="absolute right-2 sm:right-4 top-4 text-on-surface-variant hover:text-on-surface select-none"
			onClick={() => setIsDropdown((prev) => !prev)}
		>
			<SlOptionsVertical className="text-lg cursor-pointer" />
			<div
				className={`absolute font-poppins border border-outline-variant/30 right-4 text-left bg-surface-container-lowest w-36 py-2 shadow-lg rounded-xl transform origin-top-right transition-transform duration-200 z-30 ${
					isDropdown ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
				} `}
			>
				<div className="flex flex-col px-1 gap-2">
					<div
						onClick={() => shareEvent()}
						className="hover:shadow-md duration-200 cursor-pointer px-2 py-1 text-green-600 rounded-sm"
					>
						<IoShareSocialOutline className="inline text-lg" /> Share
					</div>

					{/* Event Management Links: Visible ONLY to Creator/Admin and Sub-Event Moderators */}
					{canManageEvent && (
						<div className="flex flex-col gap-2 border-t border-outline-variant/20 pt-1">
							{!event?.paid && (
								<div
									onClick={() => navigate(`/events/${event?._id}/requests`)}
									className="hover:shadow-md cursor-pointer duration-200 text-indigo-600 px-2 py-1 rounded-sm flex items-center gap-1.5 text-xs font-semibold"
								>
									<span className="material-symbols-outlined text-base">group</span> Requests
								</div>
							)}
							<div
								onClick={() => navigate(`/events/${event?._id}/attendance`)}
								className="hover:shadow-md cursor-pointer duration-200 text-primary-container px-2 py-1 rounded-sm flex items-center gap-1.5 text-xs font-semibold"
							>
								<span className="material-symbols-outlined text-base">qr_code_scanner</span> Attendance
							</div>
						</div>
					)}

					{/* Destructive / Modification Actions: Visible ONLY to Event Creator or Host */}
					{isEventCreator && (
						<div className="flex flex-col gap-2 border-t border-outline-variant/20 pt-1">
							<div
								onClick={() => navigate(`/events/${event?._id}/manage`)}
								className="hover:shadow-md cursor-pointer duration-200 text-blue-900 px-2 py-1 rounded-sm flex items-center gap-1.5 text-xs font-medium"
							>
								<span className="material-symbols-outlined text-base">settings</span> Manage
							</div>
							<div
								onClick={() => navigate(`/events/${event?._id}/edit`)}
								className="hover:shadow-md cursor-pointer duration-200 text-on-surface px-2 py-1 rounded-sm flex items-center gap-1.5 text-xs font-medium"
							>
								<CiEdit className="inline text-lg" /> Edit
							</div>
							<button
								onClick={handleDelete}
								disabled={isPending}
								className={`hover:shadow-md text-left cursor-pointer duration-200 text-red-500 px-2 py-1 rounded-sm flex items-center gap-1.5 text-xs font-medium`}
							>
								<MdDelete className="inline text-lg" /> Delete
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default EventOptions;
