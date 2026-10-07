import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { getgroups } from "../services/api";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { MdOutlineArrowBackIosNew } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Spinner from "./Spinner";

const GroupSidebar = ({
  setSelectedGroup,
  selectedGroup,
  toggleSidebar,
  isSidebarOpen,
}) => {
  const { data, error, isError, isPending } = useQuery({
    queryKey: ["getgroups"],
    queryFn: () => getgroups("member"),
  });

  const [openEvent, setOpenEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  const toggleEvent = (eventId) => {
    setOpenEvent(openEvent === eventId ? null : eventId);
  };

  return (
    <div
      className={`lg:w-1/3 w-full bg-surface-container-lowest border border-outline-variant/30 z-10 text-on-surface p-4 h-full overflow-y-auto rounded-2xl shadow-sm fixed top-0 left-0 transition-transform transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:relative lg:block`}
    >
      {isPending ? (
        <div className="h-full w-full flex justify-center items-center">
          <Spinner size="md" />
        </div>
      ) : (
        ""
      )}

      <div className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-2 top-2 left-2 text-on-surface h-full justify-center">
          <MdOutlineArrowBackIosNew
            size={20}
            onClick={() => navigate("/events")}
            className="cursor-pointer transition-all ease-in-out hover:scale-125 text-on-surface-variant hover:text-on-surface"
          />
          <h2 className="text-xl font-bold">Events</h2>
        </div>
        <div className="lg:hidden p-4">
          <button onClick={toggleSidebar} className="text-on-surface">
            ✕
          </button>
        </div>
      </div>
      {data?.length === 0 && (
        <div className=" h-1/2 flex justify-center items-end text-on-surface-variant text-sm">
          <h1>join some event and get started</h1>
        </div>
      )}
      {data?.map((event) => (
        <div key={event?._id} className="mb-2">
          {/* Event Name (Folder) */}
          <div
            className={`cursor-pointer flex items-center rounded-xl p-2.5 font-medium text-sm transition-colors ${
              selectedEvent === event?._id ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
            onClick={() => toggleEvent(event?._id)}
          >
            <span className="mr-2">
              {openEvent === event?._id ? <FaChevronDown /> : <FaChevronRight />}
            </span>
            {event?.eventDetails?.title}
          </div>

          {/* Groups under Event */}
          {openEvent === event?._id && (
            <div className="ml-6 mt-2 flex flex-col gap-1 ease-out">
              {event?.groups?.map((group) => (
                <div
                  key={group?._id}
                  className={`cursor-pointer flex items-center p-2 rounded-lg text-sm border-l-2 border-primary-container/40 transition-colors ${
                    selectedGroup === group?._id && selectedEvent === event?._id
                      ? "bg-primary-container/15 text-primary-container font-semibold"
                      : "bg-surface-container-low/70 text-on-surface hover:bg-surface-container"
                  }`}
                  onClick={() => {
                    setSelectedGroup(group?._id);
                    setSelectedEvent(event?._id);
                    toggleSidebar();
                  }}
                >
                  {group?.isHead ? (
                    <p className="flex items-center gap-2">
                      <span>{group?.name}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        head
                      </span>
                    </p>
                  ) : (
                    <p>{group?.name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GroupSidebar;
