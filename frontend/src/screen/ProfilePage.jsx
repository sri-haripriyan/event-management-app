import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { getPanelData, uploadImage, signout } from "../services/api";
import ImageCropModal from "../components/ImageCropModal";
import Spinner from "../components/Spinner";

const ProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const fileInputRef = useRef(null);

  // Filter & Sort State
  const [filterType, setFilterType] = useState("all"); // 'all' | 'paid' | 'free'
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest' | 'oldest'
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;


  // Crop Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("avatar.jpg");

  // Fetch Panel Data
  const {
    data: panelData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["profile-panel", user?._id],
    queryFn: getPanelData,
    enabled: !!user,
  });

  // Logout Mutation
  const { mutate: performLogout, isPending: isLoggingOut } = useMutation({
    mutationFn: signout,
    onSuccess: () => {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      toast.success("Signed out successfully");
      navigate("/login");
    },
    onError: () => {
      // Even if network fails, clean up local state
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
    },
  });

  const handleLogout = () => {
    performLogout();
  };

  // Image Upload Mutation
  const { mutate: performUpload, isPending: isUploading } = useMutation({
    mutationFn: uploadImage,
    onSuccess: (res) => {
      toast.success(res?.message || "Profile picture updated successfully!");
      if (res?.user) {
        setUser(res.user);
      }
      queryClient.invalidateQueries({ queryKey: ["profile-panel"] });
      setCropModalOpen(false);
      setSelectedImageSrc(null);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.message || "Failed to upload image";
      toast.error(msg);
    },
  });

  // Handle file selection from input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = "";

    // 1. Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    // 2. Validate file size (<= 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image file size must be less than 5MB.");
      return;
    }

    // 3. Validate image dimensions (min 100x100)
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.width < 100 || img.height < 100) {
        URL.revokeObjectURL(objectUrl);
        toast.error("Image dimensions too small (minimum 100x100px required).");
        return;
      }
      setSelectedImageSrc(objectUrl);
      setSelectedFileName(file.name || "avatar.jpg");
      setCropModalOpen(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error("Failed to read image file.");
    };
    img.src = objectUrl;
  };

  // Handle cropped image blob ready for upload
  const handleCropComplete = (croppedBlob) => {
    const formData = new FormData();
    formData.append("image", croppedBlob, selectedFileName || "avatar.jpg");
    performUpload(formData);
  };

  // Extract participated events from panel response
  const rawEvents = useMemo(() => {
    return panelData?.participatedEvents || [];
  }, [panelData?.participatedEvents]);

  // Filter & Sort Events
  const filteredAndSortedEvents = useMemo(() => {
    let list = [...rawEvents];

    // Filter
    if (filterType === "paid") {
      list = list.filter((e) => e.paid === true || (e.amount && e.amount > 0));
    } else if (filterType === "free") {
      list = list.filter((e) => !e.paid && (!e.amount || e.amount === 0));
    }

    // Sort by date
    list.sort((a, b) => {
      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [rawEvents, filterType, sortOrder]);

  // Pagination calculation
  const totalEvents = filteredAndSortedEvents.length;
  const totalPages = Math.ceil(totalEvents / itemsPerPage) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedEvents.slice(start, start + itemsPerPage);
  }, [filteredAndSortedEvents, currentPage, itemsPerPage]);

  // Counts for filter pills
  const allCount = rawEvents.length;
  const paidCount = rawEvents.filter((e) => e.paid === true || (e.amount && e.amount > 0)).length;
  const freeCount = rawEvents.filter((e) => !e.paid && (!e.amount || e.amount === 0)).length;

  // Active stats
  const stats = panelData?.stats || {
    attended: allCount,
    upcoming: 0,
    saved: 0,
  };

  // Helper date formatter
  const formatEventDate = (dateStr) => {
    if (!dateStr) return { day: "01", month: "JAN" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = String(dateStr).split(/[-/\s]/);
      return {
        day: parts[0] || "01",
        month: (parts[1] || "JAN").slice(0, 3).toUpperCase(),
      };
    }
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    return { day, month };
  };

  const currentUser = panelData?.user || user;
  const currentAvatar =
    currentUser?.profile_image_url ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250";

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-40 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
        <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-space-md">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-space-lg">
            <Link to="/events" className="flex items-center gap-space-sm group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-surface-tint flex items-center justify-center text-white font-headline-sm font-extrabold shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                Lumina
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-space-sm">
              <Link
                to="/events"
                className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-3 py-1.5 transition-colors rounded-lg hover:bg-surface-container"
              >
                Events
              </Link>
              <Link
                to="/events"
                className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-3 py-1.5 transition-colors rounded-lg hover:bg-surface-container"
              >
                Discover
              </Link>
              <Link
                to="/profile"
                className="transition-colors bg-primary-container text-on-primary font-label-md text-label-md rounded-lg px-3 py-1.5 shadow-sm"
              >
                My Tickets
              </Link>
              <Link
                to="/events"
                className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-3 py-1.5 transition-colors rounded-lg hover:bg-surface-container"
              >
                Schedule
              </Link>
              <Link
                to="/chats"
                className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-3 py-1.5 transition-colors rounded-lg hover:bg-surface-container"
              >
                Community
              </Link>
            </nav>
          </div>

          {/* Right Header Elements */}
          <div className="flex items-center gap-space-md">
            {/* Search Input */}
            <div className="relative hidden sm:flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-lg">
                search
              </span>
              <input
                className="w-56 md:w-64 pl-9 pr-3 py-1.5 bg-surface-container-low rounded-lg text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest transition-all border border-transparent focus:border-outline-variant"
                placeholder="Search events, spaces, organizers..."
                type="text"
              />
            </div>

            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              type="button"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            </button>

            {/* Top Avatar Circle */}
            <div className="flex items-center gap-space-sm pl-2">
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary-container/20 hover:ring-primary-container transition-all"
                title="Profile"
              >
                <img
                  alt={currentUser?.userName || "Profile"}
                  className="w-full h-full object-cover"
                  src={currentAvatar}
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-64px)] flex-1">
        <div className="max-w-7xl mx-auto w-full px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-space-lg items-start">
            
            {/* Left Column / Profile & Account Hub (380px fixed width on desktop) */}
            <aside className="w-full lg:w-[380px] shrink-0 flex flex-col gap-space-lg">
              
              {/* Profile Summary Card */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col">
                {/* Status Badges */}
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary-fixed-variant animate-pulse"></span>
                    Online Profile
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold tracking-wide">
                    PRO ATTENDEE
                  </span>
                </div>

                {/* Avatar Frame with Hover Camera Action */}
                <div className="flex flex-col items-center mt-space-md mb-space-sm text-center">
                  <div
                    className="relative group cursor-pointer"
                    title="Click to change profile picture"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-[120px] h-[120px] rounded-full p-1 bg-surface-container-high transition-transform duration-300 group-hover:scale-105 shadow-inner">
                      <img
                        alt={currentUser?.userName || "User Avatar"}
                        className="w-full h-full rounded-full object-cover shadow-sm"
                        src={currentAvatar}
                      />
                    </div>

                    {/* Camera Button Affordance */}
                    <button
                      aria-label="Upload photo"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary-container text-on-primary shadow-md flex items-center justify-center transition-all duration-200 group-hover:bg-primary-lumina group-hover:scale-110 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-lg leading-none">
                        photo_camera
                      </span>
                    </button>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                  />

                  {/* Name and Handle */}
                  <h1 className="font-headline-lg text-headline-lg text-on-surface mt-space-md tracking-tight font-bold">
                    {currentUser?.userName || "Alex Rivera"}
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                    @{currentUser?.userName ? currentUser.userName.toLowerCase() : "alexrivera.design"}
                  </p>
                  <div className="inline-flex items-center gap-1 mt-1 text-outline font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span>San Francisco, CA</span>
                  </div>
                </div>

                {/* Bio Block */}
                <div className="bg-surface-container-low/70 rounded-lg p-space-sm my-space-sm border border-outline-variant/20">
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-center">
                    UX Designer &amp; Tech Enthusiast based in SF • {stats.attended} Events Attended. Passionate about generative UI, human-centered systems, and design communities.
                  </p>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-3 gap-space-xs mt-space-sm">
                  <div className="bg-surface-container rounded-lg p-2.5 text-center flex flex-col items-center justify-center transition-colors hover:bg-surface-container-high border border-outline-variant/10">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">
                      {stats.attended}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      Attended
                    </span>
                  </div>
                  <div className="bg-surface-container rounded-lg p-2.5 text-center flex flex-col items-center justify-center transition-colors hover:bg-surface-container-high border border-outline-variant/10">
                    <span className="font-headline-md text-headline-md text-primary-container font-bold">
                      {stats.upcoming}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      Upcoming
                    </span>
                  </div>
                  <div className="bg-surface-container rounded-lg p-2.5 text-center flex flex-col items-center justify-center transition-colors hover:bg-surface-container-high border border-outline-variant/10">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">
                      {stats.saved}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      Saved
                    </span>
                  </div>
                </div>

                {/* Logout Button (Only on Profile page) */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="mt-space-lg w-full flex items-center justify-center gap-space-xs py-2.5 px-4 rounded-lg bg-surface-container-low hover:bg-error-container/20 text-on-surface-variant hover:text-error font-label-md text-label-md transition-all active:scale-[0.98] border border-outline-variant/20 disabled:opacity-50"
                  type="button"
                >
                  {isLoggingOut ? (
                    <>
                      <Spinner size="sm" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">logout</span>
                      <span>Sign Out of Lumina</span>
                    </>
                  )}
                </button>
              </div>

              {/* Account & Security Card */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Account &amp; Security
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Manage authentication and preferences.
                  </p>
                </div>

                {/* Appwrite Identity Status */}
                <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between border border-outline-variant/20">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">verified_user</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                          Appwrite Auth
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary-lumina"></span>
                      </div>
                      <p className="font-body-sm text-body-sm text-outline truncate font-mono text-[11px]">
                        ID: usr_{currentUser?._id ? String(currentUser._id).slice(-5) : "9942a"}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm uppercase font-bold tracking-wider">
                    Synced
                  </span>
                </div>

                {/* Settings Navigation Links */}
                <nav className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => toast.info("Personal details are synchronized.")}
                    className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container-low text-on-surface transition-colors w-full text-left"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary-container transition-colors text-xl">
                        person
                      </span>
                      <span className="font-body-md text-body-md font-medium">Personal Information</span>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">
                      chevron_right
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toast.info("Notification preferences enabled.")}
                    className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container-low text-on-surface transition-colors w-full text-left"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary-container transition-colors text-xl">
                        notifications
                      </span>
                      <span className="font-body-md text-body-md font-medium">Notification Preferences</span>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">
                      chevron_right
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterType("paid")}
                    className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container-low text-on-surface transition-colors w-full text-left"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary-container transition-colors text-xl">
                        confirmation_number
                      </span>
                      <span className="font-body-md text-body-md font-medium">Ticket Wallet &amp; Passes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-primary-container/15 text-primary-container font-label-sm text-label-sm font-semibold">
                        {paidCount} Active
                      </span>
                      <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">
                        chevron_right
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => toast.info("Storage sync active with Appwrite Cloud.")}
                    className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container-low text-on-surface transition-colors w-full text-left"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-outline group-hover:text-primary-container transition-colors text-xl">
                        cloud_sync
                      </span>
                      <div className="flex flex-col text-left">
                        <span className="font-body-md text-body-md font-medium">Privacy &amp; Data Sync</span>
                        <span className="font-body-sm text-body-sm text-outline text-[11px]">
                          Appwrite Cloud v1.4
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:translate-x-0.5 transition-transform text-lg">
                      chevron_right
                    </span>
                  </button>
                </nav>
              </div>
            </aside>

            {/* Right Main Column / Event Passport Timeline */}
            <div className="flex-1 w-full min-w-0 flex flex-col gap-space-md">
              
              {/* Section Header Bar */}
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-sm">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                    Participated Events
                  </h2>
                  <span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm flex items-center justify-center font-bold">
                    {allCount}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-space-sm justify-between sm:justify-end">
                  {/* Filter Pills */}
                  <div className="flex items-center p-1 rounded-lg bg-surface-container-low border border-outline-variant/20">
                    <button
                      onClick={() => {
                        setFilterType("all");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-md font-label-md text-label-md font-medium transition-all ${
                        filterType === "all"
                          ? "bg-primary-container text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      type="button"
                    >
                      All ({allCount})
                    </button>

                    <button
                      onClick={() => {
                        setFilterType("paid");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-md font-label-md text-label-md font-medium transition-all ${
                        filterType === "paid"
                          ? "bg-primary-container text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      type="button"
                    >
                      Paid ({paidCount})
                    </button>

                    <button
                      onClick={() => {
                        setFilterType("free");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-md font-label-md text-label-md font-medium transition-all ${
                        filterType === "free"
                          ? "bg-primary-container text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      type="button"
                    >
                      Free / Unpaid ({freeCount})
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors border border-outline-variant/20"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base text-outline">sort</span>
                      <span>{sortOrder === "newest" ? "Newest first" : "Oldest first"}</span>
                      <span className="material-symbols-outlined text-sm text-outline">expand_more</span>
                    </button>

                    {isSortDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-36 bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-lg py-1 z-30 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            setSortOrder("newest");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-surface-container flex items-center justify-between ${
                            sortOrder === "newest" ? "text-primary-container font-semibold" : "text-on-surface"
                          }`}
                        >
                          <span>Newest first</span>
                          {sortOrder === "newest" && (
                            <span className="material-symbols-outlined text-sm">check</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSortOrder("oldest");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-surface-container flex items-center justify-between ${
                            sortOrder === "oldest" ? "text-primary-container font-semibold" : "text-on-surface"
                          }`}
                        >
                          <span>Oldest first</span>
                          {sortOrder === "oldest" && (
                            <span className="material-symbols-outlined text-sm">check</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Event List Stack */}
              <div className="flex flex-col gap-space-md min-h-[300px]">
                {/* Loading State */}
                {isLoading && (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-surface-container-lowest rounded-xl p-space-md lg:p-space-lg shadow-sm border border-outline-variant/20 animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container-high shrink-0"></div>
                          <div className="flex flex-col gap-2">
                            <div className="w-48 h-5 bg-surface-container-high rounded"></div>
                            <div className="w-64 h-4 bg-surface-container-low rounded"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-8 bg-surface-container-low rounded-lg"></div>
                          <div className="w-20 h-8 bg-surface-container-high rounded-lg"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {isError && (
                  <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-error/20 flex flex-col items-center justify-center text-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-error">error_outline</span>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Failed to load participated events
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                      There was a problem communicating with the server. Please try refreshing your connection.
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-surface-tint font-label-md text-label-md transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">refresh</span>
                      <span>Retry</span>
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && !isError && paginatedEvents.length === 0 && (
                  <div className="bg-surface-container-lowest rounded-xl p-12 shadow-sm border border-outline-variant/30 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-outline">
                      <span className="material-symbols-outlined text-3xl">event_busy</span>
                    </div>
                    <div className="flex flex-col gap-1 max-w-sm">
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        {filterType === "all"
                          ? "No participated events yet"
                          : `No ${filterType === "paid" ? "paid" : "free"} events found`}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {filterType === "all"
                          ? "You haven't participated in any events yet. Explore upcoming summits, mixers, and workshops to start your journey."
                          : "Try adjusting your filter selection to view other event categories."}
                      </p>
                    </div>
                    <Link
                      to="/events"
                      className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-surface-tint font-label-md text-label-md font-semibold transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">explore</span>
                      <span>Explore Events</span>
                    </Link>
                  </div>
                )}

                {/* Populated Events List */}
                {!isLoading &&
                  !isError &&
                  paginatedEvents.map((event, index) => {
                    const { day, month } = formatEventDate(event.eventDate || event.createdAt);
                    const isPaid = event.paid === true || (event.amount && event.amount > 0);
                    const amountFormatted = event.amount ? `$${Number(event.amount).toFixed(2)}` : "$99.00";
                    const isVirtual = String(event.location).toLowerCase().includes("virtual") || String(event.location).toLowerCase().includes("online");

                    return (
                      <article
                        key={event._id || index}
                        className="bg-surface-container-lowest rounded-xl p-space-md lg:p-space-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-space-md"
                      >
                        {/* Left Side: Date Block & Metadata */}
                        <div className="flex items-start gap-space-md min-w-0">
                          {/* Calendar Date Block */}
                          <div
                            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm ${
                              isPaid
                                ? "bg-primary-container/10 text-primary-container"
                                : "bg-tertiary-container/15 text-tertiary"
                            }`}
                          >
                            <span className="font-headline-sm text-headline-sm font-bold leading-none">
                              {day}
                            </span>
                            <span className="font-label-sm text-label-sm font-semibold uppercase">
                              {month}
                            </span>
                          </div>

                          {/* Event Details */}
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-space-xs">
                              <h3 className="font-headline-md text-headline-md text-on-surface font-bold truncate">
                                {event.title}
                              </h3>

                              {/* Status Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                                  event.status === "Checked In"
                                    ? "bg-secondary-container/40 text-on-secondary-container"
                                    : "bg-surface-container-high text-on-surface"
                                }`}
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {event.status === "Checked In" ? "check_circle" : "done"}
                                </span>
                                {event.status || "Attended"}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 text-on-surface-variant font-body-sm text-body-sm">
                              {/* Location */}
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-base text-outline">
                                  {isVirtual ? "language" : "place"}
                                </span>
                                {event.location || (isVirtual ? "Online / Virtual" : "Moscone Center, SF")}
                              </span>

                              <span className="text-outline">•</span>

                              {/* Reference Code */}
                              <span className="font-mono text-outline font-medium">
                                {event.reference || `#LUM-${String(event._id).slice(-5).toUpperCase()}`}
                              </span>

                              <span className="text-outline">•</span>

                              {/* Price Pill */}
                              {isPaid ? (
                                <span className="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                                  Paid ({amountFormatted})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                                  Unpaid (Free RSVP)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Action Buttons */}
                        <div className="flex items-center gap-space-xs shrink-0 self-end md:self-center">
                          {isPaid ? (
                            <button
                              onClick={() => toast.info(`Invoice downloaded for #${event.reference || "LUM"}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors border border-outline-variant/20"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">receipt_long</span>
                              <span>Invoice</span>
                            </button>
                          ) : isVirtual ? (
                            <button
                              onClick={() => toast.info("Access logs are synchronized.")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors border border-outline-variant/20"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">terminal</span>
                              <span>Access Log</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => toast.info(`RSVP Pass verified for #${event.reference || "LUM"}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors border border-outline-variant/20"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-base">badge</span>
                              <span>RSVP Pass</span>
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/events/${event._id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-surface-tint font-label-md text-label-md transition-colors shadow-sm"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">rate_review</span>
                            <span>Review</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
              </div>

              {/* Pagination Bar */}
              {!isLoading && totalEvents > 0 && (
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                  <span>
                    Showing {Math.min(paginatedEvents.length, totalEvents)} of {totalEvents} attended experiences
                  </span>

                  <div className="flex items-center gap-space-xs">
                    {/* Previous Page */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1.5 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      type="button"
                      aria-label="Previous page"
                    >
                      <span className="material-symbols-outlined text-lg leading-none">chevron_left</span>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md font-label-sm text-label-sm font-bold transition-colors ${
                          currentPage === page
                            ? "bg-primary-container text-on-primary"
                            : "hover:bg-surface-container text-on-surface"
                        }`}
                        type="button"
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next Page */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="p-1.5 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      type="button"
                      aria-label="Next page"
                    >
                      <span className="material-symbols-outlined text-lg leading-none">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low py-space-xl border-t border-surface-container-high/60 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant font-body-sm text-body-sm">
          <div className="flex items-center gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Lumina Events
            </span>
            <span className="text-outline">•</span>
            <span>Connecting minds, accelerating communities.</span>
          </div>

          <div className="flex items-center gap-space-lg">
            <Link to="/events" className="hover:text-on-surface transition-colors">
              Events Directory
            </Link>
            <Link to="/about" className="hover:text-on-surface transition-colors">
              Community Guidelines
            </Link>
            <span className="text-outline">•</span>
            <span>© 2025 Lumina Inc. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Avatar Image Crop & Resize Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={selectedImageSrc}
        fileName={selectedFileName}
        onClose={() => {
          setCropModalOpen(false);
          setSelectedImageSrc(null);
        }}
        onCropComplete={handleCropComplete}
        isUploading={isUploading}
      />
    </div>
  );
};

export default ProfilePage;
