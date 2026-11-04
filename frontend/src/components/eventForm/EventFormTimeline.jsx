import { FaUsers, FaCheck } from "react-icons/fa";
import { MdEmojiEvents } from "react-icons/md";
import { IoFastFoodSharp } from "react-icons/io5";

export const FORM_STEPS = [
  { label: "Group Details", icon: FaUsers },
  { label: "Sub Events", icon: MdEmojiEvents },
  { label: "Inclusions", icon: IoFastFoodSharp },
];

const EventFormTimeline = ({ step }) => {
  return (
    <div className="flex items-center justify-between gap-4 w-full">
      {FORM_STEPS.map((stepItem, index) => {
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
            <span
              className={`text-xs mt-2 font-medium tracking-wide transition-colors duration-300 hidden sm:block ${
                isActive
                  ? "text-primary-container font-semibold"
                  : isCompleted
                  ? "text-on-surface font-medium"
                  : "text-on-surface-variant"
              }`}
            >
              {stepItem.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default EventFormTimeline;
