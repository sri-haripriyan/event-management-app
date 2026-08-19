import React from "react";
import { FaBars } from "react-icons/fa";

const GroupEmptyView = ({ toggleSidebar }) => {
  return (
    <div className="lg:w-2/3 w-full bg-zinc-900 text-white h-full z-0 overflow-y-auto rounded-lg flex justify-center items-center relative">
      <div className="lg:hidden p-4 absolute top-0 left-0">
        <button onClick={toggleSidebar} className="text-white">
          <FaBars />
        </button>
      </div>
      <div>
        <p className="text-gray-400">Select a group to start chatting</p>
      </div>
    </div>
  );
};

export default GroupEmptyView;
