import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { fetchUserEvents } from "../services/api";
import Event from "../components/Event.jsx";

const MyEvents = () => {
	const { user } = useAuth();
	const { data, isPending } = useQuery({
		queryKey: ["userEvents"],
		queryFn: () => fetchUserEvents(user._id),
	});
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
			{data?.events?.map((event) => (
				<Event event={event} />
			))}
		</div>
	);
};

export default MyEvents;
