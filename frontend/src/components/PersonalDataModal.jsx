import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { updateProfile } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Spinner from "./Spinner";
import { INDIA_STATES_DISTRICTS } from "../utils/indiaStatesDistricts";

const HEARD_FROM_OPTIONS = [
  { id: "social_media", label: "Social Media", sub: "Instagram, LinkedIn, X, YouTube", icon: "share" },
  { id: "college", label: "College / Professor", sub: "Campus Ambassador, Faculty, Classmates", icon: "school" },
  { id: "friends", label: "Friend / Word of Mouth", sub: "Recommended by a friend or colleague", icon: "diversity_3" },
  { id: "search", label: "Search Engine", sub: "Google, Bing, or web search", icon: "search" },
  { id: "posters", label: "Poster or Flyer", sub: "Campus notice board, brochure, banner", icon: "newspaper" },
  { id: "other", label: "Other", sub: "Community meetups, hackathons, newsletter", icon: "campaign" },
];

const PersonalDataModal = ({
  isOpen = false,
  onClose = () => { },
  onSaved = () => { },
  initialData = {},
}) => {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  const [step, setStep] = useState(1);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  // States for the separate Skip Info Modal
  const [showSkipInfoModal, setShowSkipInfoModal] = useState(false);
  const [skipInfoVisible, setSkipInfoVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setShowSkipInfoModal(false);
      setSkipInfoVisible(false);
      setShouldRender(true);
      // Slight tick to ensure element is mounted before transitioning from opacity 0 to 1
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 25);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setSkipInfoVisible(false);
      // Wait for 500ms transition effect before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        setShowSkipInfoModal(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (showSkipInfoModal) {
      const timer = setTimeout(() => {
        setSkipInfoVisible(true);
      }, 25);
      return () => clearTimeout(timer);
    }
  }, [showSkipInfoModal]);

  // Form states
  const [roleType, setRoleType] = useState(initialData?.roleType || user?.roleType || "");
  const [college, setCollege] = useState(initialData?.college || user?.college || "");
  const [selectedState, setSelectedState] = useState(initialData?.state || user?.state || "");
  const [selectedDistrict, setSelectedDistrict] = useState(initialData?.district || user?.district || "");
  const [customDistrict, setCustomDistrict] = useState("");
  const [heardFrom, setHeardFrom] = useState(initialData?.heardFrom || user?.heardFrom || "");
  const [customHeardFrom, setCustomHeardFrom] = useState("");
  const [phone, setPhone] = useState(initialData?.phone || user?.phone || "");

  // Available states from dataset
  const statesList = useMemo(() => Object.keys(INDIA_STATES_DISTRICTS), []);

  // Available districts for chosen state
  const availableDistricts = useMemo(() => {
    if (!selectedState || !INDIA_STATES_DISTRICTS[selectedState]) return [];
    return INDIA_STATES_DISTRICTS[selectedState];
  }, [selectedState]);

  // Mutation to update profile in database
  const { mutate: saveProfileMutation, isPending: isSaving } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      const updatedUser = res?.user || {
        ...user,
        roleType,
        college,
        state: selectedState,
        district: customDistrict.trim() || selectedDistrict,
        heardFrom: heardFrom === "Other" && customHeardFrom.trim() ? customHeardFrom.trim() : heardFrom,
        phone,
      };

      setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
      queryClient.invalidateQueries({ queryKey: ["profile-panel"] });
      queryClient.invalidateQueries({ queryKey: ["profile-data"] });

      toast.success("Profile details saved successfully!");
      onSaved(updatedUser);
      onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to save profile details";
      toast.error(msg);
    },
  });

  // Handle Skip Action: hides questionnaire modal and opens the separate info modal with 500ms transition
  const handleSkip = () => {
    setIsVisible(false);
    setShouldRender(false);
    setShowSkipInfoModal(true);
  };

  const handleCloseSkipInfoModal = () => {
    setSkipInfoVisible(false);
    // Wait for 500ms transition effect before unmounting and closing
    setTimeout(() => {
      setShowSkipInfoModal(false);
      onClose();
    }, 500);
  };

  if (!shouldRender && !showSkipInfoModal) return null;

  const handleNext = () => {
    if (step === 1 && !roleType) {
      toast.warn("Please select whether you are a Student, Lecturer, or Professional");
      return;
    }
    if (step < 4) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSave = (e) => {
    e?.preventDefault();

    const finalDistrict = customDistrict.trim() || selectedDistrict;
    const finalHeard =
      heardFrom === "Other" && customHeardFrom.trim() ? `Other: ${customHeardFrom.trim()}` : heardFrom;

    saveProfileMutation({
      roleType,
      college: college.trim(),
      state: selectedState,
      district: finalDistrict,
      heardFrom: finalHeard,
      phone: phone.trim(),
    });
  };

  return (
    <>
      {shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md font-poppins selection:bg-primary-container selection:text-on-primary transition-opacity duration-500 ease-out ${isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full max-w-xl bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-500 ease-out transform ${isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3"
          }`}
      >
        {/* Top Header & Step Progress Bar */}
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant/20 bg-surface-container-low/40">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary-container bg-primary-container/15 px-2.5 py-1 rounded-md">
                Personalize Experience
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                Step {step} of 4
              </span>
            </div>

            {/* Skip Button (Top Right) */}
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface px-2.5 py-1 rounded-lg hover:bg-surface-container transition-colors flex items-center gap-1"
              title="Skip personal details"
            >
              <span>Skip</span>
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Progress bar visual indicator */}
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Modal Body / Step Questions */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* STEP 1: Are you a student? or lecturer? which college? */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-on-surface">
                  Are you a student or a lecturer?
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Help us connect you with relevant academic events, workshops, and college hackathons.
                </p>
              </div>

              {/* Role Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Student Option */}
                <button
                  type="button"
                  onClick={() => setRoleType("Student")}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${roleType === "Student"
                      ? "border-primary-container bg-primary-container/10 ring-2 ring-primary-container/30 shadow-sm"
                      : "border-outline-variant/30 bg-surface-container-low hover:bg-surface-container hover:border-outline-variant/60"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">school</span>
                    </div>
                    {roleType === "Student" && (
                      <span className="material-symbols-outlined text-primary-container text-xl">
                        check_circle
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-on-surface block">
                      Yes, I am a Student
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Undergraduate, graduate, or research scholar
                    </span>
                  </div>
                </button>

                {/* Lecturer Option */}
                <button
                  type="button"
                  onClick={() => setRoleType("Lecturer")}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-2 ${roleType === "Lecturer"
                      ? "border-primary-container bg-primary-container/10 ring-2 ring-primary-container/30 shadow-sm"
                      : "border-outline-variant/30 bg-surface-container-low hover:bg-surface-container hover:border-outline-variant/60"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">co_present</span>
                    </div>
                    {roleType === "Lecturer" && (
                      <span className="material-symbols-outlined text-primary-container text-xl">
                        check_circle
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-on-surface block">
                      Yes, I am a Lecturer
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Professor, faculty member, or educator
                    </span>
                  </div>
                </button>

                {/* Working Professional / Other */}
                <button
                  type="button"
                  onClick={() => setRoleType("Professional")}
                  className={`col-span-1 sm:col-span-2 p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${roleType === "Professional"
                      ? "border-primary-container bg-primary-container/10 ring-2 ring-primary-container/30 shadow-sm"
                      : "border-outline-variant/30 bg-surface-container-low hover:bg-surface-container hover:border-outline-variant/60"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">work</span>
                    </div>
                    <div>
                      <span className="font-bold text-xs text-on-surface block">
                        Working Professional / Other
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        Software engineer, designer, organizer, or tech enthusiast
                      </span>
                    </div>
                  </div>
                  {roleType === "Professional" && (
                    <span className="material-symbols-outlined text-primary-container text-xl">
                      check_circle
                    </span>
                  )}
                </button>
              </div>

              {/* College / Institution Name Input */}
              {(roleType === "Student" || roleType === "Lecturer" || roleType === "Professional") && (
                <div className="space-y-1.5 pt-2 animate-fade-in">
                  <label htmlFor="college-input" className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary-container">
                      domain
                    </span>
                    <span>
                      {roleType === "Student"
                        ? "Which college or university are you from?"
                        : roleType === "Lecturer"
                          ? "Which college or institution do you teach at?"
                          : "Organization / Company (Optional)"}
                    </span>
                  </label>
                  <input
                    id="college-input"
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder={
                      roleType === "Student"
                        ? "e.g., IIT Madras, Anna University, Stanford..."
                        : roleType === "Lecturer"
                          ? "e.g., Dept of Computer Science, MIT, Delhi University..."
                          : "e.g., Tech Startup, Freelancer..."
                    }
                    className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-2.5 text-xs text-on-surface outline-none transition placeholder:text-outline"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Where are you from? (State & District of all states) */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Where are you from?</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Select your state and district so we can highlight local events and regional schedules.
                </p>
              </div>

              {/* State Selection */}
              <div className="space-y-1.5">
                <label htmlFor="state-select" className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary-container">
                    map
                  </span>
                  <span>State / Union Territory</span>
                </label>
                <select
                  id="state-select"
                  value={selectedState}
                  onChange={(e) => {
                    const newState = e.target.value;
                    setSelectedState(newState);
                    setSelectedDistrict("");
                    setCustomDistrict("");
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-3 py-2.5 text-xs text-on-surface outline-none transition cursor-pointer"
                >
                  <option value="">Select your state...</option>
                  {statesList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Selection (Dependent on chosen state) */}
              {selectedState && (
                <div className="space-y-1.5 animate-fade-in">
                  <label htmlFor="district-select" className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary-container">
                      location_city
                    </span>
                    <span>District / City (in {selectedState})</span>
                  </label>
                  {availableDistricts.length > 0 && selectedState !== "Other / Outside India" ? (
                    <select
                      id="district-select"
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        setCustomDistrict("");
                      }}
                      className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-3 py-2.5 text-xs text-on-surface outline-none transition cursor-pointer"
                    >
                      <option value="">Select your district...</option>
                      {availableDistricts.map((dst) => (
                        <option key={dst} value={dst}>
                          {dst}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  {/* Custom district text input if user prefers or state has no match */}
                  <div className="pt-2">
                    <span className="text-[11px] text-on-surface-variant block mb-1">
                      {selectedDistrict ? "Or specify custom district / town:" : "Type your district or city:"}
                    </span>
                    <input
                      type="text"
                      placeholder="e.g., Central District, Downtown..."
                      value={customDistrict}
                      onChange={(e) => setCustomDistrict(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary-container rounded-xl px-4 py-2 text-xs text-on-surface outline-none transition placeholder:text-outline"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: How you heard about us (with options) */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-on-surface">How did you hear about us?</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Choose the primary channel through which you discovered ACN.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HEARD_FROM_OPTIONS.map((opt) => {
                  const isSelected = heardFrom === opt.label || heardFrom === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setHeardFrom(opt.label)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${isSelected
                          ? "border-primary-container bg-primary-container/10 ring-2 ring-primary-container/30 shadow-sm"
                          : "border-outline-variant/30 bg-surface-container-low hover:bg-surface-container hover:border-outline-variant/60"
                        }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-xs text-on-surface block truncate">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-on-surface-variant leading-tight block">
                          {opt.sub}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary-container text-base shrink-0">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {heardFrom === "Other" && (
                <div className="space-y-1 pt-2 animate-fade-in">
                  <label htmlFor="custom-heard-input" className="text-xs font-semibold text-on-surface">
                    Please tell us how you discovered ACN:
                  </label>
                  <input
                    id="custom-heard-input"
                    type="text"
                    value={customHeardFrom}
                    onChange={(e) => setCustomHeardFrom(e.target.value)}
                    placeholder="e.g., Tech conference, Discord community..."
                    className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-2.5 text-xs text-on-surface outline-none transition placeholder:text-outline"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Mobile Number */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-on-surface">What is your mobile number?</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  We will use this to send check-in SMS updates, QR pass alerts, and gate emergency announcements.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="mobile-input" className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary-container">
                    smartphone
                  </span>
                  <span>Mobile Phone Number</span>
                </label>

                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-bold text-on-surface select-none shrink-0 flex items-center gap-1">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    id="mobile-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^\d\s+-]/g, "");
                      setPhone(clean);
                    }}
                    maxLength={15}
                    placeholder="98765 43210"
                    className="flex-1 bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-2.5 text-xs font-medium text-on-surface outline-none transition placeholder:text-outline"
                  />
                </div>
                <span className="text-[11px] text-on-surface-variant block">
                  Your number stays private and is only used for event operations and ticket alerts.
                </span>
              </div>

              {/* Summary overview of entered data before saving */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/20 space-y-1.5 text-xs">
                <div className="font-bold text-on-surface text-[11px] uppercase tracking-wider text-primary-container">
                  Summary
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant">
                  <div>
                    <span className="font-semibold text-on-surface">Role: </span>
                    {roleType || "Not specified"}
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">College: </span>
                    {college || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">Location: </span>
                    {customDistrict || selectedDistrict || selectedState
                      ? `${customDistrict || selectedDistrict || ""}${selectedState ? `, ${selectedState}` : ""}`
                      : "Not specified"}
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">Discovery: </span>
                    {heardFrom || "Not specified"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between gap-3">
          {/* Universal Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-xl transition hover:bg-surface-container"
          >
            Skip for now
          </button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition border border-outline-variant/30"
              >
                Back
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:bg-surface-tint transition shadow-sm flex items-center gap-1.5"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:bg-surface-tint transition shadow-md shadow-primary-container/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Profile</span>
                    <span className="material-symbols-outlined text-base">check</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
      )}

      {/* Separate Info Modal for Skip confirmation with exact 500ms transition effects */}
      {showSkipInfoModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md font-poppins selection:bg-primary-container selection:text-on-primary transition-opacity duration-500 ease-out ${
            skipInfoVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          role="dialog"
          aria-modal="true"
          onClick={handleCloseSkipInfoModal}
        >
          <div
            className={`relative w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center text-center transition-all duration-500 ease-out transform ${
              skipInfoVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleCloseSkipInfoModal}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-xl hover:bg-surface-container transition-colors"
              title="Close modal"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Glowing Info Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-primary-container/15 text-primary-container flex items-center justify-center mb-4 ring-8 ring-primary-container/10">
              <span className="material-symbols-outlined text-3xl">info</span>
            </div>

            {/* Modal Heading */}
            <h3 className="text-xl font-bold text-on-surface mb-2">
              Personal Information
            </h3>

            {/* Main Info Message */}
            <p className="text-sm font-semibold text-on-surface max-w-xs mb-2 leading-relaxed">
              You can edit this information anytime in the profile
            </p>

            {/* Subtext info */}
            <p className="text-xs text-on-surface-variant max-w-xs mb-6 leading-relaxed">
              You can fill in or update your academic details, location, and phone number later in your profile settings whenever you are ready.
            </p>

            {/* Acknowledge & Close Button */}
            <button
              type="button"
              onClick={handleCloseSkipInfoModal}
              className="w-full py-2.5 px-5 rounded-xl bg-primary-container text-on-primary text-sm font-semibold hover:bg-surface-tint transition shadow-md shadow-primary-container/20 flex items-center justify-center gap-2"
            >
              <span>Got it, continue</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PersonalDataModal;

