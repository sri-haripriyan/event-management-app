import React from "react";
import Header from "../components/Header.jsx";
import ContactForm from "../components/ContactForm.jsx";
import { FaLinkedin } from "react-icons/fa";
import { MdOutlineSupportAgent } from "react-icons/md";
import { FiCheckCircle, FiShield, FiCpu, FiTrendingUp, FiLayout, FiEdit3, FiMail } from "react-icons/fi";

const About = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-poppins pb-20 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse-slow"></div>

      <Header />

      <div className="max-w-6xl mx-auto px-6 mt-12 space-y-16 z-10 relative">
        
        {/* About Us Hero */}
        <section className="text-center space-y-4 max-w-3xl mx-auto animate-fade-in">
          <div className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2">
            ACN.E Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            About Us
          </h1>
          <p className="text-slate-400 text-base md:text-lg font-light leading-relaxed">
            Welcome to <span className="font-bold text-purple-400">ACN.E</span> (by Alcognerd), your premium all-in-one event management platform designed to simplify planning, booking, and executing corporate and community events seamlessly.
          </p>
        </section>

        {/* Our Mission */}
        <section className="bg-slate-900/30 border border-white/5 p-8 md:p-12 rounded-3xl backdrop-blur-xl shadow-xl max-w-4xl mx-auto text-center space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">Our Mission</h2>
          <p className="text-slate-350 text-base font-light leading-relaxed">
            We aim to empower event organizers, corporations, and community leads by providing an intuitive, feature-rich platform that makes event setup, ticketing, and team coordination effortless.
          </p>
          <p className="text-slate-400 text-sm font-light">
            From seamless ticketing to real-time chat collaborations, we streamline event logistics so you can focus entirely on creating memorable experiences.
          </p>
        </section>

        {/* What We Offer Grid */}
        <section className="space-y-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">What We Offer</h2>
            <p className="text-slate-500 text-sm mt-1">Tools and features tailored for modern event execution</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            
            {/* Offer 1 */}
            <article className="glass-card p-6 rounded-2xl flex flex-col items-center text-center gap-4 transition duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <FiLayout size={24} />
              </div>
              <h3 className="font-bold text-white text-lg">Seamless Creation</h3>
              <p className="text-slate-400 text-sm font-light">
                Organize detailed public or private events with multi-step registration forms easily.
              </p>
            </article>

            {/* Offer 2 */}
            <article className="glass-card p-6 rounded-2xl flex flex-col items-center text-center gap-4 transition duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <FiShield size={24} />
              </div>
              <h3 className="font-bold text-white text-lg">Secure Payments</h3>
              <p className="text-slate-400 text-sm font-light">
                Fully integrated ticket billing portal for fast, secure card transactions.
              </p>
            </article>

            {/* Offer 3 */}
            <article className="glass-card p-6 rounded-2xl flex flex-col items-center text-center gap-4 transition duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <FiCpu size={24} />
              </div>
              <h3 className="font-bold text-white text-lg">Attendance Tracking</h3>
              <p className="text-slate-400 text-sm font-light">
                Instant database tracking and status checking for smooth door check-ins.
              </p>
            </article>

            {/* Offer 4 */}
            <article className="glass-card p-6 rounded-2xl flex flex-col items-center text-center gap-4 transition duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <FiTrendingUp size={24} />
              </div>
              <h3 className="font-bold text-white text-lg">Group Chat Channels</h3>
              <p className="text-slate-400 text-sm font-light">
                Connect hosts and attendees instantly via socket-powered real-time rooms.
              </p>
            </article>

            {/* Offer 5 */}
            <article className="glass-card p-6 rounded-2xl flex flex-col items-center text-center gap-4 transition duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <FiCheckCircle size={24} />
              </div>
              <h3 className="font-bold text-white text-lg">Rich Customizations</h3>
              <p className="text-slate-400 text-sm font-light">
                Showcase your event listings with customized details, swag tags, and comments.
              </p>
            </article>

            {/* Offer 6 */}
            <article className="glass-card p-6 rounded-2xl flex flex-col items-center text-center gap-4 transition duration-300 hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <FiEdit3 size={24} />
              </div>
              <h3 className="font-bold text-white text-lg">Edit Any Event</h3>
              <p className="text-slate-400 text-sm font-light">
                Retain full controls to update, reschedule, or cancel any published listings.
              </p>
            </article>

          </div>
        </section>

        {/* Action Banner */}
        <section className="text-center bg-gradient-to-r from-purple-900/25 to-indigo-900/25 border border-purple-500/10 p-8 rounded-3xl max-w-4xl mx-auto space-y-4">
          <p className="text-lg md:text-xl font-medium text-purple-200">
            Join thousands of hosts raising the bar for modern collaborations.
          </p>
        </section>

        {/* Contact Us */}
        <section className="space-y-8 pt-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">Contact Us</h2>
            <p className="text-slate-400 text-sm mt-1">We’d love to hear from you! Reach out for questions, feedback, or support</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center max-w-5xl mx-auto">
            {/* Social info */}
            <div className="w-full md:w-1/2 bg-slate-900/40 border border-white/5 p-8 rounded-3xl flex flex-col justify-between gap-6 backdrop-blur-md">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🌐 Social Connection
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light">
                  Follow our founder's LinkedIn channel for feature releases, platform updates, and development roadmaps.
                </p>
                <a
                  href="https://www.linkedin.com/in/alcognerd-world"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  <FaLinkedin className="text-purple-400 text-lg" />
                  <span>/alcognerd</span>
                </a>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MdOutlineSupportAgent className="text-purple-400 text-xl" />
                  <span>Support Center</span>
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light">
                  Need custom enterprise integrations, or ran into ticket payment issues? Shoot us an email, and we will get back to you within 24 hours.
                </p>
                <a
                  href="mailto:help.alcognerd@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  <FiMail className="text-purple-400 text-lg" />
                  <span>help.alcognerd@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Email form */}
            <div className="w-full md:w-1/2 flex items-center justify-center">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-slate-650 border-t border-slate-900 pt-8">
          <p>© {new Date().getFullYear()} Alcognerd. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
};

export default About;
