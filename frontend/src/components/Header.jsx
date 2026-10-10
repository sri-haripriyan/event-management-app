import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { getPanelData } from "../services/api";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalSearchValue, setInternalSearchValue] = useState(
    searchParams.get("search") || ""
  );

  // Keep internal state updated if URL query param changes
  useEffect(() => {
    setInternalSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setInternalSearchValue(val);
    if (location.pathname === "/events") {
      if (val.trim()) {
        setSearchParams({ search: val });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = internalSearchValue.trim();
    if (location.pathname === "/events") {
      if (query) {
        setSearchParams({ search: query });
      } else {
        setSearchParams({});
      }
    } else {
      if (query) {
        navigate(`/events?search=${encodeURIComponent(query)}`);
      } else {
        navigate("/events");
      }
    }
    setMobileMenuOpen(false);
  };

  // Fetch real-time user profile data (including uploaded profile image)
  const { data: panelData } = useQuery({
    queryKey: ["profile-panel", user?._id],
    queryFn: getPanelData,
    enabled: !!user?._id,
    staleTime: 1000 * 60 * 5,
  });

  const currentUser = panelData?.user || user;
  const avatarUrl =
    currentUser?.profile_image_url ||
    user?.profile_image_url ||
    null;

  const navLinkClass = ({ isActive }) =>
    `font-label-md text-label-md px-3 py-1.5 rounded-lg transition-colors ${isActive
      ? "bg-primary-container text-on-primary font-semibold shadow-sm"
      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `font-label-md text-label-md px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${isActive
      ? "bg-primary-container text-on-primary font-semibold"
      : "text-on-surface-variant hover:bg-surface-container"
    }`;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
        <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-space-md">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-space-lg">
            <Link to="/events" className="flex items-center gap-space-sm group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-surface-tint flex items-center justify-center text-white font-headline-sm font-extrabold shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                ACN.
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-space-sm">
              <NavLink to="/events" className={navLinkClass}>
                Events
              </NavLink>
              <Link
                to="/events"
                className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-3 py-1.5 transition-colors rounded-lg hover:bg-surface-container"
              >
                Discover
              </Link>

              {/* My Tickets, Schedule, and Community are only visible when user is logged in */}
              {user && (
                <>
                  <NavLink to="/myTickets" className={navLinkClass}>
                    My Tickets
                  </NavLink>
                  <Link
                    to="/events"
                    className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-3 py-1.5 transition-colors rounded-lg hover:bg-surface-container"
                  >
                    Schedule
                  </Link>
                  <NavLink to="/chats" className={navLinkClass}>
                    Community
                  </NavLink>
                </>
              )}

              <NavLink to="/about" className={navLinkClass}>
                About
              </NavLink>
            </nav>
          </div>

          {/* Right Header Elements */}
          <div className="flex items-center gap-space-md">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-lg">
                search
              </span>
              <input
                value={internalSearchValue}
                onChange={handleSearchChange}
                className="w-56 md:w-64 pl-9 pr-3 py-1.5 bg-surface-container-low rounded-lg text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest transition-all border border-transparent focus:border-outline-variant"
                placeholder="Search events, spaces, organizers..."
                type="text"
              />
            </form>

            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              type="button"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            </button>

            {/* Top Avatar Circle or Login Button */}
            <div className="flex items-center gap-space-sm pl-2">
              {user ? (
                <Link
                  to="/profile"
                  className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary-container/20 hover:ring-primary-container transition-all flex items-center justify-center shrink-0 bg-surface-container-high"
                  title={currentUser?.userName || "Profile"}
                >
                  {avatarUrl ? (
                    <img
                      alt={currentUser?.userName || "Profile"}
                      className="w-full h-full object-cover"
                      src={avatarUrl}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-container text-white font-bold text-xs select-none">
                      {(currentUser?.userName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center font-label-md text-label-md font-semibold px-4 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-surface-tint shadow-sm transition-all active:scale-95"
                >
                  Log in
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-surface/95 backdrop-blur-xl border-b border-surface-container-high p-6 flex flex-col gap-6 lg:hidden animate-fade-in shadow-xl">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-lg">
              search
            </span>
            <input
              value={internalSearchValue}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-lg text-on-surface placeholder:text-outline font-body-sm text-body-sm active:outline-none focus:outline-none border border-outline-variant/30"
              placeholder="Search events, spaces, organizers..."
              type="text"
            />
          </form>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-2">
            <NavLink
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <span>Events</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </NavLink>
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="font-label-md text-label-md px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-between"
            >
              <span>Discover</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>

            {/* My Tickets, Schedule, and Community only visible when user is logged in */}
            {user && (
              <>
                <NavLink
                  to="/myTickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkClass}
                >
                  <span>My Tickets</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </NavLink>
                <Link
                  to="/events"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-label-md text-label-md px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-between"
                >
                  <span>Schedule</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <NavLink
                  to="/chats"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkClass}
                >
                  <span>Community</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </NavLink>
              </>
            )}

            <NavLink
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <span>About</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </NavLink>
          </nav>

          {/* User Profile or Login Link */}
          <div className="pt-4 border-t border-surface-container-high mt-auto">
            {user ? (
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary-container/20 shrink-0 flex items-center justify-center bg-surface-container-high">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={currentUser?.userName || "Profile"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-container text-white font-bold text-sm select-none">
                      {(currentUser?.userName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    {currentUser?.userName || "Profile"}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">View Profile & Tickets</span>
                </div>
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-semibold text-center block shadow-md hover:bg-surface-tint transition-all"
              >
                Log In to ACN.
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
