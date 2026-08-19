import React, { useEffect, useRef, useState } from "react";
import Avatar from "../components/Avatar";
import { useSocketContext } from "../context/socketContext";
import { VscSend } from "react-icons/vsc";
import { getRandomColor } from "../utils/color";
import { fetchChat, getgroupInfo } from "../services/api";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { formatTimestamp } from "../utils/time";
import Spinner from "../components/Spinner";
import { FaBars } from "react-icons/fa";

const GroupChatSection = ({ selectedGroup, toggleSidebar }) => {
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");
  const { socket } = useSocketContext();
  const groupid = selectedGroup;
  const { user } = useAuth();
  const [pending, setPending] = useState(false);

  const scrollRef = useRef(null);

  // Fetch Group Info
  const { data: groupInfo } = useQuery({
    queryKey: ["getgroups", groupid],
    queryFn: () => getgroupInfo(groupid),
    enabled: !!groupid, // Only fetch if groupid exists
  });

  // Fetch Chat Messages
  const { data: conversationData, isPending } = useQuery({
    queryKey: ["fetchChat", groupid],
    queryFn: () => fetchChat(groupid),
    enabled: !!groupid, // Only fetch if groupid exists
    onSuccess: (data) => {
      setConversation(data); // Update conversation when chat data is fetched
    },
  });

  useEffect(() => {
    setConversation(conversationData?.data);
  }, [conversationData]);
  useEffect(() => {
    if (!groupid || !socket) return;

    socket.emit("joinRoom", groupid);

    socket.on("newMessage", (message) => {
      setConversation((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [groupid, socket]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setPending(true);
    const res = await fetch("/api/message/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: input, groupId: groupid }),
    });

    const data = await res.json();
    socket.emit("newMessage", data);
    setInput("");
    setPending(false);
  };

  return (
    <div className="lg:w-2/3 w-full bg-zinc-900 text-white h-full overflow-y-auto rounded-lg block">
      {isPending ? (
        <div className="h-full w-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        ""
      )}
      <div
        className="h-[8.33%] w-full flex items-center p-2 gap-2
       shadow-lg text-white bg-zinc-700 rounded-t-lg">
        {/* Hamburger Menu */}
        <div className="lg:hidden p-2">
          <button onClick={toggleSidebar} className="text-white">
            <FaBars />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Avatar size={"sm"} name={groupInfo?.data?.name} />
          <h1 className="text-lg font-bold truncate ">
            {groupInfo?.data?.name || "Group Name"}
          </h1>
        </div>
      </div>
      <ul className="flex flex-col gap-3 mx-4 p-4 h-5/6 overflow-y-auto scroll-smooth rounded-lg shadow-inner">
        {conversation?.length === 0 && (
          <div className="h-full w-full flex justify-center items-center text-gray-400">
            <p>Start a new conversation</p>
          </div>
        )}
        {conversation?.map((chat) => {
          const isSender = user?._id === chat?.senderId?._id;
          return (
            <li
              key={chat?._id}
              ref={scrollRef}
              className={`flex items-end ${
                isSender ? "flex-row-reverse" : "flex-row"
              } w-full`}>
              {/* Avatar */}
              <div className={`${isSender ? "ml-3" : "mr-3"}`}>
                <Avatar
                  size="sm"
                  name={chat?.senderId?.userName}
                  bgColor={getRandomColor(chat?.senderId?.userName)}
                />
              </div>

              {/* Chat Bubble */}
              <div
                className={`p-2 flex ${
                  isSender
                    ? "justify-end bg-gray-800"
                    : "justify-start bg-gray-700"
                } flex-col text-white rounded-xl max-w-[60%] shadow-md`}>
                {/* Sender Info */}
                <p
                  className={`text-xs justify-between flex ${
                    isSender ? "text-right " : "text-left "
                  } mb-1`}>
                  <span
                    className=""
                    style={{ color: getRandomColor(chat?.senderId?.userName) }}>
                    {chat?.senderId?.userName}
                  </span>
                  <span
                    className={`${
                      groupInfo?.data?.admin?._id === chat?.senderId?._id
                        ? "inline-block"
                        : "hidden"
                    } bg-yellow-200 text-xs text-black px-2 ml-2 rounded-full`}>
                    Host
                  </span>
                </p>
                {/* Message */}
                <p className="font-mono text-sm leading-relaxed">
                  {chat?.message}
                </p>
                {/* Timestamp */}
                <p
                  className={`text-xs font-mono ${
                    isSender ? "text-left" : "text-right"
                  } mt-2 text-gray-400`}>
                  {formatTimestamp(chat?.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <form
        onSubmit={handleSend}
        className="w-full h-[8.33%] px-4 py-2 bg-zinc-700 flex items-center justify-between rounded-b-lg
         border-t border-gray-600 overflow-hidden">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="h-full w-5/6 md:w-[90%] text-slate-200 bg-zinc-800 p-2 rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-800 text-white p-2  shadow-md transition-transform transform hover:scale-110">
          {pending ? <Spinner size="sm" /> : <VscSend size={20} />}
        </button>
      </form>
    </div>
  );
};

export default GroupChatSection;
