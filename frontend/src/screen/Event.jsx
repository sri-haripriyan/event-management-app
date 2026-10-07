import { lazy } from "react";
import { useParams } from "react-router-dom";
import { Fetchevent } from "../services/api";
import { useQuery } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";

const CommentSection = lazy(() => import("../components/CommentSection"));
const EventSection = lazy(() => import("../components/EventSection"));
const Spinner = lazy(() => import("../components/Spinner"));

const Event = () => {
	const { eventId } = useParams();
	const { data, isLoading } = useQuery({
		queryKey: ["getevents", eventId],
		queryFn: () => Fetchevent(eventId),
		enabled: !!eventId,
	});

	const event = data?.event;

	return (
		<div className="w-full min-h-screen bg-surface text-on-surface font-poppins">
			{isLoading ? (
				<div className="flex justify-center w-full items-center min-h-[80vh] pt-16">
					<Spinner />
				</div>
			) : (
				<div className="animate-fade-in pt-16">
					<EventSection event={event} />
					<CommentSection eventId={eventId} />
					<ToastContainer />
				</div>
			)}
		</div>
	);
};
export default Event;
