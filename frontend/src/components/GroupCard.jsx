import { useState } from "react";
import GroupDetails from "./GroupDetails";
const GroupCard = ({ group, eventId }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleGroup = () => setExpanded(!expanded);

  return (
    <div className="rounded-xl p-3 bg-surface-container-low border border-outline-variant/30 shadow-sm my-3 text-on-surface">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={toggleGroup}>
        <div>
          <h4 className="text-base font-semibold md:flex items-center gap-2">
            {group?.name}
            {group?.isHead && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase">
                Head Group
              </span>
            )}
          </h4>
        </div>
        <span className="text-primary-container text-xs">{expanded ? "▼" : "▶"}</span>
      </div>
      {expanded && <GroupDetails group={group} />}
    </div>
  );
};
export default GroupCard;
