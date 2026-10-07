import { useRef, useState } from "react";
import { FaUsers, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import { MdEmojiEvents } from "react-icons/md";
import { IoFastFoodSharp } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { createEvent } from "../services/api";
import Spinner from "../components/Spinner.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const steps = [
	{ label: "Group Details", icon: FaUsers },
	{ label: "Sub Events", icon: MdEmojiEvents },
	{ label: "foods", icon: IoFastFoodSharp },
];

const CreateEvents = () => {
	const { user } = useAuth();
	const [step, setStep] = useState(1);
	const [file, setFile] = useState("");
	const imageRef = useRef();
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		eventName: "",
		description: "",
		imageUrl: "",
		eventDate: "",
		startTime: "",
		endTime: "",
		technical: [],
		nonTechnical: [],
		swags: false,
		refreshments: false,
		paid: false,
		amount: 0,
		technicalInput: "",
		nonTechnicalInput: "",
		technicalLimitInput: "",
		nonTechnicalLimitInput: "",
		user: user._id,
	});

	const handleChange = (name, value) => {
		setFormData((prevState) => ({
			...prevState,
			[name]: value,
		}));
	};
	const handleChangefoods = (name, value) => {
		setFormData((prev) => ({
			...prev,
			[name]: value === "on" ? !prev[name] : value,
		}));
	};

	const handleSubmit = (e) => {
		
		e.preventDefault();
		if (!file) {
			toast.info("Please upload the event poster!", { autoClose: 1500 });
			return;
		}
		if (
			!formData.startTime ||
			!formData.endTime ||
			!formData.startTime ||
			!formData.eventName ||
			!formData.description
		) {
			toast.info("Please fill all the details", { autoClose: 1500 });
			return;
		}
		if (formData.technical.length === 0 && formData.nonTechnical.length === 0) {
			toast.info("There should be atleast 1 Sub-Event!", {
				autoClose: 2000,
			});
			return;
		}
		if (!formData.paid) formData.amount = 0;
		const data = new FormData();
		const startTime = formData.startTime.toLocaleString().split(",")[1];
		const endTime = formData.endTime.toLocaleString().split(",")[1];
		const dateValue = formData.eventDate.toLocaleString().split(",")[0];

		data.append("startTime", startTime);
		data.append("endTime", endTime);
		data.append("eventDate", dateValue);
		data.append("title", formData.eventName);
		data.append("description", formData.description);
		data.append("file", file);
		data.append("user", formData.user);
		data.append("paid", formData.paid);
		data.append("refreshments", formData.refreshments);
		data.append("amount", formData.amount);
		data.append("swags", formData.swags);
		data.append("technicalEvents", JSON.stringify(formData.technical));
		data.append("nonTechnicalEvents", JSON.stringify(formData.nonTechnical));
		for (var pair of data.entries()) {
			
		}
		mutate(data);
	};
	const { mutate, isPending } = useMutation({
		mutationFn: (formData) => createEvent(formData),
		onSuccess: (data) => {
		
			toast.success(data?.message);
			navigate("/events");
		},
		onError: (error) => toast.error(error.message),
	});
	const updateInput = (field, value) => {
		setFormData((prevState) => ({
			...prevState,
			[field]: value,
		}));
	};

	// Add event to the respective field (technical or nonTechnical)
	const addEvent = (field, event, limit) => {
		if (event && event.trim()) {
			setFormData((prevState) => {
				if (prevState[field].length < 5) {
					return {
						...prevState,
						[field]: [...prevState[field], { name: event, limit: limit || 0 }],
						[`${field}Input`]: "",
						[`${field}LimitInput`]: "", // Clear the input after adding
					};
				} else {
					alert("You can only add a maximum of 5 events.");
					return prevState; // Prevent adding more than 5 events
				}
			});
		}
	};
	const handleFileChange = (e) => {
		setFile(e.target.files[0]);
	};

	// Delete an event from the respective field
	const deleteEvent = (field, index) => {
		setFormData((prevState) => {
			const updatedEvents = prevState[field].filter((_, idx) => idx !== index);
			return { ...prevState, [field]: updatedEvents };
		});
	};
	const prevStep = () => {
		if (step > 1) setStep((prev) => prev - 1);
	};
	const nextStep = () => {
		if (step < steps.length) setStep((prev) => prev + 1);
		
		
	};
  const BackButton = () => {
    return (
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 text-on-surface rounded-xl transition text-sm font-medium self-start"
      >
        <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span> Back
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-surface flex justify-center items-center py-10 px-4 font-poppins text-on-surface">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary-container/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 sm:p-10 rounded-3xl shadow-sm flex flex-col gap-8 z-10">
        <BackButton />

        {/* Step Progress Timeline */}
        <div className="flex items-center justify-between gap-4 w-full">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon;
            const isCompleted = step > index + 1;
            const isActive = step === index + 1;
            return (
              <div key={index} className="relative flex flex-col items-center flex-1">
                {index > 0 && (
                  <div
                    className={`absolute top-5 -left-1/2 h-[2px] transition-all duration-500 -translate-y-1/2 ${
                      step > index ? "bg-primary-container" : "bg-outline-variant/30"
                    }`}
                    style={{ width: "100%" }}
                  />
                )}
                <div
                  className={`z-10 w-10 h-10 flex items-center justify-center rounded-xl text-base transition-all duration-500 border ${
                    isCompleted || isActive
                      ? "bg-primary-container text-on-primary border-transparent shadow-sm"
                      : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant"
                  }`}
                >
                  {isCompleted ? <FaCheck size={14} /> : <Icon size={16} />}
                </div>
                <span className={`text-xs mt-2 font-medium tracking-wide transition-colors duration-300 hidden sm:block ${
                  isActive ? "text-primary-container font-semibold" : isCompleted ? "text-on-surface font-medium" : "text-on-surface-variant"
                }`}>
                  {stepItem.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col relative min-h-[420px] justify-between">
          
          {/* STEP 1: EVENT DETAILS */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-on-surface mb-1">Event Details</h2>
                <p className="text-on-surface-variant text-xs font-normal">Set up the core details of your event poster and schedule</p>
              </div>

              {/* Event Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Event Name</label>
                <input
                  type="text"
                  placeholder="Enter the main title"
                  value={formData?.eventName}
                  onChange={(e) => handleChange("eventName", e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-3 text-on-surface outline-none transition text-sm placeholder:text-outline focus:ring-1 focus:ring-primary-container/30"
                  required
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Description</label>
                <textarea
                  placeholder="Describe your event agenda, rules, and timings..."
                  value={formData?.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-3 text-on-surface outline-none transition text-sm placeholder:text-outline focus:ring-1 focus:ring-primary-container/30 h-24 resize-none"
                  required
                />
              </div>

              {/* Image poster upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Event Poster Image</label>
                <input
                  type="file"
                  name="imageUrl"
                  ref={imageRef}
                  onChange={handleFileChange}
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-2.5 text-on-surface-variant text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-container/10 file:text-primary-container hover:file:bg-primary-container/20 file:cursor-pointer cursor-pointer focus:ring-1 focus:ring-primary-container/30"
                  required
                />
              </div>

              {/* Datepicker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1 block">Event Date</label>
                <DatePicker
                  selected={formData?.eventDate}
                  placeholderText="Select date"
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-3 text-on-surface outline-none text-sm placeholder:text-outline focus:ring-1 focus:ring-primary-container/30 cursor-pointer"
                  onChange={(date) => handleChange("eventDate", date)}
                  required
                />
              </div>

              {/* Timings */}
              <div className="flex gap-4">
                <div className="w-1/2 space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1 block">Start Time</label>
                  <DatePicker
                    showTimeSelect
                    placeholderText="--:--"
                    showTimeSelectOnly
                    timeFormat="HH:mm"
                    dateFormat="HH:mm"
                    selected={formData?.startTime}
                    onChange={(time) => handleChange("startTime", time)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-3 text-on-surface outline-none text-sm placeholder:text-outline focus:ring-1 focus:ring-primary-container/30 cursor-pointer"
                    required
                  />
                </div>
                <div className="w-1/2 space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1 block">End Time</label>
                  <DatePicker
                    showTimeSelect
                    placeholderText="--:--"
                    showTimeSelectOnly
                    timeFormat="HH:mm"
                    dateFormat="HH:mm"
                    selected={formData?.endTime}
                    onChange={(time) => handleChange("endTime", time)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-3 text-on-surface outline-none text-sm placeholder:text-outline focus:ring-1 focus:ring-primary-container/30 cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Navigation controls */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 bg-primary-container hover:bg-surface-tint text-on-primary rounded-xl font-medium transition duration-200 text-sm flex items-center gap-1.5 active:scale-[0.98] shadow-sm"
                >
                  Continue <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SUB EVENTS */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-on-surface mb-1">Sub-Events Breakdown</h2>
                <p className="text-on-surface-variant text-xs font-normal">Add custom tracks (limit 5 per category) with attendance seating limits</p>
              </div>

              {/* Technical Events */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-primary-container pl-1 uppercase tracking-wider">Technical Sub-events</h3>
                <div className="flex gap-2.5 items-center">
                  <input
                    type="text"
                    placeholder="Event Name (e.g. Code Hack)"
                    value={formData?.technicalInput}
                    maxLength={20}
                    onChange={(e) => updateInput("technicalInput", e.target.value)}
                    className="flex-grow bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-2.5 text-on-surface outline-none text-sm placeholder:text-outline focus:ring-1 focus:ring-primary-container/30"
                  />
                  <input
                    type="number"
                    placeholder="Limit"
                    value={formData?.technicalLimitInput}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        technicalLimitInput: e.target.value === "" ? "" : parseInt(e.target.value),
                      })
                    }
                    min={1}
                    className="w-20 bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-2 py-2.5 text-center text-on-surface outline-none text-sm focus:ring-1 focus:ring-primary-container/30"
                  />
                  <button
                    type="button"
                    onClick={() => addEvent("technical", formData?.technicalInput, formData?.technicalLimitInput)}
                    className="h-10 w-10 flex items-center justify-center bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 text-primary-container rounded-xl text-lg font-bold transition duration-200"
                  >
                    +
                  </button>
                </div>

                {/* Sub-event Chips grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1.5">
                  {formData?.technical.map((event, index) => (
                    <div key={index} className="flex justify-between items-center bg-surface-container-low border border-outline-variant/20 pl-3.5 pr-2 py-2 rounded-xl text-xs">
                      <div className="flex flex-col gap-0.5 text-on-surface font-medium">
                        <span>{event?.name}</span>
                        <span className="text-[10px] text-on-surface-variant font-semibold uppercase">Limit: {event?.limit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteEvent("technical", index)}
                        className="text-on-surface-variant hover:text-error p-1 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Non-Technical Events */}
              <div className="space-y-3 pt-3 border-t border-outline-variant/20">
                <h3 className="text-sm font-bold text-secondary-lumina pl-1 uppercase tracking-wider">Non-technical Sub-events</h3>
                <div className="flex gap-2.5 items-center">
                  <input
                    type="text"
                    placeholder="Event Name (e.g. Pitch Fest)"
                    value={formData?.nonTechnicalInput}
                    maxLength={20}
                    onChange={(e) => updateInput("nonTechnicalInput", e.target.value)}
                    className="flex-grow bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-2.5 text-on-surface outline-none text-sm placeholder:text-outline focus:ring-1 focus:ring-primary-container/30"
                  />
                  <input
                    type="number"
                    placeholder="Limit"
                    value={formData?.nonTechnicalLimitInput}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nonTechnicalLimitInput: e.target.value === "" ? "" : parseInt(e.target.value),
                      })
                    }
                    min={1}
                    className="w-20 bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-2 py-2.5 text-center text-on-surface outline-none text-sm focus:ring-1 focus:ring-primary-container/30"
                  />
                  <button
                    type="button"
                    onClick={() => addEvent("nonTechnical", formData?.nonTechnicalInput, formData?.nonTechnicalLimitInput)}
                    className="h-10 w-10 flex items-center justify-center bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 text-secondary-lumina rounded-xl text-lg font-bold transition duration-200"
                  >
                    +
                  </button>
                </div>

                {/* Sub-event Chips grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1.5">
                  {formData?.nonTechnical.map((event, index) => (
                    <div key={index} className="flex justify-between items-center bg-surface-container-low border border-outline-variant/20 pl-3.5 pr-2 py-2 rounded-xl text-xs">
                      <div className="flex flex-col gap-0.5 text-on-surface font-medium">
                        <span>{event?.name}</span>
                        <span className="text-[10px] text-on-surface-variant font-semibold uppercase">Limit: {event?.limit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteEvent("nonTechnical", index)}
                        className="text-on-surface-variant hover:text-error p-1 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation controls */}
              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 text-on-surface rounded-xl text-sm font-medium transition active:scale-[0.98]"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 bg-primary-container hover:bg-surface-tint text-on-primary rounded-xl font-medium transition duration-200 text-sm flex items-center gap-1.5 active:scale-[0.98] shadow-sm"
                >
                  Continue <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FOODS & PAYMENT */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-on-surface mb-1">Inclusions & Tickets</h2>
                <p className="text-on-surface-variant text-xs font-normal">Set up refreshments, swags, and ticket prices for registration</p>
              </div>

              {/* Inclusions */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">Event Inclusions</h3>
                
                <div className="flex flex-col gap-3">
                  {/* Refreshments */}
                  <label className="relative flex items-center justify-between cursor-pointer p-1">
                    <span className="text-sm font-medium text-on-surface">Provide Refreshments</span>
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      id="refreshment"
                      checked={formData?.refreshments}
                      onChange={(e) => handleChangefoods("refreshments", e.target.value)}
                    />
                    <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:bg-primary-container after:absolute after:top-1.5 after:right-5 peer-checked:after:translate-x-4 after:bg-white after:border-0 after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>

                  {/* Swags */}
                  <label className="relative flex items-center justify-between cursor-pointer p-1">
                    <span className="text-sm font-medium text-on-surface">Provide Swags / Merch</span>
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      id="Swags"
                      checked={formData?.swags}
                      onChange={(e) => handleChangefoods("swags", e.target.value)}
                    />
                    <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:bg-primary-container after:absolute after:top-1.5 after:right-5 peer-checked:after:translate-x-4 after:bg-white after:border-0 after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
              </div>

              {/* Payments */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-4 shadow-sm">
                <label className="relative flex items-center justify-between cursor-pointer p-1">
                  <span className="text-sm font-bold text-on-surface uppercase tracking-wider text-xs">Paid Ticket Required</span>
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    id="paid"
                    checked={formData?.paid}
                    onChange={(e) => handleChangefoods("paid", e.target.value)}
                  />
                  <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:bg-primary-container after:absolute after:top-1.5 after:right-5 peer-checked:after:translate-x-4 after:bg-white after:border-0 after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>

                {formData?.paid && (
                  <div className="flex justify-between items-center gap-4 pt-3 border-t border-outline-variant/20 animate-fade-in">
                    <label htmlFor="amount" className="text-sm text-on-surface-variant font-medium">
                      Ticket Price (INR)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      value={formData?.amount}
                      min={1}
                      max={5000}
                      onChange={(e) => handleChangefoods("amount", e.target.value)}
                      className="w-1/2 bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-2 text-on-surface text-right outline-none text-sm focus:ring-1 focus:ring-primary-container/30"
                      placeholder="Amount"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Navigation controls */}
              <div className="pt-4 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 text-on-surface rounded-xl text-sm font-medium transition active:scale-[0.98]"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-container hover:bg-surface-tint text-on-primary rounded-xl font-semibold transition text-sm shadow-md shadow-primary-container/20 active:scale-[0.98] min-w-[120px] flex items-center justify-center"
                  disabled={isPending}
                >
                  {isPending ? <Spinner size="sm" /> : "Publish Event 🚀"}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default CreateEvents;
