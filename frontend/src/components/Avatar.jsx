import React from "react";
import { getRandomColor } from "../utils/color"; // Adjust the path to your utility file

const Avatar = ({ size, name = "Guest", imageUrl, className = "" }) => {
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "w-8 h-8 text-sm";
      case "md":
        return "w-12 h-12 text-md";
      case "lg":
        return "w-16 h-16 text-lg"
      case "xl":
        return "h-24 w-24 text-lg";
      default:
        return "w-10 h-10 text-md"; // Default size
    }
  };

  // Ensure a valid name for color generation
  const safeName = name || "Guest";
  const bgColor = getRandomColor(safeName);

  return (
    <div
      className={`flex items-center justify-center rounded-full  overflow-hidden ${getSizeClass()} ${className}`}
      style={!imageUrl ? { backgroundColor: bgColor, color: "#fffff" } : {}}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold ">{safeName.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
};

export default Avatar;
