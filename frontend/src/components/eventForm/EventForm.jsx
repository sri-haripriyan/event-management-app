import { useRef, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent, updateEvent } from "../../services/api";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";
import EventFormTimeline, { FORM_STEPS } from "./EventFormTimeline";
import EventDetailsStep from "./EventDetailsStep";
import SubEventsStep from "./SubEventsStep";
import InclusionsStep from "./InclusionsStep";
import {
  validateStep1,
  validateStep2,
  validateFullForm,
  validateSingleField,
  validateImageFileFrontend,
  formatDateToYYYYMMDD,
  formatTimeToHHmm,
  getTodayLocalYYYYMMDD,
  getCurrentLocalMinutes,
  parseTimeToMinutes,
} from "../../utils/eventValidation";

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

const focusField = (field) => {
  const fieldMap = {
    eventName: "event-title-input",
    title: "event-title-input",
    description: "event-desc-input",
    imageUrl: "event-poster-input",
    file: "event-poster-input",
    eventDate: "event-date-input",
    startTime: "event-start-time-input",
    endTime: "event-end-time-input",
    amount: "event-amount-input",
    subEvents: "event-technical-input",
  };
  const id = fieldMap[field];
  if (id) {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  }
};

const EventForm = ({ mode = "create", eventId = null, initialData = null }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const isSubmittedRef = useRef(false);
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
  });

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => {
        const next = {
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
        };
        formDataRef.current = next;
        return next;
      });
    }
  }, [initialData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !isSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (name, value) => {
    setIsDirty(true);

    const nextFormData = {
      ...formDataRef.current,
      [name]: value,
    };
    formDataRef.current = nextFormData;
    setFormData(nextFormData);

    // If the field is marked as touched or currently has an error,
    // re-validate it immediately on change so the error persists until validation succeeds!
    if (touched[name] || errors[name]) {
      const err = validateSingleField(name, value, nextFormData, file, mode);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) {
          next[name] = err;
        } else {
          delete next[name];
        }
        return next;
      });
    }

    // Cross-field re-validation for time and date
    if (name === "startTime") {
      if (nextFormData.endTime && (touched.endTime || errors.endTime)) {
        const endErr = validateSingleField("endTime", nextFormData.endTime, nextFormData, file, mode);
        setErrors((prev) => {
          const next = { ...prev };
          if (endErr) next.endTime = endErr;
          else delete next.endTime;
          return next;
        });
      }
    }

    if (name === "endTime") {
      if (nextFormData.startTime && (touched.startTime || errors.startTime)) {
        const startErr = validateSingleField("startTime", nextFormData.startTime, nextFormData, file, mode);
        setErrors((prev) => {
          const next = { ...prev };
          if (startErr) next.startTime = startErr;
          else delete next.startTime;
          return next;
        });
      }
    }

    if (name === "eventDate") {
      const oldDateStr = formatDateToYYYYMMDD(formData.eventDate);
      const newDateStr = formatDateToYYYYMMDD(value);
      const todayStr = getTodayLocalYYYYMMDD();

      if (oldDateStr === todayStr && newDateStr > todayStr) {
        setErrors((prev) => {
          const next = { ...prev };
          if (next.startTime && next.startTime.includes("today's event")) {
            delete next.startTime;
          }
          return next;
        });
      } else if (newDateStr === todayStr && nextFormData.startTime) {
        const startErr = validateSingleField("startTime", nextFormData.startTime, nextFormData, file, mode);
        setErrors((prev) => {
          const next = { ...prev };
          if (startErr) {
            next.startTime = startErr;
          } else if (next.startTime && next.startTime.includes("today's event")) {
            delete next.startTime;
          }
          return next;
        });
      }
    }

    if (name === "paid" && !value) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.amount;
        return next;
      });
    }
  };

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const currentData = formDataRef.current;
    const val = currentData[fieldName];
    const err = validateSingleField(fieldName, val, currentData, file, mode);

    setErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[fieldName] = err;
      } else {
        delete next[fieldName];
      }
      return next;
    });

    if (fieldName === "startTime" && currentData.endTime && (touched.endTime || errors.endTime)) {
      const endErr = validateSingleField("endTime", currentData.endTime, currentData, file, mode);
      setErrors((prev) => {
        const next = { ...prev };
        if (endErr) next.endTime = endErr;
        else delete next.endTime;
        return next;
      });
    }
  };

  const handleChangefoods = (name, value) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      [name]: typeof value === "boolean" ? value : Boolean(value),
    }));
  };

  const updateInput = (field, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const addEvent = (field, eventName, limit) => {
    const trimmed = (eventName || "").trim();
    if (!trimmed) {
      toast.error("Please enter a sub-event name");
      return;
    }

    if (trimmed.length > 50) {
      toast.error("Sub-event name cannot exceed 50 characters");
      return;
    }

    if (formData[field].length >= 20) {
      toast.error("You can only add a maximum of 20 sub-events per category");
      return;
    }

    // Case-insensitive duplicate check
    const lowerTrimmed = trimmed.toLowerCase();
    const isDuplicate = formData[field].some((t) => (t?.name || "").trim().toLowerCase() === lowerTrimmed);
    if (isDuplicate) {
      toast.error(`A sub-event named "${trimmed}" already exists in this track`);
      return;
    }

    setIsDirty(true);
    const parsedLimit = parseInt(limit, 10);
    const finalLimit = isNaN(parsedLimit) || parsedLimit <= 0 ? 15 : parsedLimit;

    setFormData((prevState) => {
      const nextData = {
        ...prevState,
        [field]: [...prevState[field], { name: trimmed, limit: finalLimit }],
        [`${field}Input`]: "",
        [`${field}LimitInput`]: "",
      };
      formDataRef.current = nextData;
      return nextData;
    });

    // Clear global subEvents error if tracks now exist
    setErrors((prev) => {
      const next = { ...prev };
      delete next.subEvents;
      delete next[field];
      return next;
    });
  };

  const deleteEvent = (field, index) => {
    setIsDirty(true);
    setFormData((prevState) => {
      const updatedEvents = prevState[field].filter((_, idx) => idx !== index);
      const nextData = { ...prevState, [field]: updatedEvents };
      formDataRef.current = nextData;
      const totalTracks = (nextData.technical?.length || 0) + (nextData.nonTechnical?.length || 0);
      if (totalTracks === 0 && (touched.subEvents || errors.subEvents)) {
        setErrors((prev) => ({
          ...prev,
          subEvents: "At least one sub-event track (technical or non-technical) is required",
        }));
      }
      return nextData;
    });
  };

  const handleFileChange = (e) => {
    setIsDirty(true);
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setTouched((prev) => ({ ...prev, imageUrl: true, file: true }));

    const err = validateImageFileFrontend(selectedFile, formDataRef.current.existingImageUrl, mode);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next.imageUrl = err;
      } else {
        delete next.imageUrl;
        delete next.file;
      }
      return next;
    });
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const nextStep = () => {
    if (step === 1) {
      setTouched((prev) => ({
        ...prev,
        eventName: true,
        title: true,
        description: true,
        imageUrl: true,
        file: true,
        eventDate: true,
        startTime: true,
        endTime: true,
      }));
      const step1Result = validateStep1(formDataRef.current, file, mode);
      if (!step1Result.isValid) {
        setErrors(step1Result.errors);
        const firstField = Object.keys(step1Result.errors)[0];
        focusField(firstField);
        toast.error(step1Result.errors[firstField] || "Please resolve errors before continuing");
        return;
      }
      setErrors((prev) => {
        const next = { ...prev };
        delete next.eventName;
        delete next.title;
        delete next.description;
        delete next.imageUrl;
        delete next.file;
        delete next.eventDate;
        delete next.startTime;
        delete next.endTime;
        return next;
      });
      setStep(2);
      return;
    }

    if (step === 2) {
      setTouched((prev) => ({
        ...prev,
        subEvents: true,
        amount: true,
      }));
      const step2Result = validateStep2(formDataRef.current);
      if (!step2Result.isValid) {
        setErrors(step2Result.errors);
        const firstField = Object.keys(step2Result.errors)[0];
        focusField(firstField);
        toast.error(step2Result.errors[firstField] || "Please resolve sub-event track errors");
        return;
      }
      setErrors((prev) => {
        const next = { ...prev };
        delete next.subEvents;
        delete next.technical;
        delete next.nonTechnical;
        delete next.amount;
        return next;
      });
      setStep(3);
      return;
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
      isSubmittedRef.current = true;
      setIsDirty(false);
      toast.success(
        data?.message || (mode === "edit" ? "Event updated successfully!" : "Event published successfully!")
      );
      queryClient.invalidateQueries({ queryKey: ["getevents"] });
      queryClient.invalidateQueries({ queryKey: ["getevents", eventId] });
      queryClient.invalidateQueries({ queryKey: ["getGroupByEventId", eventId] });
      navigate(mode === "edit" && eventId ? `/events/${eventId}` : "/events");
    },
    onError: (error) => {
      const resData = error?.response?.data;
      if (resData?.errors && typeof resData.errors === "object") {
        const normalizedErrors = {};
        for (const [k, v] of Object.entries(resData.errors)) {
          if (k === "title") {
            normalizedErrors.eventName = v;
            normalizedErrors.title = v;
          } else if (k === "file") {
            normalizedErrors.imageUrl = v;
          } else if (k === "technicalEvents" || k === "nonTechnicalEvents") {
            normalizedErrors.subEvents = v;
          } else {
            normalizedErrors[k] = v;
          }
        }
        setErrors(normalizedErrors);
        const firstErrorKey = Object.keys(normalizedErrors)[0];
        if (["title", "eventName", "description", "eventDate", "startTime", "endTime", "imageUrl", "file"].includes(firstErrorKey)) {
          setStep(1);
        } else if (["technical", "nonTechnical", "paid", "amount", "subEvents"].includes(firstErrorKey)) {
          setStep(2);
        }
        focusField(firstErrorKey);
        toast.error(normalizedErrors[firstErrorKey] || resData.error || "Validation failed");
      } else {
        toast.error(resData?.message || resData?.error || error?.message || "Failed to save event details");
      }
    },
  });

  const handleBack = () => {
    if (step > 1) {
      prevStep();
      return;
    }
    if (isDirty) {
      const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmLeave) return;
    }
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (mode === "edit" && eventId) {
      navigate(`/events/${eventId}`, { replace: true });
    } else {
      navigate("/events", { replace: true });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setTouched({
      eventName: true,
      title: true,
      description: true,
      imageUrl: true,
      file: true,
      eventDate: true,
      startTime: true,
      endTime: true,
      subEvents: true,
      amount: true,
    });

    // Full validation across all steps
    const validation = validateFullForm(formDataRef.current, file, mode);
    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.firstStepWithError) {
        setStep(validation.firstStepWithError);
      }
      if (validation.firstErrorField) {
        focusField(validation.firstErrorField);
      }
      const firstErrMsg = validation.errors[validation.firstErrorField] || "Please resolve form errors before submitting";
      toast.error(firstErrMsg);
      return;
    }

    const data = new FormData();
    const dateStr = formatDateToYYYYMMDD(formData.eventDate);
    const startTimeStr = formatTimeToHHmm(formData.startTime);
    const endTimeStr = formatTimeToHHmm(formData.endTime);

    data.append("title", (formData.eventName || "").trim());
    data.append("description", (formData.description || "").trim());
    data.append("startTime", startTimeStr);
    data.append("endTime", endTimeStr);
    data.append("eventDate", dateStr);
    data.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    data.append("paid", formData.paid);
    data.append("amount", formData.paid ? Number(formData.amount) : 0);
    data.append("swags", formData.swags);
    data.append("refreshments", formData.refreshments);
    data.append("technicalEvents", JSON.stringify(formData.technical));
    data.append("nonTechnicalEvents", JSON.stringify(formData.nonTechnical));

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
          onClick={handleBack}
          className="group flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 text-on-surface rounded-xl transition text-sm font-medium self-start active:scale-95"
        >
          <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span> Back
        </button>

        {/* Step Progress Timeline */}
        <EventFormTimeline step={step} />

        {/* Form Content */}
        <form noValidate onSubmit={handleSubmit} className="flex flex-col relative min-h-[420px] justify-between">
          {step === 1 && (
            <EventDetailsStep
              formData={formData}
              handleChange={handleChange}
              handleFileChange={handleFileChange}
              handleBlur={handleBlur}
              errors={errors}
              imageRef={imageRef}
              nextStep={nextStep}
              mode={mode}
            />
          )}

          {step === 2 && (
            <SubEventsStep
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              updateInput={updateInput}
              addEvent={addEvent}
              deleteEvent={deleteEvent}
              handleBlur={handleBlur}
              errors={errors}
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
