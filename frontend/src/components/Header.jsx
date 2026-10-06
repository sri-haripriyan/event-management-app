import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import UserMenu from "./AvatarMenu";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchRoles, signout } from "../services/api";
import { FiSearch } from "react-icons/fi";

const Header = ({ showSearch, searchTerm, setSearchTerm }) => {
  const location = useLocation();
  const [hovered, setHovered] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, setUser } = useAuth();
  const [role, setRole] = useState("member");

  const { data } = useQuery({
    queryKey: ["role", user?.id],
    queryFn: fetchRoles,
    enabled: !!user,
  });

  useEffect(() => {
    if (data) {
      setRole(data);
    }
  }, [data]);

  const navLinks = [
    { label: "Events", href: "/events" },
    { label: "About", href: "/about" },
  ];

  if (role?.host) {
    navLinks.push({ label: "Dashboard", href: "/dashboard" });
  } else if (role?.moderator) {
    navLinks.push({ label: "Request", href: "/request" });
  }
  if (user) {
    navLinks.push({ label: "Chats", href: "/chats" });
  }
  const navigate = useNavigate();

  const { mutate } = useMutation({
    mutationFn: signout,
    onSuccess: () => {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/events");
    },
  });
  const handleLogout = () => {
    mutate();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/75 backdrop-blur-md transition-all duration-300 text-white">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center w-full">
        {/* Left Side: Brand Logo & Links */}
        <div className="flex items-center gap-12">
          <Link to="/events" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-transform duration-300 group-hover:scale-105">
              A
            </div>
            <span className="text-xl font-bold tracking-widest text-white group-hover:text-purple-400 transition-colors">ACN.E</span>
          </Link>

          {/* Desktop Navigation Links */}
          <ul className="flex items-center gap-8 max-lg:hidden">
            {navLinks.map((item) => (
              <li
                key={item?.label}
                onMouseEnter={() => setHovered(item.href)}
                onMouseLeave={() => setHovered(null)}
                className="relative py-1"
              >
                <Link
                  to={item?.href}
                  className={`text-[15px] font-medium transition-colors duration-200 ${
                    location?.pathname === item?.href ? "text-white border-b-2 border-purple-500 pb-1" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {item?.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side: Search, Notifications & Avatar */}
        <div className="flex items-center gap-4">
          {showSearch && (
            <div className="relative w-40 sm:w-56 md:w-64 max-md:hidden">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm || ""}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800/80 focus:border-purple-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none transition placeholder:text-slate-500 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            {user && (
              <button className="relative text-slate-400 hover:text-white p-1.5 max-md:hidden">
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            )}

            {user ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="text-[14px] font-medium px-4 py-1.5 border border-purple-500/30 text-purple-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white rounded-full transition duration-200"
              >
                Login
              </Link>
            )}

            {/* Mobile Burger Menu */}
            <button
              className="text-slate-300 hover:text-white p-2 text-xl hidden max-lg:block"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* Sliding Mobile Menu */}
      <div
        className={`fixed inset-0 z-50 h-screen w-screen bg-slate-950/98 backdrop-blur-lg text-white p-6 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="text-2xl font-bold absolute top-5 right-6 text-slate-400 hover:text-white"
          onClick={() => setMenuOpen(false)}
        >
          ✕
        </button>

        <div className="flex flex-col justify-center items-center h-full gap-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg">
              A
            </div>
            <span className="text-2xl font-bold tracking-widest text-white">ACN.E</span>
          </div>

          <ul className="flex flex-col items-center gap-6">
            {navLinks.map((item) => (
              <li key={item?.label} className="text-xl">
                <Link
                  to={item?.href}
                  className={`capitalize transition-colors ${
                    location?.pathname === item?.href
                      ? "text-purple-400 font-semibold"
                      : "text-slate-300 hover:text-white"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item?.label}
                </Link>
              </li>
            ))}
            {user ? (
              <li className="mt-8">
                <Link
                  to="/profile"
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium transition duration-200 inline-block shadow-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  My Profile
                </Link>
              </li>
            ) : (
              <li className="mt-6">
                <Link
                  to="/login"
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium transition duration-200 inline-block shadow-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
