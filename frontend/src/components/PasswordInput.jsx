import React, { useState } from "react";

const PasswordInput = ({
  type = "password",
  id,
  value,
  onChange,
  placeholder = "Enter your password",
  className = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative w-full">
      {/* Password Input */}
      <input
        type={showPassword ? "text" : type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`pr-10 ${className}`}
      />

      {/* Eye Icon */}
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}>
        {showPassword ? (
          // Open Eye Icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M1.5 12s3.5-7 10.5-7 10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          // Closed Eye Icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.98 8.12C2.99 9.5 1.5 12 1.5 12s3.5 7 10.5 7c2.11 0 4.06-.52 5.8-1.44M20.02 15.88C21.01 14.5 22.5 12 22.5 12s-3.5-7-10.5-7c-2.11 0-4.06.52-5.8 1.44"
            />
            <line
              x1="3"
              y1="3"
              x2="21"
              y2="21"
              stroke="currentColor"
              strokeWidth={2}
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
