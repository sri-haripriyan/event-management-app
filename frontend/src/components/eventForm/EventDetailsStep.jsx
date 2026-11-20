import EventDateTime from "./EventDateTime";

const EventDetailsStep = ({
  formData,
  handleChange,
  handleFileChange,
  handleBlur,
  errors = {},
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
        <label
          htmlFor="event-title-input"
          className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1"
        >
          Event Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="event-title-input"
          type="text"
          placeholder="Enter the main title (3-100 characters)"
          value={formData?.eventName || ""}
          onChange={(e) => handleChange("eventName", e.target.value)}
          onBlur={() => handleBlur?.("eventName")}
          maxLength={100}
          className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 text-on-surface outline-none transition text-sm placeholder:text-outline focus:ring-1 ${
            errors.eventName || errors.title
              ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-outline-variant/40 focus:border-primary-container focus:ring-primary-container/30"
          }`}
        />
        {(errors.eventName || errors.title) && (
          <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1" role="alert">
            <span className="material-symbols-outlined text-sm">error</span>
            {errors.eventName || errors.title}
          </p>
        )}
      </div>

      {/* Description Input */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center pl-1">
          <label
            htmlFor="event-desc-input"
            className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
          >
            Description <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-on-surface-variant/70">
            {(formData?.description || "").trim().length}/2000
          </span>
        </div>
        <textarea
          id="event-desc-input"
          placeholder="Describe your event agenda, rules, and timings (20-2000 characters)..."
          value={formData?.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          onBlur={() => handleBlur?.("description")}
          maxLength={2000}
          className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 text-on-surface outline-none transition text-sm placeholder:text-outline focus:ring-1 h-28 resize-none ${
            errors.description
              ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-outline-variant/40 focus:border-primary-container focus:ring-primary-container/30"
          }`}
        />
        {errors.description && (
          <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1" role="alert">
            <span className="material-symbols-outlined text-sm">error</span>
            {errors.description}
          </p>
        )}
      </div>

      {/* Image poster upload */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between pl-1">
          <label
            htmlFor="event-poster-input"
            className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
          >
            Event Poster Image <span className="text-rose-500">*</span>{" "}
            {mode === "edit" && (
              <span className="normal-case text-outline font-normal">(Optional to replace)</span>
            )}
          </label>
          <span className="text-[11px] text-on-surface-variant/70">JPG, PNG, WebP (Max 5 MB)</span>
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
          id="event-poster-input"
          type="file"
          name="imageUrl"
          ref={imageRef}
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          onBlur={() => handleBlur?.("imageUrl")}
          className={`w-full bg-surface-container-low border rounded-xl px-4 py-2.5 text-on-surface-variant text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-container/10 file:text-primary-container hover:file:bg-primary-container/20 file:cursor-pointer cursor-pointer focus:ring-1 ${
            errors.imageUrl || errors.file
              ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-outline-variant/40 focus:border-primary-container focus:ring-primary-container/30"
          }`}
        />
        {(errors.imageUrl || errors.file) && (
          <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1" role="alert">
            <span className="material-symbols-outlined text-sm">error</span>
            {errors.imageUrl || errors.file}
          </p>
        )}
      </div>

      {/* Venue & Location Section */}
      <div className="space-y-4 pt-1">
        {/* Venue Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center pl-1">
            <label
              htmlFor="event-venue-input"
              className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm text-primary-container">apartment</span>
              <span>Venue (College / Campus / Place) <span className="text-rose-500">*</span></span>
            </label>
            <span className="text-[11px] text-on-surface-variant/70">
              {(formData?.venue || "").trim().length}/200
            </span>
          </div>
          <input
            id="event-venue-input"
            type="text"
            placeholder="e.g., Stanford Memorial Auditorium or PSG College of Technology"
            value={formData?.venue || ""}
            onChange={(e) => handleChange("venue", e.target.value)}
            onBlur={() => handleBlur?.("venue")}
            maxLength={200}
            className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 text-on-surface outline-none transition text-sm placeholder:text-outline focus:ring-1 ${
              errors.venue
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-outline-variant/40 focus:border-primary-container focus:ring-primary-container/30"
            }`}
          />
          {errors.venue && (
            <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1" role="alert">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.venue}
            </p>
          )}
        </div>

        {/* Location Google Maps Link Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center pl-1">
            <label
              htmlFor="event-location-input"
              className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm text-primary-container">location_on</span>
              <span>Location (Google Maps Link) <span className="text-rose-500">*</span></span>
            </label>
            <div className="flex items-center gap-2">
              {formData?.venue?.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    const generatedUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      formData.venue.trim()
                    )}`;
                    handleChange("location", generatedUrl);
                  }}
                  className="text-[11px] text-primary-container hover:underline font-semibold flex items-center gap-1 bg-primary-container/10 px-2 py-0.5 rounded-md transition hover:bg-primary-container/20"
                  title="Generate a direct Google Maps search link from the venue name"
                >
                  <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                  <span>Generate from Venue</span>
                </button>
              )}
              {formData?.location && formData.location.startsWith("http") && (
                <a
                  href={formData.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-outline hover:text-on-surface flex items-center gap-0.5 hover:underline"
                  title="Open in Google Maps to preview"
                >
                  <span>Preview</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              )}
            </div>
          </div>
          <input
            id="event-location-input"
            type="url"
            placeholder="e.g., https://maps.google.com/... or https://maps.app.goo.gl/..."
            value={formData?.location || ""}
            onChange={(e) => handleChange("location", e.target.value)}
            onBlur={() => handleBlur?.("location")}
            maxLength={1000}
            className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 text-on-surface outline-none transition text-sm placeholder:text-outline focus:ring-1 ${
              errors.location
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-outline-variant/40 focus:border-primary-container focus:ring-primary-container/30"
            }`}
          />
          {errors.location ? (
            <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1" role="alert">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.location}
            </p>
          ) : (
            <p className="text-[11px] text-on-surface-variant/70 pl-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-outline">info</span>
              <span>Provide a Google Maps share link or click &apos;Generate from Venue&apos;</span>
            </p>
          )}
        </div>
      </div>

      {/* Event Date & Timings Section */}
      <EventDateTime
        formData={formData}
        handleChange={handleChange}
        handleBlur={handleBlur}
        errors={errors}
      />

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
