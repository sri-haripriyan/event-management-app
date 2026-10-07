import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { logindata } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import Header from "../components/Header.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { mutate, isPending } = useMutation({
    mutationFn: ({ userName, password }) => logindata({ userName, password }),
    onSuccess: (data) => {
      toast.success("Login Successful");
      setUser(data);
      setuserName("");
      setPassword("");
      navigate("/events");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error.message);
    },
  });
  const [userName, setuserName] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({ userName, password });
    setuserName("");
    setPassword("");
  };

  return (
    <div className="relative min-h-screen bg-surface flex flex-col justify-between overflow-hidden font-poppins text-on-surface">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <Header />

      {/* Center Layout Wrapper */}
      <div className="z-10 w-full max-w-6xl mx-auto px-6 pt-24 pb-12 flex flex-col md:flex-row justify-center items-center gap-12 sm:gap-16 flex-1 animate-fade-in">
        {/* Left Side: Slogan Copy (Visible on desktop & tablet only) */}
        <div className="hidden md:flex flex-col gap-6 md:w-1/2 text-left z-10">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-on-surface leading-tight tracking-tight">
            Unlock your potential, take the first step toward greatness.
          </h1>
          <p className="text-on-surface-variant text-sm lg:text-base font-normal leading-relaxed max-w-lg">
            Manage, discover, and organize elite corporate and community events. Connect and build groups with professionals around the globe.
          </p>
        </div>

        {/* Right Side: Centered Login Card */}
        <div className="w-full md:w-1/2 max-w-md">
          <div className="w-full bg-surface-container-lowest border border-outline-variant/30 p-8 sm:p-10 rounded-3xl shadow-sm">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-2">Welcome Back</h2>
              <p className="text-on-surface-variant text-sm font-normal">Please sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={userName}
                  onChange={(e) => setuserName(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-3 text-on-surface outline-none transition-all duration-200 placeholder:text-outline text-sm focus:ring-1 focus:ring-primary-container/30"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-3 text-on-surface outline-none transition-all duration-200 placeholder:text-outline text-sm focus:ring-1 focus:ring-primary-container/30"
                  required
                />
              </div>

              <div className="pt-2">
                {isPending ? (
                  <div className="w-full bg-surface-container-low border border-outline-variant/40 h-12 flex justify-center items-center rounded-xl">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-primary-container hover:bg-surface-tint text-on-primary font-medium py-3 rounded-xl transition duration-300 shadow-md shadow-primary-container/20 active:scale-[0.98]"
                    disabled={isPending}
                  >
                    Sign In
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-on-surface-variant">
              <span>Don&apos;t have an account? </span>
              <Link to="/signup" className="text-primary-container hover:text-surface-tint font-semibold underline transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Block */}
      <footer className="w-full border-t border-outline-variant/20 py-8 px-8 sm:px-12 z-10 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-[13px] text-on-surface-variant font-normal">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="font-bold text-on-surface text-base tracking-wider leading-none mb-1">ACN.</span>
            <span className="text-on-surface-variant/70 text-xs">© {new Date().getFullYear()} ACN. Global Events. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-on-surface-variant">
            <a href="#" className="hover:text-on-surface transition">Terms</a>
            <a href="#" className="hover:text-on-surface transition">Privacy</a>
            <a href="#" className="hover:text-on-surface transition">Support</a>
            <a href="#" className="hover:text-on-surface transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
