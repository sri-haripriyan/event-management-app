import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { TbEdit } from "react-icons/tb";
import { TiCameraOutline } from "react-icons/ti";
import { IoIosRocket } from "react-icons/io";
import { useAuth } from "../hooks/useAuth";
import UpdateProfile from "./UpdateProfile.jsx";
import { FcLike } from "react-icons/fc";
import { fetchUserEvents, getPanelData, uploadImage } from "../services/api.js";
import { getRandomColor } from "../utils/color.js";
import Avatar from "./Avatar.jsx";
import Event from "./Event.jsx";
import { formatTimestamp } from "../utils/time.js";
const Profile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["profile-data"],
    queryFn: () => getPanelData(),
  });
  const { data: eventData } = useQuery({
    queryKey: ["getEvents"],
    queryFn: () => fetchUserEvents(user._id),
  });
  const { mutate, isPending: isUploadRunning } = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      setUser(data?.user);
      toast.success(data?.message);
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  const navigate = useNavigate();

  const handleProfileImageUpload = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    setUser((user) => ({ ...user, profile_image_url: file }));
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    mutate(formData);
  };
  const handleClick = () => {
    fileRef.current.click();
  };

  // if (isLoading || isUploadRunning) return <Spinner />;
  if (isError) toast.error("Error fetching data");

  const color = getRandomColor(user.userName);

  return (
    <div className="p-2 font-poppins text-on-surface mx-auto select-none">
      <section className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-[300px] h-[250px] rounded-2xl flex flex-col justify-around text-center relative p-4 bg-surface-container-lowest border border-outline-variant/30 shadow-sm text-on-surface">
          <div
            title="upload"
            onClick={handleClick}
            className={`flex relative cursor-pointer transition-opacity duration-300 group justify-center uppercase items-center rounded-full mx-auto`}>
            <Avatar
              size={"xl"}
              imageUrl={user?.profile_image_url}
              name={user?.userName}
            />

            <div className="absolute inset-0 cursor-pointer bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <TiCameraOutline className="text-white w-8 h-8" />
            </div>
            <input
              type="file"
              ref={fileRef}
              onChange={handleProfileImageUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="cursor-pointer font-bold text-on-surface">{user?.userName} </p>
            <p className="text-on-surface-variant text-sm">{user?.email}</p>
          </div>
          <div
            className="absolute top-3 right-3"
            onClick={() => setIsOpen(true)}
            title="Edit">
            <TbEdit className="cursor-pointer text-xl text-primary-container" />
          </div>
        </div>
        <div className="border border-outline-variant/30 bg-surface-container-lowest text-on-surface sm:w-[80%] p-6 rounded-2xl shadow-sm flex flex-col justify-center">
          <h3 className="text-base font-bold text-on-surface mb-2">Events Statistics</h3>
          <div className="text-sm text-on-surface-variant space-y-1">
            <p>Events Created: <span className="font-semibold text-on-surface">{data?.eventsCreated || 0}</span></p>
            <p>Events Participated: <span className="font-semibold text-on-surface">{data?.eventsParticipated || 0}</span></p>
          </div>
        </div>
      </section>
      <section className="rounded-2xl mt-4 p-4 space-y-4 bg-surface-container-lowest border border-outline-variant/30 text-on-surface shadow-sm">
        <h3 className="font-bold text-base text-on-surface">Most Liked Events</h3>
        <div className="flex flex-col gap-5 sm:flex-row justify-around pb-2">
          {data?.most_liked_events?.slice(0, 3).map((event) => (
            <div
              key={event?._id}
              onClick={() => {
                navigate(`/events/${event?._id}`);
              }}
              className="mx-auto w-full sm:w-[220px] p-2.5 cursor-pointer rounded-xl bg-surface-container-low border border-outline-variant/20 hover:border-outline-variant/60 flex flex-col transition-all hover:-translate-y-1 shadow-sm">
              <img
                className="rounded-lg w-full h-[150px] object-cover mb-2"
                src={event?.imageUrl}
                alt={event?.title}
              />
              <p className="text-xs font-semibold p-1 line-clamp-1 text-on-surface">
                <IoIosRocket className="inline text-primary-container mr-1" />
                {event?.title}
              </p>
              <div className="flex justify-between items-center px-1 text-xs text-on-surface-variant">
                <div className="flex items-center gap-1">
                  <FcLike size={16} />
                  <span>{event?.likes?.length || 0}</span>
                </div>
                <span>
                  {formatTimestamp(event?.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      {isOpen && <UpdateProfile user={user} close={() => setIsOpen(false)} />}
    </div>
  );
};

export default Profile;
