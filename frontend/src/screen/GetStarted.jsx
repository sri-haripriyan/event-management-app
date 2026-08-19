import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";

const GetStarted = () => {
	return (
		<div className="relative min-h-screen bg-slate-950 flex flex-col justify-between overflow-hidden font-poppins">
			{/* Blurred Decorative Background Circles */}
			<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
			<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-650/10 rounded-full blur-[120px] pointer-events-none"></div>

			{/* Grid Overlay */}
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_80%,transparent_100%)] pointer-events-none"></div>

			{/* Header Navigation */}
			<Header />

			{/* Hero Center Block */}
			<div className="z-10 w-full max-w-4xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center gap-6 animate-fade-in flex-1">
				{/* Pill Capsule Badge */}
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80 text-[10px] tracking-widest text-slate-400 font-bold uppercase mb-2 shadow-inner">
					Next-Gen Event Platform
				</div>

				{/* Custom Gradient Heading */}
				<h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.2] sm:leading-[1.1] max-w-3xl text-center select-none">
					<span className="block text-white mb-1">Simple Registration.</span>
					<span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
						Smooth Communication.
					</span>
				</h1>

				{/* Hero Subtitle Text */}
				<p className="text-[13px] sm:text-sm md:text-base text-slate-400 max-w-xl md:max-w-2xl leading-relaxed font-light mt-2 px-4">
					Elevate your live events with a platform built for modern professionals. Experience deep immersion, seamless ticketing, and high-energy networking in a digital cockpit designed for the future.
				</p>

				{/* Call to Action Buttons */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 w-full sm:w-auto px-6">
					<Link
						to="/events"
						className="w-full sm:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-550 hover:bg-purple-500 text-white font-semibold text-sm rounded-xl transition duration-200 shadow-md shadow-purple-950/40 active:scale-[0.98] select-none text-center"
					>
						Get Started
					</Link>
					<Link
						to="/about"
						className="w-full sm:w-auto px-8 py-3 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900/30 transition duration-200 text-sm select-none text-center"
					>
						Learn More
					</Link>
				</div>
			</div>

			{/* Footer Block */}
			<footer className="w-full border-t border-slate-900/60 py-8 px-8 sm:px-12 z-10">
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

export default GetStarted;
