import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Fetchevent,
  getAppliedEvents,
  getGroupByEventId,
  getPaymentSummary,
  createPaymentOrder,
  verifyPaymentOrder,
} from "../services/api.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadRazorpayScript } from "../utils/razorpay.js";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiShield,
  FiCheckCircle,
  FiCheck,
  FiCreditCard,
  FiLock,
  FiAlertCircle,
  FiTrash2,
  FiPlus,
  FiShoppingBag,
} from "react-icons/fi";
import { TiTick } from "react-icons/ti";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth.jsx";
import Spinner from "../components/Spinner.jsx";

const PaymentPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Parse initial selected sub-events from URL query parameters or location state
  const parseInitialGroupIds = () => {
    if (Array.isArray(location.state?.selectedGroupIds) && location.state.selectedGroupIds.length > 0) {
      return location.state.selectedGroupIds;
    }
    const searchParams = new URLSearchParams(location.search);
    const fromQuery = searchParams.get("groupIds");
    if (fromQuery) {
      const ids = fromQuery
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) return ids;
    }
    const single = location.state?.groupId || searchParams.get("groupId");
    return single ? [single] : [];
  };

  const [selectedGroupIds, setSelectedGroupIds] = useState(parseInitialGroupIds);
  const [name, setName] = useState(user?.userName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mobile, setMobile] = useState(user?.phone || user?.mobile || "");
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // Sync user info when profile data loads
  useEffect(() => {
    if (user?.userName && !name) setName(user.userName);
    if (user?.email && !email) setEmail(user.email);
    if ((user?.phone || user?.mobile) && !mobile) setMobile(user?.phone || user?.mobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Query event metadata
  const { data: eventDetails } = useQuery({
    queryKey: ["eventId", params.eventId],
    queryFn: () => Fetchevent(params.eventId),
    enabled: !!params.eventId,
  });

  // Query all sub-events / groups for this event
  const { data: allGroups } = useQuery({
    queryKey: ["getGroupByEventId", params.eventId],
    queryFn: () => getGroupByEventId(params.eventId),
    enabled: !!params.eventId,
  });

  // Query already registered/paid sub-events for current user
  const {
    data: appliedEvents,
    refetch: refetchAppliedEvents,
  } = useQuery({
    queryKey: ["appliedEvents", params.eventId],
    queryFn: () => getAppliedEvents(params.eventId),
    enabled: !!params.eventId,
  });

  const appliedGroupIds = useMemo(() => {
    return Array.isArray(appliedEvents?.groupIds)
      ? appliedEvents.groupIds.map((g) => (typeof g === "object" ? g._id : g))
      : [];
  }, [appliedEvents?.groupIds]);

  // If user arrived without any pre-selection, default to first available sub-event
  useEffect(() => {
    if (selectedGroupIds.length === 0 && Array.isArray(allGroups) && allGroups.length > 0) {
      const available = allGroups.filter((g) => !appliedGroupIds.includes(g._id));
      if (available.length > 0) {
        setSelectedGroupIds([available[0]._id]);
      }
    }
  }, [allGroups, appliedGroupIds, selectedGroupIds.length]);

  // Query backend payment summary (authoritative amount calculated on server)
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
  } = useQuery({
    queryKey: ["paymentSummary", params.eventId, selectedGroupIds.slice().sort().join(",")],
    queryFn: () => getPaymentSummary({ eventId: params.eventId, groupIds: selectedGroupIds }),
    enabled: !!params.eventId && selectedGroupIds.length > 0,
  });

  const event = eventDetails?.event;
  const unitPrice = summaryData?.unitPrice ?? (Number(event?.amount) || 0);
  const totalAmount = summaryData?.totalAmount ?? unitPrice * selectedGroupIds.length;

  // Toggle selection of a sub-event
  const handleToggleSubEvent = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  // Remove a sub-event from selection
  const handleRemoveSubEvent = (groupId) => {
    setSelectedGroupIds((prev) => prev.filter((id) => id !== groupId));
  };

  // Filter groups into selected, available, and already applied
  const selectedGroups = Array.isArray(allGroups)
    ? allGroups.filter((g) => selectedGroupIds.includes(g._id))
    : [];

  const unselectedAvailableGroups = Array.isArray(allGroups)
    ? allGroups.filter((g) => !selectedGroupIds.includes(g._id) && !appliedGroupIds.includes(g._id))
    : [];

  const alreadyAppliedGroups = Array.isArray(allGroups)
    ? allGroups.filter((g) => appliedGroupIds.includes(g._id))
    : [];

  // Proceed to Razorpay checkout
  const handleProceedToPayment = async () => {
    console.log("handle clicked")
    if (!name.trim()) {
      toast.warn("Please enter your full name.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.warn("Please enter a valid email address.");
      return;
    }
    if (!mobile.trim().match(/^\d{10}$/)) {
      toast.warn("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (selectedGroupIds.length === 0) {
      toast.warn("Please select at least one sub-event to register.");
      return;
    }

    setLoading(true);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Razorpay SDK failed to load. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // Step 1: Request order creation from backend
      const order = await createPaymentOrder({
        eventId: params.eventId,
        groupIds: selectedGroupIds,
        amount: summaryData?.totalAmountInPaise || totalAmount * 100,
      });

      if (order.error || !order.id) {
        toast.error(order.message || "Failed to create payment order. Please try again.");
        setLoading(false);
        return;
      }

      // Step 2: Open Razorpay checkout options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SyncEventUp",
        description: `${event?.title || "Event"} - Registration for ${selectedGroupIds.length} sub-event(s)`,
        order_id: order.id,
        prefill: {
          name: name.trim(),
          email: email.trim(),
          contact: mobile.trim(),
        },
        handler: async (response) => {
          try {
            const verifyResult = await verifyPaymentOrder({
              groupIds: selectedGroupIds,
              eventId: params.eventId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResult?.message) {
              toast.success("Payment verified and registration confirmed!");
              setPaymentSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: totalAmount,
                enrolledCount: selectedGroupIds.length,
                subEvents: selectedGroups,
              });
              await refetchAppliedEvents();
              queryClient.invalidateQueries({ queryKey: ["appliedEvents", params.eventId] });
              queryClient.invalidateQueries({ queryKey: ["getGroupByEventId", params.eventId] });
              queryClient.invalidateQueries({ queryKey: ["paymentSummary", params.eventId] });
            }
          } catch (verifyErr) {
            console.error("Payment verification failed", verifyErr);
            toast.error(
              verifyErr?.response?.data?.message ||
              "Payment verification failed. Please contact event support."
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info("Payment was cancelled.");
          },
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Order creation failed", err);
      const errMsg =
        err?.response?.data?.message || err?.response?.data?.error || "Error initiating payment";
      toast.error(errMsg);
      setLoading(false);
    }
  };

  // Success view when payment is completed
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-surface font-poppins text-on-surface py-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <FiCheckCircle size={44} className="stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Payment Successful
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              You&apos;re Registered!
            </h1>
            <p className="text-sm text-on-surface-variant">
              Your registration for <strong className="text-on-surface">{event?.title}</strong> is confirmed.
            </p>
          </div>

          {/* Transaction Card */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 text-left space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Payment ID</span>
              <span className="font-mono font-medium text-on-surface truncate max-w-[200px]">
                {paymentSuccess.paymentId}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Total Paid</span>
              <span className="font-bold text-sm text-on-surface">
                ₹{paymentSuccess.amount}
              </span>
            </div>
            <div className="space-y-1.5 pt-1">
              <span className="text-on-surface-variant font-semibold block">
                Enrolled Sub-Events ({paymentSuccess.subEvents.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {paymentSuccess.subEvents.map((g) => (
                  <span
                    key={g._id}
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 border border-emerald-500/20"
                  >
                    <TiTick size={14} />
                    <span>{g.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/my-tickets")}
              className="flex-1 py-3 rounded-xl bg-primary-container hover:bg-surface-tint text-on-primary font-semibold text-sm shadow-md shadow-primary-container/20 transition active:scale-[0.99]"
            >
              View My Tickets
            </button>
            <button
              onClick={() => navigate(`/events/${params.eventId}`)}
              className="flex-1 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-sm border border-outline-variant/30 transition"
            >
              Back to Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-poppins text-on-surface pb-16 pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-outline-variant/30">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-on-surface transition"
        >
          <div className="w-8 h-8 rounded-full bg-surface-container-low border border-outline-variant/30 flex items-center justify-center group-hover:scale-105 transition">
            <FiArrowLeft size={16} />
          </div>
          <span>Back to Event</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <FiShield size={14} />
          <span>SSL 256-bit Secure Checkout</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Event details, Verified Sub-Events list & Attendee Info (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Event Mini Banner */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center gap-5">
            {event?.imageUrl && (
              <div className="w-full sm:w-32 h-28 rounded-2xl overflow-hidden shrink-0 border border-outline-variant/20 shadow-inner">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}
            <div className="space-y-2 min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-container bg-primary-container/10 px-2.5 py-0.5 rounded-full border border-primary-container/20">
                Event Registration
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface truncate">
                {event?.title || "Loading Event Details..."}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                {event?.eventDate && (
                  <span className="flex items-center gap-1">
                    <FiCalendar className="text-primary-container" size={13} />
                    <span>{event.eventDate}</span>
                  </span>
                )}
                {event?.startTime && (
                  <span className="flex items-center gap-1">
                    <FiClock className="text-primary-container" size={13} />
                    <span>
                      {event.startTime} - {event.endTime}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Sub-Events Verification List (The core requirement) */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                  <FiShoppingBag className="text-primary-container" />
                  <span>Verified Sub-Events ({selectedGroupIds.length})</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Verify the sub-events selected from the event page. You can review, add, or remove tracks.
                </p>
              </div>

              {selectedGroupIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedGroupIds([])}
                  className="text-xs font-semibold text-rose-500 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* List of currently selected sub-events */}
            {selectedGroups.length > 0 ? (
              <div className="space-y-3">
                {selectedGroups.map((group) => {
                  const summaryItem = summaryData?.items?.find((i) => i._id === group._id);
                  const isFull = summaryItem?.isLimitReached;
                  const itemPrice = summaryItem?.amount ?? unitPrice;

                  return (
                    <div
                      key={group._id}
                      className="p-4 rounded-2xl bg-surface-container-low border border-primary-container/30 flex items-center justify-between gap-3 shadow-sm transition hover:border-primary-container/60"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center shrink-0 shadow-sm font-bold">
                          <FiCheck size={16} className="stroke-[3]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-on-surface truncate">
                              {group.name}
                            </h3>
                            <span className="text-[10px] font-semibold bg-primary-container/10 text-primary-container px-2 py-0.5 rounded-full border border-primary-container/20 shrink-0">
                              Verified
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant">
                            {group.limit && (
                              <span className="text-[11px] bg-surface-container px-2 py-0.5 rounded-md">
                                Capacity: {summaryItem?.membersCount ?? group.membersCount ?? 0}/{group.limit}
                              </span>
                            )}
                            {isFull && (
                              <span className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                                <FiAlertCircle size={12} /> Limit Reached
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-on-surface-variant block">Price</span>
                          <span className="text-sm font-bold text-on-surface">
                            ₹{itemPrice}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubEvent(group._id)}
                          className="w-8 h-8 rounded-xl bg-surface-container hover:bg-rose-500/10 hover:text-rose-500 text-on-surface-variant/70 flex items-center justify-center transition"
                          title="Remove from checkout"
                          aria-label="Remove sub-event"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/40 text-center space-y-2">
                <FiAlertCircle className="mx-auto text-amber-500" size={26} />
                <h3 className="text-sm font-bold text-on-surface">No Sub-Events Selected</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  Please select one or more available sub-events below or return to the event page to choose your tracks.
                </p>
              </div>
            )}

            {/* Available sub-events that can be added */}
            {unselectedAvailableGroups.length > 0 && (
              <div className="pt-4 border-t border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                    Add More Available Tracks ({unselectedAvailableGroups.length})
                  </h4>
                  <span className="text-[11px] text-on-surface-variant/70">
                    Click to add to your order
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {unselectedAvailableGroups.map((group) => (
                    <button
                      key={group._id}
                      type="button"
                      onClick={() => handleToggleSubEvent(group._id)}
                      className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary-container/40 text-left transition flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs text-on-surface truncate group-hover:text-primary-container transition">
                          {group.name}
                        </div>
                        <span className="text-[11px] text-on-surface-variant">
                          ₹{unitPrice}
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-surface-container-high group-hover:bg-primary-container group-hover:text-on-primary text-on-surface-variant flex items-center justify-center transition shrink-0">
                        <FiPlus size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Already enrolled sub-events */}
            {alreadyAppliedGroups.length > 0 && (
              <div className="pt-4 border-t border-outline-variant/20 space-y-2.5">
                <h4 className="text-xs uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <TiTick size={16} />
                  <span>Already Enrolled in this Event ({alreadyAppliedGroups.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {alreadyAppliedGroups.map((group) => (
                    <span
                      key={group._id}
                      className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-1 rounded-xl font-medium flex items-center gap-1.5 border border-emerald-500/20"
                    >
                      <TiTick size={14} />
                      <span>{group.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Attendee Contact Details Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-outline-variant/20">
              <h2 className="text-base sm:text-lg font-bold text-on-surface">
                Attendee Contact Information
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Payment confirmation receipt and QR check-in tickets will be delivered to these details.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary-container focus:ring-1 focus:ring-primary-container/30 outline-none text-on-surface transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. attendee@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary-container focus:ring-1 focus:ring-primary-container/30 outline-none text-on-surface transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Mobile Number (10 digits) *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-outline-variant/40 bg-surface-container text-xs font-semibold text-on-surface-variant">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    className="w-full p-3 text-sm rounded-r-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary-container focus:ring-1 focus:ring-primary-container/30 outline-none text-on-surface transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Card (5 cols on desktop, sticky) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="pb-4 border-b border-outline-variant/30">
              <span className="text-xs uppercase tracking-wider font-bold text-on-surface-variant block mb-1">
                Order Summary
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-on-surface">
                  Payment Details
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Backend Verified
                </span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Price per Sub-Event:</span>
                <span className="font-semibold text-on-surface">
                  ₹{unitPrice}
                </span>
              </div>

              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Selected Sub-Events:</span>
                <span className="font-semibold text-on-surface">
                  × {selectedGroupIds.length}
                </span>
              </div>

              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Platform Processing Fee:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  FREE
                </span>
              </div>

              <div className="flex justify-between items-center text-on-surface-variant">
                <span>GST &amp; Taxes:</span>
                <span className="font-medium text-xs text-on-surface-variant/80">
                  Included
                </span>
              </div>

              <div className="pt-3 border-t border-outline-variant/30 flex justify-between items-baseline">
                <div>
                  <span className="text-base font-bold text-on-surface block">
                    Total Amount
                  </span>
                  <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                    <FiCheckCircle className="text-emerald-500" size={12} />
                    <span>Calculated by backend API</span>
                  </span>
                </div>
                <div className="text-right">
                  {isSummaryLoading || isSummaryFetching ? (
                    <div className="flex items-center gap-2 text-primary-container">
                      <Spinner size="sm" />
                      <span className="text-xs font-semibold">Updating...</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-extrabold text-on-surface text-primary-container">
                      ₹{totalAmount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Security and Razorpay Badge */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                <FiLock className="text-primary-container" size={15} />
                <span>Trusted Razorpay Gateway</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Supports UPI (Google Pay, PhonePe, Paytm), Credit / Debit Cards, NetBanking, and Wallets.
              </p>
            </div>

            {/* Proceed to Razorpay Button */}
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={loading || selectedGroupIds.length === 0 || isSummaryLoading}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${loading || selectedGroupIds.length === 0 || isSummaryLoading
                ? "bg-surface-container-high text-on-surface-variant/60 cursor-not-allowed border border-outline-variant/30"
                : "bg-gradient-to-r from-purple-600 via-indigo-600 to-primary-container hover:from-purple-500 hover:to-indigo-500 text-white shadow-indigo-900/25 active:scale-[0.99] cursor-pointer"
                }`}
            >
              {loading ? (
                <>
                  <Spinner size="sm" color="text-white" />
                  <span>Connecting to Razorpay...</span>
                </>
              ) : selectedGroupIds.length === 0 ? (
                <span>Select Sub-Events to Pay</span>
              ) : (
                <>
                  <FiCreditCard size={18} />
                  <span>Proceed to Pay ₹{totalAmount}</span>
                </>
              )}
            </button>

            <div className="text-center">
              <span className="text-[11px] text-on-surface-variant/70">
                By clicking proceed, you agree to the event admission and registration terms.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
