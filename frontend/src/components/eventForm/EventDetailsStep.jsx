import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EventDetailsStep = ({
  formData,
  handleChange,
  handleFileChange,
  imageRef,
  nextStep,
  mode = "create",
}) => {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-on-surface mb-1">
          {mode === "edit" ? "Edit Event Details" : "Event Details"}
        </h2>
        <p className="text-on-surface-variant text-xs font-normal">
          Set up the core details of your event poster and schedule
        </p>
      </div>

      {/* Event Name Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
          Event Name
        </label>
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
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
          Description
        </label>
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
        <div className="flex items-center justify-between pl-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Event Poster Image {mode === "edit" && <span className="normal-case text-outline font-normal">(Optional to replace)</span>}
          </label>
        </div>
        {mode === "edit" && formData?.existingImageUrl && !formData?.file && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 mb-2">
            <img
              src={formData.existingImageUrl}
              alt="Current Poster"
              className="w-14 h-14 object-cover rounded-lg border border-outline-variant/30 shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-on-surface">Current Poster</span>
              <span className="text-[11px] text-on-surface-variant">Upload a new file below to change it.</span>
            </div>
          </div>
        )}
        <input
          type="file"
          name="imageUrl"
          ref={imageRef}
          onChange={handleFileChange}
          className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-2.5 text-on-surface-variant text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-container/10 file:text-primary-container hover:file:bg-primary-container/20 file:cursor-pointer cursor-pointer focus:ring-1 focus:ring-primary-container/30"
          required={mode === "create" && !formData?.existingImageUrl}
        />
      </div>

      {/* Datepicker */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1 block">
          Event Date
        </label>
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
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1 block">
            Start Time
          </label>
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
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1 block">
            End Time
          </label>
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
          <span>Continue</span> <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default EventDetailsStep;
