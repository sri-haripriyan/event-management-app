import React from "react";
import { FaBars } from "react-icons/fa";

const GroupEmptyView = ({ toggleSidebar }) => {
  return (
    <div className="lg:w-2/3 w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface h-full z-0 overflow-y-auto rounded-2xl shadow-sm flex justify-center items-center relative">
      <div className="lg:hidden p-4 absolute top-0 left-0">
        <button onClick={toggleSidebar} className="text-on-surface">
          <FaBars />
        </button>
      </div>
      <div>
        <p className="text-on-surface-variant text-sm font-medium">Select a group to start chatting</p>
      </div>
    </div>
  );
};

export default GroupEmptyView;
