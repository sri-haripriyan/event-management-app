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
		<div className="relative w-full flex-1 bg-surface flex flex-col justify-between overflow-hidden text-on-surface font-poppins">
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
		</div>
	);
};

export default Events;
