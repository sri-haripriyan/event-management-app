import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import EventList from "../components/EventList";
import ScrollToTop from "../components/ScrollToTop";
import PersonalDataModal from "../components/PersonalDataModal";
import { useAuth } from "../hooks/useAuth";

const Events = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [personalModalOpen, setPersonalModalOpen] = useState(false);

  useEffect(() => {
    // Check if user just signed up or logged in needing onboarding
    const isNewSignup =
      sessionStorage.getItem("askPersonalData") === "true" ||
      location.state?.newlyRegistered === true;

    const isDismissed = sessionStorage.getItem("personalDataModalDismissed") === "true";

    const hasMissingData =
      user && !user.roleType && !user.district && !user.state && !user.phone;

    // Open with a delay of 2 seconds after the events page loaded
    if (user && (isNewSignup || (location.state?.fromLogin && hasMissingData)) && !isDismissed) {
      const timer = setTimeout(() => {
        setPersonalModalOpen(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, location.state]);

  const handleCloseModal = () => {
    setPersonalModalOpen(false);
    sessionStorage.removeItem("askPersonalData");
    sessionStorage.setItem("personalDataModalDismissed", "true");
  };

	return (
		<div className="relative w-full min-h-screen bg-surface flex flex-col justify-between overflow-hidden text-on-surface font-poppins">
			<div>
				<section className="pt-16">
					<EventList />
					<ScrollToTop />
				</section>
			</div>

      {/* Onboarding Personal Data Modal (Delayed by 2s with 500ms transition) */}
      <PersonalDataModal
        isOpen={personalModalOpen}
        initialData={user}
        onClose={handleCloseModal}
        onSaved={handleCloseModal}
      />

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
