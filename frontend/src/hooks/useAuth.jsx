import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPanelData } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Clean up any legacy token key immediately
    localStorage.removeItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.token) delete parsed.token;
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Query user profile data so profile_image_url is kept up to date across the app
  const { data: panelData } = useQuery({
    queryKey: ["profile-panel", user?._id],
    queryFn: getPanelData,
    enabled: !!user?._id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (panelData?.user) {
      setUser((prev) => {
        if (!prev) return prev;
        if (
          prev.profile_image_url !== panelData.user.profile_image_url ||
          prev.userName !== panelData.user.userName ||
          prev.email !== panelData.user.email
        ) {
          return {
            ...prev,
            ...panelData.user,
          };
        }
        return prev;
      });
    }
  }, [panelData]);

  useEffect(() => {
    localStorage.removeItem("token");
    if (user) {
      const { token, ...userData } = user;
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
