import React from "react";

const SubEventsStep = ({
  formData,
  setFormData,
  handleChange,
  updateInput,
  addEvent,
  deleteEvent,
  handleBlur,
  errors = {},
  prevStep,
  nextStep,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-on-surface mb-1">Sub-Events Breakdown</h2>
        <p className="text-on-surface-variant text-xs font-normal">
          Add custom tracks (at least 1 track required, up to 20 per category) with attendance seating limits
        </p>
      </div>

      {/* Global sub-events error banner */}
      {errors.subEvents && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          <span>{errors.subEvents}</span>
        </div>
      )}

      {/* Technical Events */}
      <div className="space-y-3">
        <div className="flex justify-between items-center pl-1">
          <h3 className="text-sm font-bold text-primary-container uppercase tracking-wider">
            Technical Sub-events ({formData?.technical?.length || 0}/20)
          </h3>
          <span className="text-[11px] text-on-surface-variant/70">Max 50 chars per title</span>
        </div>

        <div className="flex gap-2.5 items-center">
          <input
            id="event-technical-input"
            type="text"
            placeholder="Event Name (e.g. Code Hack)"
            value={formData?.technicalInput || ""}
            maxLength={50}
            onChange={(e) => updateInput("technicalInput", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEvent("technical", formData?.technicalInput, formData?.technicalLimitInput);
              }
            }}
            className="flex-grow bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-2.5 text-on-surface outline-none text-sm placeholder:text-outline focus:ring-1 focus:ring-primary-container/30"
          />
          <input
            type="number"
            placeholder="Limit"
            value={formData?.technicalLimitInput ?? ""}
            min={1}
            max={10000}
            onChange={(e) =>
              setFormData({
                ...formData,
                technicalLimitInput: e.target.value === "" ? "" : parseInt(e.target.value, 10),
              })
            }
            onKeyDown={(e) => {
              if (e.key === "e" || e.key === "E" || e.key === "-" || e.key === "+") e.preventDefault();
              if (e.key === "Enter") {
                e.preventDefault();
                addEvent("technical", formData?.technicalInput, formData?.technicalLimitInput);
              }
            }}
            className="w-24 bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-2 py-2.5 text-center text-on-surface outline-none text-sm focus:ring-1 focus:ring-primary-container/30"
          />
          <button
            type="button"
            onClick={() => addEvent("technical", formData?.technicalInput, formData?.technicalLimitInput)}
            className="h-10 px-3 flex items-center justify-center bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 text-primary-container rounded-xl text-sm font-bold transition duration-200 active:scale-95"
            title="Add technical sub-event"
          >
            + Add
          </button>
        </div>

        {/* Sub-event Chips grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1.5">
          {formData?.technical?.map((event, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-surface-container-low border border-outline-variant/20 pl-3.5 pr-2 py-2 rounded-xl text-xs shadow-xs"
            >
              <div className="flex flex-col gap-0.5 text-on-surface font-medium truncate pr-2">
                <span className="truncate">{event?.name}</span>
                <span className="text-[10px] text-on-surface-variant font-semibold uppercase">
                  Limit: {event?.limit || 15} Seats
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteEvent("technical", index)}
                className="text-on-surface-variant hover:text-error p-1 transition shrink-0"
                title="Remove track"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Non-Technical Events */}
      <div className="space-y-3 pt-3 border-t border-outline-variant/20">
        <div className="flex justify-between items-center pl-1">
          <h3 className="text-sm font-bold text-secondary-lumina uppercase tracking-wider">
            Non-technical Sub-events ({formData?.nonTechnical?.length || 0}/20)
          </h3>
          <span className="text-[11px] text-on-surface-variant/70">Max 50 chars per title</span>
        </div>

        <div className="flex gap-2.5 items-center">
          <input
            id="event-nontechnical-input"
            type="text"
            placeholder="Event Name (e.g. Pitch Fest)"
            value={formData?.nonTechnicalInput || ""}
            maxLength={50}
            onChange={(e) => updateInput("nonTechnicalInput", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEvent("nonTechnical", formData?.nonTechnicalInput, formData?.nonTechnicalLimitInput);
              }
            }}
            className="flex-grow bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-2.5 text-on-surface outline-none text-sm placeholder:text-outline focus:ring-1 focus:ring-primary-container/30"
          />
          <input
            type="number"
            placeholder="Limit"
            value={formData?.nonTechnicalLimitInput ?? ""}
            min={1}
            max={10000}
            onChange={(e) =>
              setFormData({
                ...formData,
                nonTechnicalLimitInput: e.target.value === "" ? "" : parseInt(e.target.value, 10),
              })
            }
            onKeyDown={(e) => {
              if (e.key === "e" || e.key === "E" || e.key === "-" || e.key === "+") e.preventDefault();
              if (e.key === "Enter") {
                e.preventDefault();
                addEvent("nonTechnical", formData?.nonTechnicalInput, formData?.nonTechnicalLimitInput);
              }
            }}
            className="w-24 bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-2 py-2.5 text-center text-on-surface outline-none text-sm focus:ring-1 focus:ring-primary-container/30"
          />
          <button
            type="button"
            onClick={() => addEvent("nonTechnical", formData?.nonTechnicalInput, formData?.nonTechnicalLimitInput)}
            className="h-10 px-3 flex items-center justify-center bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 text-secondary-lumina rounded-xl text-sm font-bold transition duration-200 active:scale-95"
            title="Add non-technical sub-event"
          >
            + Add
          </button>
        </div>

        {/* Sub-event Chips grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1.5">
          {formData?.nonTechnical?.map((event, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-surface-container-low border border-outline-variant/20 pl-3.5 pr-2 py-2 rounded-xl text-xs shadow-xs"
            >
              <div className="flex flex-col gap-0.5 text-on-surface font-medium truncate pr-2">
                <span className="truncate">{event?.name}</span>
                <span className="text-[10px] text-on-surface-variant font-semibold uppercase">
                  Limit: {event?.limit || 15} Seats
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteEvent("nonTechnical", index)}
                className="text-on-surface-variant hover:text-error p-1 transition shrink-0"
                title="Remove track"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-Events Registration Pricing */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-4 shadow-sm">
        <label className="relative flex items-center justify-between cursor-pointer p-1">
          <div className="flex flex-col pr-4">
            <span className="text-sm font-bold text-on-surface uppercase tracking-wider text-xs">
              Paid Event
            </span>
            <span className="text-[11px] text-on-surface-variant">
              Enable registration fee for each sub-event
            </span>
          </div>
          <input
            type="checkbox"
            className="sr-only peer"
            id="paid"
            checked={formData?.paid}
            onChange={(e) => {
              const isChecked = e.target.checked;
              handleChange?.("paid", isChecked);
              if (!isChecked) {
                handleChange?.("amount", 0);
              } else {
                const existing = formData.amount && formData.amount > 0 ? formData.amount : "";
                handleChange?.("amount", existing);
              }
            }}
          />
          <div className="relative w-11 h-6 bg-surface-container-high peer-checked:bg-primary-container rounded-full transition-colors duration-200 shrink-0 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
        </label>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-outline-variant/20">
          <div className="flex flex-col">
            <label
              htmlFor="event-amount-input"
              className={`text-sm font-medium transition-colors ${
                formData?.paid ? "text-on-surface" : "text-on-surface-variant/70"
              }`}
            >
              Amount per Sub-Event (INR) {formData?.paid && <span className="text-rose-500">*</span>}
            </label>
            <span className="text-[11px] text-on-surface-variant/80">
              {formData?.paid
                ? "Uniform amount per registered sub-event (Max 100,000 INR, up to 2 decimal places)"
                : "Free entry enabled. Turn on 'Paid Event' above to charge attendees"}
            </span>
          </div>

          <div className="flex flex-col items-end w-full sm:w-auto">
            <div className="relative w-full sm:w-40">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-outline font-medium">
                ₹
              </span>
              <input
                type="number"
                id="event-amount-input"
                min={1}
                max={100000}
                step="0.01"
                disabled={!formData?.paid}
                placeholder="0"
                value={formData?.paid ? (formData?.amount ?? "") : 0}
                onKeyDown={(e) => {
                  if (e.key === "e" || e.key === "E" || e.key === "-" || e.key === "+") {
                    e.preventDefault();
                  }
                }}
                onBlur={() => handleBlur?.("amount")}
                onChange={(e) => {
                  handleChange?.("amount", e.target.value);
                }}
                className={`w-full pl-8 pr-3 py-2 border rounded-xl text-sm font-semibold outline-none transition text-right ${
                  !formData?.paid
                    ? "bg-surface-container-low/50 border-outline-variant/20 text-outline cursor-not-allowed"
                    : errors.amount
                    ? "bg-surface-container-low border-rose-500/80 focus:border-rose-500 text-on-surface focus:ring-1 focus:ring-rose-500/20"
                    : "bg-surface-container-low border-outline-variant/40 focus:border-primary-container text-on-surface focus:ring-1 focus:ring-primary-container/30"
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1" role="alert">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.amount}
              </p>
            )}
          </div>
        </div>
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

export default SubEventsStep;
