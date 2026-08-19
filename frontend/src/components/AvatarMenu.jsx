import { useState } from "react";
import { signout } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";
import { getRandomColor } from "../utils/color";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user: info } = useAuth();

  const user = {
    name: info.userName,
    email: info.email,
    avatar: "https://i.pravatar.cc/150",
  };
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: signout,
    onSuccess: () => {
      localStorage.removeItem("user");
      navigate("/login");
    },
   
  });
  const handleLogout = () => {
    mutate(null, {
      onSuccess: () => {
        localStorage.removeItem("token");
        navigate("/login");
      },
      
    });
  };

  return (
    <div className="relative inline-block">
      <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
        <Avatar
          size={"md"}
          name={info?.userName}
          imageUrl={info?.profile_image_url}
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-fit min-w-44 bg-black shadow-lg rounded-md border border-gray-200 z-50">
          <div className="p-2 text-gray-50">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-gray-300">{user?.email}</p>
            <hr className="my-2" />
            <button
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
