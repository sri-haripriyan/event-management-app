import { useRef, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent, updateEvent } from "../../services/api";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";
import EventFormTimeline, { FORM_STEPS } from "./EventFormTimeline";
import EventDetailsStep from "./EventDetailsStep";
import SubEventsStep from "./SubEventsStep";
import InclusionsStep from "./InclusionsStep";

const parseDateSafe = (val) => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) return val;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const parseTimeStringSafe = (timeStr) => {
  if (!timeStr) return null;
  if (timeStr instanceof Date && !isNaN(timeStr)) return timeStr;

  const cleanStr = String(timeStr).trim();
  const match = cleanStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[4]?.toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }
  return null;
};

const EventForm = ({ mode = "create", eventId = null, initialData = null }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const imageRef = useRef();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    eventName: initialData?.title || "",
    description: initialData?.description || "",
    existingImageUrl: initialData?.imageUrl || "",
    eventDate: parseDateSafe(initialData?.eventDate),
    startTime: parseTimeStringSafe(initialData?.startTime),
    endTime: parseTimeStringSafe(initialData?.endTime),
    technical: initialData?.technical || [],
    nonTechnical: initialData?.nonTechnical || [],
    swags: initialData?.swags || false,
    refreshments: initialData?.refreshments || false,
    paid: initialData?.paid || false,
    amount: initialData?.amount || 0,
    technicalInput: "",
    nonTechnicalInput: "",
    technicalLimitInput: "",
    nonTechnicalLimitInput: "",
    user: user?._id,
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        eventName: initialData.title || prev.eventName,
        description: initialData.description || prev.description,
        existingImageUrl: initialData.imageUrl || prev.existingImageUrl,
        eventDate: parseDateSafe(initialData.eventDate) || prev.eventDate,
        startTime: parseTimeStringSafe(initialData.startTime) || prev.startTime,
        endTime: parseTimeStringSafe(initialData.endTime) || prev.endTime,
        technical: initialData.technical || prev.technical,
        nonTechnical: initialData.nonTechnical || prev.nonTechnical,
        swags: initialData.swags ?? prev.swags,
        refreshments: initialData.refreshments ?? prev.refreshments,
        paid: initialData.paid ?? prev.paid,
        amount: initialData.amount ?? prev.amount,
      }));
    }
  }, [initialData]);

  const handleChange = (name, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleChangefoods = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value === "on" ? !prev[name] : Boolean(value),
    }));
  };

  const updateInput = (field, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const addEvent = (field, eventName, limit) => {
    if (eventName && eventName.trim()) {
      setFormData((prevState) => {
        if (prevState[field].length < 5) {
          return {
            ...prevState,
            [field]: [...prevState[field], { name: eventName.trim(), limit: limit || 0 }],
            [`${field}Input`]: "",
            [`${field}LimitInput`]: "",
          };
        } else {
          toast.warn("You can only add a maximum of 5 sub-events per category.");
          return prevState;
        }
      });
    }
  };

  const deleteEvent = (field, index) => {
    setFormData((prevState) => {
      const updatedEvents = prevState[field].filter((_, idx) => idx !== index);
      return { ...prevState, [field]: updatedEvents };
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.eventName || !formData.description) {
        toast.info("Please fill event name and description", { autoClose: 1500 });
        return;
      }
      if (mode === "create" && !file && !formData.existingImageUrl) {
        toast.info("Please upload an event poster image", { autoClose: 1500 });
        return;
      }
      if (!formData.eventDate || !formData.startTime || !formData.endTime) {
        toast.info("Please select event date, start time, and end time", { autoClose: 1500 });
        return;
      }
    }

    if (step === 2) {
      if (formData.technical.length === 0 && formData.nonTechnical.length === 0) {
        toast.info("There should be at least 1 sub-event track!", { autoClose: 2000 });
        return;
      }
      if (formData.paid && (!formData.amount || Number(formData.amount) <= 0)) {
        toast.info("Please enter a valid registration amount for paid sub-events", { autoClose: 2000 });
        return;
      }
    }

    if (step < FORM_STEPS.length) {
      setStep((prev) => prev + 1);
    }
  };

  const { mutate: performSave, isPending } = useMutation({
    mutationFn: (data) => {
      if (mode === "edit" && eventId) {
        return updateEvent(data, eventId);
      }
      return createEvent(data);
    },
    onSuccess: (data) => {
      toast.success(data?.message || (mode === "edit" ? "Event updated successfully!" : "Event published successfully!"));
      queryClient.invalidateQueries({ queryKey: ["getevents"] });
      queryClient.invalidateQueries({ queryKey: ["getevents", eventId] });
      queryClient.invalidateQueries({ queryKey: ["getGroupByEventId", eventId] });
      navigate(mode === "edit" && eventId ? `/events/${eventId}` : "/events");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to save event details");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === "create" && !file && !formData.existingImageUrl) {
      toast.info("Please upload the event poster!", { autoClose: 1500 });
      return;
    }
    if (!formData.startTime || !formData.endTime || !formData.eventDate || !formData.eventName || !formData.description) {
      toast.info("Please fill all the core event details", { autoClose: 1500 });
      return;
    }
    if (formData.technical.length === 0 && formData.nonTechnical.length === 0) {
      toast.info("There should be at least 1 sub-event track!", { autoClose: 2000 });
      return;
    }
    if (formData.paid && (!formData.amount || Number(formData.amount) <= 0)) {
      toast.info("Please enter a valid registration amount for paid sub-events", { autoClose: 2000 });
      return;
    }

    const data = new FormData();
    const startTimeStr = formData.startTime instanceof Date 
      ? formData.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) 
      : String(formData.startTime);
    const endTimeStr = formData.endTime instanceof Date 
      ? formData.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) 
      : String(formData.endTime);
    const dateStr = formData.eventDate instanceof Date 
      ? formData.eventDate.toISOString().split("T")[0] 
      : String(formData.eventDate);

    data.append("title", formData.eventName);
    data.append("description", formData.description);
    data.append("startTime", startTimeStr);
    data.append("endTime", endTimeStr);
    data.append("eventDate", dateStr);
    data.append("paid", formData.paid);
    data.append("amount", formData.paid ? formData.amount : 0);
    data.append("swags", formData.swags);
    data.append("refreshments", formData.refreshments);
    data.append("technicalEvents", JSON.stringify(formData.technical));
    data.append("nonTechnicalEvents", JSON.stringify(formData.nonTechnical));

    if (formData.user) {
      data.append("user", formData.user);
    }
    if (file) {
      data.append("file", file);
    }

    performSave(data);
  };

  return (
    <div className="min-h-screen bg-surface flex justify-center items-center py-10 pt-24 px-4 font-poppins text-on-surface">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary-container/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 sm:p-10 rounded-3xl shadow-sm flex flex-col gap-8 z-10">
        {/* Back Navigation Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 text-on-surface rounded-xl transition text-sm font-medium self-start active:scale-95"
        >
          <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span> Back
        </button>

        {/* Step Progress Timeline */}
        <EventFormTimeline step={step} />

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col relative min-h-[420px] justify-between">
          {step === 1 && (
            <EventDetailsStep
              formData={formData}
              handleChange={handleChange}
              handleFileChange={handleFileChange}
              imageRef={imageRef}
              nextStep={nextStep}
              mode={mode}
            />
          )}

          {step === 2 && (
            <SubEventsStep
              formData={formData}
              setFormData={setFormData}
              updateInput={updateInput}
              addEvent={addEvent}
              deleteEvent={deleteEvent}
              prevStep={prevStep}
              nextStep={nextStep}
            />
          )}

          {step === 3 && (
            <InclusionsStep
              formData={formData}
              handleChangefoods={handleChangefoods}
              prevStep={prevStep}
              isPending={isPending}
              mode={mode}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default EventForm;
