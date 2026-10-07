import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { SignupData } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.jsx";
import Spinner from "../components/Spinner.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import { toast } from "react-toastify";
import Header from "../components/Header.jsx";

const Signup = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [userName, setuserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: ({ userName, email, password }) =>
      SignupData({ userName, email, password }),
    onSuccess: (data) => {
      toast.success("Signup Successful");
      setUser(data);
      setuserName("");
      setPassword("");
      navigate("/events");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || error?.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({ userName, email, password });
    setuserName("");
    setEmail("");
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
            Join the network of elite event planners.
          </h1>
          <p className="text-on-surface-variant text-sm lg:text-base font-normal leading-relaxed max-w-lg">
            Create an account to gain full access to real-time chats, ticket payments, custom sub-event scheduling, and seamless attendance lists.
          </p>
        </div>

        {/* Right Side: Centered Signup Card */}
        <div className="w-full md:w-1/2 max-w-md">
          <div className="w-full bg-surface-container-lowest border border-outline-variant/30 p-8 sm:p-10 rounded-3xl shadow-sm">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-2">Create Account</h2>
              <p className="text-on-surface-variant text-sm font-normal">Join us to register and organize events</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label htmlFor="username" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="Choose a username"
                  value={userName}
                  maxLength={15}
                  onChange={(e) => setuserName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-3 text-on-surface outline-none transition-all duration-200 placeholder:text-outline text-sm focus:ring-1 focus:ring-primary-container/30"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-3 text-on-surface outline-none transition-all duration-200 placeholder:text-outline text-sm focus:ring-1 focus:ring-primary-container/30"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  placeholder="Choose a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container rounded-xl px-4 py-3 text-on-surface outline-none transition-all duration-200 placeholder:text-outline text-sm focus:ring-1 focus:ring-primary-container/30"
                  required
                />
              </div>

              <div className="pt-3">
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
                    Sign Up
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-on-surface-variant">
              <span>Already have an account? </span>
              <Link to="/login" className="text-primary-container hover:text-surface-tint font-semibold underline transition-colors">
                Log In
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

export default Signup;
