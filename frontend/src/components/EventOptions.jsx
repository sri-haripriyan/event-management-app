import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { SlOptionsVertical } from "react-icons/sl";
import { MdDelete } from "react-icons/md";
import { CiEdit } from "react-icons/ci";
import { IoShareSocialOutline } from "react-icons/io5";
import { deleteEvent } from "../services/api";
import { useAuth } from "../hooks/useAuth.jsx";
const EventOptions = ({ event }) => {
	const { user } = useAuth();
	const [isDropdown, setIsDropdown] = useState(false);
	const navigate = useNavigate();
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
			className="absolute right-2 sm:right-4 top-4  text-white select-none"
			onClick={() => setIsDropdown((prev) => !prev)}
		>
			<SlOptionsVertical className="text-lg cursor-pointer" />
			<div
				className={`absolute font-roboto border-2 border-gray-500 right-4 text-left bg-white w-28 py-3 shadow-lg shadow-slate-700 rounded-md transform origin-top-right transition-transform  duration-200 ${
					isDropdown ? "scale-100 opacity-100" : "scale-0 opacity-0"
				} `}
			>
				<div className="flex flex-col px-1 gap-2 ">
					<div
						onClick={() => shareEvent()}
						className="hover:shadow-md duration-200  cursor-pointer px-2 py-1 text-green-600 rounded-sm"
					>
						<IoShareSocialOutline className=" inline text-lg" /> Share
					</div>
					{user && user._id === event?.userId?._id && (
						<div className="flex flex-col gap-2">
							<div
								onClick={() => navigate(`/updateEvent/${event?._id}`)}
								className="hover:shadow-md cursor-pointer duration-200 text-blue-900 px-2 py-1 rounded-sm "
							>
								<CiEdit className=" inline text-lg" /> Edit
							</div>
							<button
								onClick={handleDelete}
								disabled={isPending}
								className={`hover:shadow-md text-left cursor-pointer duration-200 text-red-500 px-2 py-1 rounded-sm`}
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
