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
    <div className="lg:w-2/3 w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface h-full overflow-y-auto rounded-2xl shadow-sm block">
      {isPending ? (
        <div className="h-full w-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        ""
      )}
      <div
        className="h-[8.33%] w-full flex items-center p-3 gap-2
       border-b border-outline-variant/30 text-on-surface bg-surface-container-low rounded-t-2xl">
        {/* Hamburger Menu */}
        <div className="lg:hidden p-2">
          <button onClick={toggleSidebar} className="text-on-surface">
            <FaBars />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Avatar size={"sm"} name={groupInfo?.data?.name} />
          <h1 className="text-base font-bold truncate text-on-surface">
            {groupInfo?.data?.name || "Group Name"}
          </h1>
        </div>
      </div>
      <ul className="flex flex-col gap-3 mx-4 p-4 h-5/6 overflow-y-auto scroll-smooth rounded-lg">
        {conversation?.length === 0 && (
          <div className="h-full w-full flex justify-center items-center text-on-surface-variant text-sm">
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
                className={`p-3 flex ${
                  isSender
                    ? "justify-end bg-primary-container text-on-primary"
                    : "justify-start bg-surface-container-low border border-outline-variant/20 text-on-surface"
                } flex-col rounded-2xl max-w-[65%] shadow-sm`}>
                {/* Sender Info */}
                <p
                  className={`text-xs justify-between flex items-center ${
                    isSender ? "text-right text-on-primary/90" : "text-left text-on-surface-variant font-medium"
                  } mb-1`}>
                  <span
                    style={{ color: isSender ? "inherit" : getRandomColor(chat?.senderId?.userName) }}>
                    {chat?.senderId?.userName}
                  </span>
                  <span
                    className={`${
                      groupInfo?.data?.admin?._id === chat?.senderId?._id
                        ? "inline-block"
                        : "hidden"
                    } bg-amber-200 text-[10px] text-amber-900 font-bold px-2 ml-2 rounded-full`}>
                    Host
                  </span>
                </p>
                {/* Message */}
                <p className="text-sm leading-relaxed">
                  {chat?.message}
                </p>
                {/* Timestamp */}
                <p
                  className={`text-[10px] ${
                    isSender ? "text-left text-on-primary/70" : "text-right text-on-surface-variant/70"
                  } mt-1.5`}>
                  {formatTimestamp(chat?.createdAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <form
        onSubmit={handleSend}
        className="w-full h-[8.33%] px-4 py-2 bg-surface-container-low flex items-center justify-between rounded-b-2xl
         border-t border-outline-variant/30 overflow-hidden">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="h-full w-5/6 md:w-[90%] text-on-surface bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary-container placeholder:text-outline text-sm"
        />
        <button
          type="submit"
          className="bg-primary-container rounded-full flex items-center justify-center hover:bg-surface-tint text-on-primary p-2.5 shadow-sm transition-transform transform active:scale-95">
          {pending ? <Spinner size="sm" /> : <VscSend size={18} />}
        </button>
      </form>
    </div>
  );
};

export default GroupChatSection;
