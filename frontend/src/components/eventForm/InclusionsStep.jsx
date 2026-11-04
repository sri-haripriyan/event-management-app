import Spinner from "../Spinner";

const InclusionsStep = ({
  formData,
  handleChangefoods,
  prevStep,
  isPending,
  mode = "create",
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-on-surface mb-1">Event Inclusions</h2>
        <p className="text-on-surface-variant text-xs font-normal">
          Set up refreshments and swags for attendees
        </p>
      </div>

      {/* Inclusions */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
          Event Inclusions
        </h3>

        <div className="flex flex-col gap-3">
          {/* Refreshments */}
          <label className="relative flex items-center justify-between cursor-pointer p-1">
            <span className="text-sm font-medium text-on-surface">Provide Refreshments</span>
            <input
              type="checkbox"
              className="sr-only peer"
              id="refreshment"
              checked={formData?.refreshments}
              onChange={(e) => handleChangefoods("refreshments", e.target.checked)}
            />
            <div className="relative w-11 h-6 bg-surface-container-high peer-checked:bg-primary-container rounded-full transition-colors duration-200 shrink-0 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
          </label>

          {/* Swags */}
          <label className="relative flex items-center justify-between cursor-pointer p-1">
            <span className="text-sm font-medium text-on-surface">Provide Swags / Merch</span>
            <input
              type="checkbox"
              className="sr-only peer"
              id="Swags"
              checked={formData?.swags}
              onChange={(e) => handleChangefoods("swags", e.target.checked)}
            />
            <div className="relative w-11 h-6 bg-surface-container-high peer-checked:bg-primary-container rounded-full transition-colors duration-200 shrink-0 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-5"></div>
          </label>
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
          type="submit"
          className="px-6 py-2.5 bg-primary-container hover:bg-surface-tint text-on-primary rounded-xl font-semibold transition text-sm shadow-md shadow-primary-container/20 active:scale-[0.98] min-w-[140px] flex items-center justify-center gap-1.5"
          disabled={isPending}
        >
          {isPending ? (
            <Spinner size="sm" />
          ) : mode === "edit" ? (
            "Save Changes 🚀"
          ) : (
            "Publish Event 🚀"
          )}
        </button>
      </div>
    </div>
  );
};

export default InclusionsStep;
