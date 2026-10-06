import React from "react";
import { useNavigate } from "react-router-dom";
import { getRandomColor } from "../utils/color"; // Adjust the path to your utility file

const Avatar = ({ size, name = "Guest", imageUrl, className = "", onClick, disableNavigate = false }) => {
  const navigate = useNavigate();

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "w-8 h-8 text-sm";
      case "md":
        return "w-12 h-12 text-md";
      case "lg":
        return "w-16 h-16 text-lg";
      case "xl":
        return "h-24 w-24 text-lg";
      default:
        return "w-10 h-10 text-md"; // Default size
    }
  };

  // Ensure a valid name for color generation
  const safeName = name || "Guest";
  const bgColor = getRandomColor(safeName);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (!disableNavigate) {
      navigate("/profile");
    }
  };

  return (
    <div
      onClick={handleClick}
      role={!disableNavigate || onClick ? "button" : undefined}
      tabIndex={!disableNavigate || onClick ? 0 : undefined}
      className={`flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none ${
        !disableNavigate || onClick ? "cursor-pointer transition-transform hover:scale-105 active:scale-95" : ""
      } ${getSizeClass()} ${className}`}
      style={!imageUrl ? { backgroundColor: bgColor, color: "#ffffff" } : {}}
      title={name || "Profile"}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name || "Avatar"} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-white leading-none">{safeName.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
};

export default Avatar;
