import { ToastContainer } from "react-toastify";
import EventList from "../components/EventList";
import ScrollToTop from "../components/ScrollToTop";

const Events = () => {
	return (
		<div className="relative w-full min-h-screen bg-surface flex flex-col justify-between overflow-hidden text-on-surface font-poppins">
			<div>
				<section className="pt-16">
					<EventList />
					<ScrollToTop />
				</section>
			</div>

			<ToastContainer />

			{/* Footer Block */}
			<footer className="w-full border-t border-surface-container-high py-8 px-8 sm:px-12 z-10 mt-auto bg-surface-container-low/50">
				<div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-[13px] text-on-surface-variant font-light">
					<div className="flex flex-col gap-1 text-center sm:text-left">
						<span className="font-bold text-on-surface text-base tracking-wider leading-none mb-1">ACN.</span>
						<span className="text-on-surface-variant text-xs">© 2025 ACN. Global Events. All rights reserved.</span>
					</div>
					<div className="flex gap-6">
						<a href="#" className="hover:text-on-surface transition">Terms</a>
						<a href="#" className="hover:text-on-surface transition">Privacy</a>
						<a href="#" className="hover:text-on-surface transition">Support</a>
						<a href="#" className="hover:text-on-surface transition">Contact</a>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default Events;
