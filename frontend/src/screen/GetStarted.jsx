import { Link } from "react-router-dom";

const GetStarted = () => {
	return (
		<div className="relative min-h-screen bg-surface flex flex-col justify-between overflow-hidden font-poppins text-on-surface">
			{/* Blurred Decorative Background Circles */}
			<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-fixed/40 rounded-full blur-[120px] pointer-events-none"></div>
			<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-[120px] pointer-events-none"></div>

			{/* Grid Overlay */}
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#131b2e06_1px,transparent_1px),linear-gradient(to_bottom,#131b2e06_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_80%,transparent_100%)] pointer-events-none"></div>


			{/* Hero Center Block */}
			<div className="z-10 w-full max-w-4xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center justify-center text-center gap-6 animate-fade-in flex-1">
				{/* Pill Capsule Badge */}
				<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-[10px] tracking-widest text-on-surface-variant font-bold uppercase mb-2 shadow-sm">
					Next-Gen Event Platform
				</div>

				{/* Custom Gradient Heading */}
				<h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.2] sm:leading-[1.1] max-w-3xl text-center select-none">
					<span className="block text-on-surface mb-1">Simple Registration.</span>
					<span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-container via-purple-600 to-indigo-600">
						Smooth Communication.
					</span>
				</h1>

				{/* Hero Subtitle Text */}
				<p className="text-[13px] sm:text-sm md:text-base text-on-surface-variant max-w-xl md:max-w-2xl leading-relaxed font-light mt-2 px-4">
					Elevate your live events with a platform built for modern professionals. Experience deep immersion, seamless ticketing, and high-energy networking in a digital cockpit designed for the future.
				</p>

				{/* Call to Action Buttons */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 w-full sm:w-auto px-6">
					<Link
						to="/events"
						className="w-full sm:w-auto px-8 py-3 bg-primary-container hover:bg-surface-tint text-on-primary font-semibold text-sm rounded-xl transition duration-200 shadow-md shadow-primary-container/20 active:scale-[0.98] select-none text-center"
					>
						Get Started
					</Link>
					<Link
						to="/about"
						className="w-full sm:w-auto px-8 py-3 rounded-xl border border-outline-variant hover:border-on-surface text-on-surface hover:bg-surface-container transition duration-200 text-sm select-none text-center font-medium shadow-sm"
					>
						Learn More
					</Link>
				</div>
			</div>

			{/* Footer Block */}
			<footer className="w-full border-t border-surface-container-high py-8 px-8 sm:px-12 z-10 bg-surface-container-low/50">
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

export default GetStarted;
