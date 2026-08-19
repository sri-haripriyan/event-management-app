import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import EventList from "../components/EventList";
import Header from "../components/Header";
import ScrollToTop from "../components/ScrollToTop";

const Events = () => {
	const [searchTerm, setSearchTerm] = useState("");

	return (
		<div className="relative w-full min-h-screen bg-slate-950 flex flex-col justify-between overflow-hidden">
			<div>
				<Header showSearch={true} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
				<section>
					<EventList searchTerm={searchTerm} />
					<ScrollToTop />
				</section>
			</div>

			<ToastContainer />

			{/* Footer Block */}
			<footer className="w-full border-t border-slate-900/60 py-8 px-8 sm:px-12 z-10 mt-auto">
				<div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-[13px] text-slate-400 font-light">
					<div className="flex flex-col gap-1 text-center sm:text-left">
						<span className="font-bold text-white text-base tracking-wider leading-none mb-1">ACN.E</span>
						<span className="text-slate-500 text-xs">© 2024 ACN.E Global Events. All rights reserved.</span>
					</div>
					<div className="flex gap-6">
						<a href="#" className="hover:text-white transition">Terms</a>
						<a href="#" className="hover:text-white transition">Privacy</a>
						<a href="#" className="hover:text-white transition">Support</a>
						<a href="#" className="hover:text-white transition">Contact</a>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default Events;
