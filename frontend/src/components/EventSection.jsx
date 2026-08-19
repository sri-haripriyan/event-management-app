import React from "react";
import { Link, useNavigate } from "react-router-dom";
import EventOptions from "./EventOptions.jsx";
import { FiArrowLeft, FiCalendar, FiClock, FiCoffee, FiGift, FiAward, FiMessageSquare, FiHeart } from "react-icons/fi";
import { formatTimestamp } from "../utils/time.js";
import RequestButton from "./RequestButton.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import Avatar from "./Avatar.jsx";

const EventSection = ({ event }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="w-full text-white font-poppins pb-10">
      {/* Top Header Navigation */}
      <div className="max-w-7xl mx-auto px-6 pt-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          aria-label="Go back"
        >
          <FiArrowLeft className="text-slate-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" size={18} />
        </button>
        <EventOptions event={event} />
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Event details (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              {event?.title}
            </h1>
            
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm">
              <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
                <FiCalendar className="text-purple-400" />
                <span>{event?.eventDate}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
                <FiClock className="text-purple-400" />
                <span>{event?.startTime} - {event?.endTime}</span>
              </div>
            </div>
          </div>

          {/* Event Image */}
          <div className="relative w-full rounded-3xl overflow-hidden aspect-video border border-white/5 shadow-2xl">
            <img
              src={event?.imageUrl}
              alt={event?.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* About/Description Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              About the Event
            </h2>
            <p className="text-slate-300 text-base leading-relaxed whitespace-pre-line font-light">
              {event?.description}
            </p>
          </div>

          {/* Sub-Events section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              Sub-Events Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Events */}
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-base font-bold text-purple-400 flex items-center gap-2">
                  <FiAward /> Technical Tracks
                </h3>
                {event?.technical && event.technical.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {event.technical.map((tech, index) => (
                      <div key={index} className="flex justify-between items-center bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5">
                        <span className="text-slate-200 font-medium text-sm">{tech?.name || tech}</span>
                        {tech?.limit && (
                          <span className="bg-purple-500/10 text-purple-400 text-xs px-2.5 py-0.5 rounded-full border border-purple-500/20 font-semibold">
                            Limit: {tech.limit}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No technical tracks scheduled.</p>
                )}
              </div>

              {/* Non-Technical Events */}
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-base font-bold text-indigo-400 flex items-center gap-2">
                  <FiAward /> Non-Technical Tracks
                </h3>
                {event?.nonTechnical && event.nonTechnical.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {event.nonTechnical.map((nonTech, index) => (
                      <div key={index} className="flex justify-between items-center bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5">
                        <span className="text-slate-200 font-medium text-sm">{nonTech?.name || nonTech}</span>
                        {nonTech?.limit && (
                          <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-semibold">
                            Limit: {nonTech.limit}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No non-technical tracks scheduled.</p>
                )}
              </div>
            </div>
          </div>

          {/* Organizer Info */}
          <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                size="md"
                name={event?.userId?.userName}
                imageUrl={event?.userId?.profile_image_url}
                className="ring-2 ring-purple-500/20"
              />
              <div>
                <span className="text-xs uppercase text-slate-500 tracking-wider font-semibold">Organized by</span>
                <h3 className="text-lg font-bold text-white">{event?.userId?.userName}</h3>
                <p className="text-slate-400 text-sm font-light">{event?.userId?.email}</p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-xs uppercase text-slate-500 tracking-wider font-semibold">Created on</span>
              <p className="text-slate-300 text-sm">{formatTimestamp(event?.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Card (1/3 width, Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            
            {/* Header Pricing / Type */}
            <div className="pb-4 border-b border-slate-800">
              <span className="text-xs uppercase text-slate-500 tracking-wider font-semibold block mb-1">Registration Ticket</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {event?.paid ? `₹${event?.amount}` : "Free Entry"}
                </span>
                {event?.paid && (
                  <span className="text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-medium">Paid</span>
                )}
              </div>
            </div>

            {/* Inclusions */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase text-slate-500 tracking-wider font-bold">Event Inclusions</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                  event?.swags 
                    ? "bg-purple-500/5 border-purple-500/20 text-purple-300" 
                    : "bg-slate-950/40 border-slate-800/40 text-slate-500"
                }`}>
                  <FiGift size={16} />
                  <span>Swags {event?.swags ? "Included" : "None"}</span>
                </div>

                <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
                  event?.refreshments 
                    ? "bg-purple-500/5 border-purple-500/20 text-purple-300" 
                    : "bg-slate-950/40 border-slate-800/40 text-slate-500"
                }`}>
                  <FiCoffee size={16} />
                  <span>Refreshments {event?.refreshments ? "Included" : "None"}</span>
                </div>
              </div>
            </div>

            {/* Attendance & Organizer Quick link */}
            {user?._id === event?.userId?._id && (
              <div className="pt-2">
                <a
                  href={`${import.meta.env.VITE_ATTENDANCE_URL}/events/${event?._id}/attendance/${event?.title}`}
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition duration-200 shadow-md shadow-indigo-900/30"
                >
                  Proceed to Attendance
                </a>
              </div>
            )}

            {/* Application Button */}
            {user && event?.userId?._id !== user?._id && (
              <div className="pt-2">
                {event?.paid ? (
                  <Link
                    className="block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl transition duration-200 shadow-lg shadow-purple-950/30 hover:scale-[1.01]"
                    to={`/payments/${event?._id}`}
                  >
                    Apply Now
                  </Link>
                ) : (
                  <div className="w-full">
                    <RequestButton />
                  </div>
                )}
              </div>
            )}

            {/* Like and comment section inside the card */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <FiMessageSquare size={16} className="text-purple-400" />
                <span>{event?.comments || 0} Comments</span>
              </span>
              <span className="flex items-center gap-1.5">
                <FiHeart size={16} className="text-red-500 animate-pulse" />
                <span>{event?.likes?.length || 0} Likes</span>
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default EventSection;
