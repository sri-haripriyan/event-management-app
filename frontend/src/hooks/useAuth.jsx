import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRoles } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("token");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("token", JSON.stringify(user));
    } else {
      localStorage.removeItem("token");
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
