const SubEventsStep = ({
  formData,
  setFormData,
  updateInput,
  addEvent,
  deleteEvent,
  prevStep,
  nextStep,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-on-surface mb-1">Sub-Events Breakdown</h2>
        <p className="text-on-surface-variant text-xs font-normal">
          Add custom tracks (limit 5 per category) with attendance seating limits
        </p>
      </div>

      {/* Technical Events */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-primary-container pl-1 uppercase tracking-wider">
          Technical Sub-events
        </h3>
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
            <div
              key={index}
              className="flex justify-between items-center bg-surface-container-low border border-outline-variant/20 pl-3.5 pr-2 py-2 rounded-xl text-xs"
            >
              <div className="flex flex-col gap-0.5 text-on-surface font-medium">
                <span>{event?.name}</span>
                <span className="text-[10px] text-on-surface-variant font-semibold uppercase">
                  Limit: {event?.limit}
                </span>
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
        <h3 className="text-sm font-bold text-secondary-lumina pl-1 uppercase tracking-wider">
          Non-technical Sub-events
        </h3>
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
            <div
              key={index}
              className="flex justify-between items-center bg-surface-container-low border border-outline-variant/20 pl-3.5 pr-2 py-2 rounded-xl text-xs"
            >
              <div className="flex flex-col gap-0.5 text-on-surface font-medium">
                <span>{event?.name}</span>
                <span className="text-[10px] text-on-surface-variant font-semibold uppercase">
                  Limit: {event?.limit}
                </span>
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
              setFormData((prev) => ({
                ...prev,
                paid: isChecked,
                amount: isChecked ? (prev.amount && prev.amount > 0 ? prev.amount : "") : 0,
              }));
            }}
          />
          <div className="relative w-11 h-6 bg-surface-container-high peer-checked:bg-primary-container rounded-full transition-colors duration-200 shrink-0 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
        </label>

        <div className="flex justify-between items-center gap-4 pt-3 border-t border-outline-variant/20">
          <div className="flex flex-col">
            <label
              htmlFor="amount"
              className={`text-sm font-medium transition-colors ${
                formData?.paid ? "text-on-surface" : "text-on-surface-variant/70"
              }`}
            >
              Amount per Sub-Event (INR)
            </label>
            <span className="text-[11px] text-on-surface-variant/80">
              {formData?.paid
                ? "This amount applies uniformly to each registered sub-event"
                : "Enable 'Paid Event' switch above to set amount"}
            </span>
          </div>
          <div className="relative w-36">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-outline font-medium">
              ₹
            </span>
            <input
              type="number"
              id="amount"
              min={1}
              disabled={!formData?.paid}
              placeholder="0"
              value={formData?.amount}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                setFormData((prev) => ({ ...prev, amount: val }));
              }}
              className={`w-full pl-8 pr-3 py-2 border rounded-xl text-sm font-semibold outline-none transition text-right ${
                formData?.paid
                  ? "bg-surface-container-low border-outline-variant/40 focus:border-primary-container text-on-surface focus:ring-1 focus:ring-primary-container/30"
                  : "bg-surface-container-low/50 border-outline-variant/20 text-outline cursor-not-allowed"
              }`}
            />
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
