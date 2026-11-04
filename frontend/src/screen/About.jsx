import React from "react";
import ContactForm from "../components/ContactForm";
import {
  FiUsers,
  FiCalendar,
  FiMessageSquare,
  FiMail,
} from "react-icons/fi";

const About = () => {
  return (
    <div className="w-full flex-1 bg-surface font-poppins text-on-surface pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Hero / Mission Statement */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/15 text-primary-container text-xs font-semibold uppercase tracking-wider">
            About Our Platform
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface">
            Empowering Next-Gen Event Communities
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            We are dedicated to revolutionizing event discovery, real-time collaboration, and community networking. Our digital ecosystem seamlessly bridges the gap between organizers, moderators, and attendees.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center text-xl">
              <FiCalendar />
            </div>
            <h3 className="font-bold text-base text-on-surface">Curated Events</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Explore dynamic multi-track events, sub-events, and secure instant registrations with digital passports.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center text-xl">
              <FiMessageSquare />
            </div>
            <h3 className="font-bold text-base text-on-surface">Real-Time Chat</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Connect instantly with fellow participants, subevent channels, and dedicated event moderators.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center text-xl">
              <FiUsers />
            </div>
            <h3 className="font-bold text-base text-on-surface">Community First</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Designed to foster genuine interactions, collaborative learning, and professional opportunities.
            </p>
          </div>
        </div>

        {/* Reach out / Contact section */}
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Context details */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/20 text-secondary text-xs font-semibold">
                Get in Touch
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                Have questions or feedback?
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Whether you need technical support, want to partner with us, or have recommendations to improve the platform, our team is eager to connect with you.
              </p>

              <div className="pt-2">
                <p className="text-xs font-medium text-on-surface-variant mb-1">
                  Direct Support Email:
                </p>
                <a
                  href="mailto:help.alcognerd@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 text-on-surface rounded-xl text-sm font-semibold transition"
                >
                  <FiMail className="text-primary-container text-lg" />
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
      </div>
    </div>
  );
};

export default About;
