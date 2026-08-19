import Event from "./Event";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBlogs } from "../services/api.js";
import Spinner from "./Spinner.jsx";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const EventList = ({ searchTerm }) => {
	const queryClient = useQueryClient();
	const location = useLocation();
	const [page, setPage] = useState(1);
	const [filterType, setFilterType] = useState("all"); // 'all', 'paid', 'free'

	const { isLoading, isPending, data } = useQuery({
		queryKey: ["events", page],
		queryFn: fetchBlogs,
		placeholderData: (previousData) => previousData,
	});

	if (isPending) window.scrollTo({ top: 0, behavior: "smooth" });

	useEffect(() => {
		queryClient.invalidateQueries(["events"]); // Invalidate and refetch events after navigation
	}, [location?.pathname, queryClient]);

	if (isLoading) {
		return (
			<div className="h-[70vh] flex justify-center items-center bg-slate-950">
				<Spinner />
			</div>
		);
	}

	const events = data?.events || [];

	// Local filtering for rich user experience
	const filteredEvents = events.filter((event) => {
		const matchesSearch = !searchTerm || 
			event.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
			event.description?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesFilter = 
			filterType === "all" 
				? true 
				: filterType === "paid" 
				? event.paid 
				: !event.paid;
		return matchesSearch && matchesFilter;
	});

	return (
		<div className="bg-slate-950 text-white pb-20 font-poppins">
			{/* Hero banner section */}
			<div className="max-w-7xl mx-auto px-6 pt-10 pb-8 text-left">
				<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-white select-none">
					Featured Events & Meetups
				</h1>
				<p className="text-slate-400 text-sm sm:text-base max-w-2xl font-light leading-relaxed">
					Discover top-tier gatherings, hackathons, and exclusive meetups in the corporate-futurist space.
				</p>

				{/* Filter Buttons directly placed */}
				<div className="flex flex-wrap items-center gap-3 mt-8">
					{[
						{ value: "all", label: "All Events" },
						{ value: "paid", label: "Paid" },
						{ value: "free", label: "Free" }
					].map((item) => (
						<button
							key={item.value}
							onClick={() => setFilterType(item.value)}
							className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 select-none ${
								filterType === item.value
									? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
									: "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
							}`}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>

			{/* Events Grid */}
			<div className="max-w-7xl mx-auto px-6 mt-6">
				{filteredEvents.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
						{filteredEvents.map((event) => (
							<div key={event?._id} className="animate-fade-in">
								<Event event={event} toDisplay={true} />
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
						<p className="text-slate-500 text-lg">No events found matching your criteria.</p>
						<button
							onClick={() => { setFilterType("all"); }}
							className="mt-4 px-5 py-2 bg-slate-900 hover:bg-slate-850 text-purple-400 font-medium rounded-xl text-sm border border-slate-800 transition"
						>
							Reset Filters
						</button>
					</div>
				)}
			</div>

			{/* Pagination */}
			{data?.totalPages > 1 && (
				<div className="flex justify-center items-center gap-4 mt-16">
					<button
						className="px-5 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 disabled:cursor-not-allowed transition text-sm font-medium"
						onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
						disabled={page === 1}
					>
						← Previous
					</button>

					<span className="text-slate-400 text-sm font-semibold">
						Page <span className="text-white">{page}</span> of <span className="text-white">{data?.totalPages}</span>
					</span>

					<button
						className="px-5 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 disabled:cursor-not-allowed transition text-sm font-medium"
						onClick={() => setPage((prev) => prev + 1)}
						disabled={page >= data?.totalPages}
					>
						Next →
					</button>
				</div>
			)}
		</div>
	);
};

export default EventList;
