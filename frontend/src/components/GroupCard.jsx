import { useState } from "react";
import GroupDetails from "./GroupDetails";
const GroupCard = ({ group, eventId }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleGroup = () => setExpanded(!expanded);

  return (
    <div className=" rounded p-2 bg-zinc-600 shadow-md my-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={toggleGroup}>
        <div>
          <h4 className="text-lg font-medium md:flex gap-1">
            {group?.name}
            {group?.isHead && (
              <div className=" px-1 md:px-2 py-1 bg-yellow-100 flex flex-col md:flex-row text-yellow-800 text-center rounded-full text-sm">
                Head Group
              </div>
            )}
          </h4>
        </div>
        <span className="text-blue-600">{expanded ? "▼" : "▶"}</span>
      </div>
      {expanded && <GroupDetails group={group} />}
    </div>
  );
};
export default GroupCard;
