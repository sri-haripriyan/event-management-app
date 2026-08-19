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
    <div className="p-2  font-roboto  mx-auto select-none">
      <section className="  flex flex-col sm:flex-row gap-2 ">
        <div className=" sm:w-[300px] h-[250px] rounded-md flex flex-col justify-around text-center relative p-4 bg-slate-800">
          <div
            title="upload"
            onClick={handleClick}
            className={`flex relative cursor-pointer transition-opacity duration-300 group justify-center uppercase  items-center rounded-full  border-2 mx-auto`}>
            <Avatar
              size={"xl"}
              imageUrl={user?.profile_image_url}
              name={user?.userName}
            />

            <div className="absolute inset-0 cursor-pointer bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 ">
              <TiCameraOutline className="text-white w-8 h-8" />
            </div>
            <input
              type="file"
              ref={fileRef}
              onChange={handleProfileImageUpload}
              className="hidden "
            />
          </div>
          <div>
            <p className="cursor-pointer">{user?.userName} </p>
            <p className="opacity-70">{user?.email}</p>
          </div>
          <div
            className="absolute top-2 right-2"
            onClick={() => setIsOpen(true)}
            title="Edit">
            <TbEdit className="cursor-pointer text-xl text-green-500" />
          </div>
        </div>
        <div className=" border-2 sm:w-[80%] pl-2 sm:pl-5 pt-2 sm:pt-3 rounded-md">
          <h3>Events</h3>
          <div className=" font-mono">
            <p>Events Created: {data?.eventsCreated} </p>
            <p>Events participated: {data?.eventsParticipated}</p>
          </div>
        </div>
      </section>
      <section className=" rounded-md mt-3 p-2 space-y-5 bg-zinc-800 ">
        <h3 className="font-mono font-bold">Most liked events</h3>
        <div className="flex flex-col gap-7 sm:flex-row justify-around pb-5 font-mono">
          {data?.most_liked_events.slice(0, 3).map((event) => (
            <div
              key={event?._id}
              onClick={() => {
                navigate(`/events/${event?._id}`);
              }}
              className=" mx-auto w-4/5 sm:w-[220px] h-[230px] p-2 cursor-pointer rounded-md bg-slate-500 flex flex-col">
              <img
                className="rounded-md w-4/5 sm:w-[200px] mx-auto h-[160px] object-cover"
                src={event?.imageUrl}
                alt={event?.title}
              />
              <p className="text-[12px]] p-1 line-clamp-1">
                <IoIosRocket className="inline text-blue-700 mr-1" />
                {event?.title}
              </p>
              <div className="flex justify-between items-center">
                <div>
                  <FcLike size={20} className="inline mx-1 text-red-600" />
                  {event?.likes?.length}
                </div>
                <p className=" text-sm text-black">
                  {formatTimestamp(event?.createdAt)}
                </p>
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
