import { useState } from "react";
import { signout } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";
import { getRandomColor } from "../utils/color";

export default function UserMenu() {
  const { user: info } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative inline-block">
      <button
        onClick={() => navigate("/profile")}
        className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
        title="View Profile"
        aria-label="View Profile"
      >
        <Avatar
          size={"md"}
          name={info?.userName}
          imageUrl={info?.profile_image_url}
          disableNavigate={true}
        />
      </button>
    </div>
  );
}
