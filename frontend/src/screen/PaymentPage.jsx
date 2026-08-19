import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Fetchevent, getAppliedEvents, getGroupByEventId } from "../services/api.js";
import { useQuery } from "@tanstack/react-query";
import { loadRazorpayScript } from "../utils/razorpay.js";
import { TiTick } from "react-icons/ti";
import { MdOutlineArrowBackIosNew } from "react-icons/md";
import { toast } from "react-toastify";
const PaymentPage = () => {
	const params = useParams();
	const [selectedEvent, setSelectedEvent] = useState("");
	const [selectedEventName, setSelectedEventName] = useState("");
	const [pending, setPending] = useState("idle");
	const [loading, setLoading] = useState(false);
	const [dropDown, setDropDown] = useState([]);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [mobile, setMobile] = useState("");

	const navigate = useNavigate();

	const { data: eventDetails } = useQuery({
		queryKey: ["eventId", params.eventId],
		queryFn: () => Fetchevent(params.eventId),
	});

	const { data, error, isError, isPending } = useQuery({
		queryKey: ["getGroupByEventId", params.eventId],
		queryFn: () => getGroupByEventId(params.eventId),
	});

	const { data: appliedEvents, refetch: refetchAppliedEvents } = useQuery({
		queryKey: ["appliedEvents", params.eventId],
		queryFn: () => getAppliedEvents(params.eventId),
	});

	// **Filter Dropdown Options when data changes**
	useEffect(() => {
		if (data && Array.isArray(appliedEvents?.groupIds)) {
			const filteredGroups = data.filter(
				(group) => !appliedEvents.groupIds.some((applied) => applied._id === group._id)
			);
			setDropDown(filteredGroups);
			setSelectedEvent("");
			setSelectedEventName("");
		}
	}, [data, appliedEvents]);
	console.log("selectedevent: " + selectedEvent);
	console.log(appliedEvents);

	const handleChange = (e) => {
		const subEventId = e.target.value;
		const event = dropDown?.find((event) => event._id === subEventId);
		setSelectedEvent(subEventId);
		setSelectedEventName(event?.name || "");
	};

	const handlePayment = async () => {
		if (!name || !email || !mobile.match(/^\d{10}$/)) {
			alert("Please enter valid Name, Email & 10-digit Mobile Number.");
			return;
		}
		setPending("processing");
		setLoading(true);
		const isScriptLoaded = await loadRazorpayScript();
		if (!isScriptLoaded || params.eventId === undefined) {
			alert("Razorpay SDK failed to load. Are you online?");
			return;
		}
		// Step 1: Call backend to create an order
		const response = await fetch("/api/payment/create-order", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				amount: eventDetails?.event?.amount * 100, // Amount in paise (₹500)
				currency: "INR",
				receipt: "receipt#1",
				groupId: selectedEvent,
			}),
			credentials: "include",
		});
		const order = await response.json();
		if (order.error) {
			toast.error(order.message);
			console.error("Order creation failed:", order.error);
			setSelectedEvent("");
			setSelectedEventName("");
			setPending("try again");
			setLoading(false);
			return;
		}
		// Step 2: Razorpay options
		const options = {
			key: import.meta.env.VITE_RAZORPAY_KEY_ID,
			amount: order.amount,
			currency: order.currency,
			name: "SyncEventUp",
			description: "Test Transaction",
			order_id: order.id,
			prefill: {
				name: name,
				email: email,
				contact: mobile,
			},
			handler: async function (response) {
				const verifyResponse = await fetch("/api/payment/verify-payment", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						groupId: selectedEvent,
						eventId: params?.eventId,
						razorpay_order_id: response?.razorpay_order_id,
						razorpay_payment_id: response?.razorpay_payment_id,
						razorpay_signature: response?.razorpay_signature,
					}),
					credentials: "include",
				});

				const verifyResult = await verifyResponse.json();
				if (verifyResponse.status === 200) {
					alert("Payment successful!");
					// Refetch applied events after successful payment
					await refetchAppliedEvents();
					setSelectedEvent("");
					setSelectedEventName("");

					setPending("success");
				} else {
					alert("Payment verification failed: " + verifyResult?.message);
				}
				setLoading(false);
			},
			theme: {
				color: "#1E40AF",
			},
		};

		// Step 3: Open Razorpay Checkout
		const razorpay = new window.Razorpay(options);
		razorpay.open();
	};

	return (
		<div className="flex flex-col gap-5 justify-center items-center min-h-screen rounded-fullp-4 sm:p-8 relative text-sm md:text-base lg:text-lg">
			<MdOutlineArrowBackIosNew
				size={20}
				onClick={() => navigate("/events")}
				className="cursor-pointer transition-all text-gray-400 ease-in-out hover:scale-150  rounded-full absolute left-4 top-4"
			/>

			<div className=" first-line:w-5/6 md:w-1/2 flex flex-col justify-around items-center bg-zinc-900 p-4 gap-2  rounded-lg">
				<div className="w-full flex flex-col gap-2">
					<input
						type="text"
						placeholder="Enter Your Name"
						value={name}
						className="p-2 w-full text-gray-700 rounded-lg bg-white "
						onChange={(e) => setName(e.target.value)}
					/>
					<input
						type="email"
						placeholder="Enter Your Email"
						value={email}
						className="p-2 w-full text-gray-700 rounded-lg bg-white "
						onChange={(e) => setEmail(e.target.value)}
					/>
					<input
						type="tel"
						placeholder="Enter Your Mobile Number"
						value={mobile}
						required
						className="p-2 w-full text-gray-700 rounded-lg bg-white "
						onChange={(e) => setMobile(e.target.value)}
					/>
				</div>
				<div className="h-full w-full flex ">
					{dropDown?.length === 0 ? (
						<h1 className="text-white h-4/5 w-full flex gap-2 ">
							You have applied for all sub-events in this event
						</h1>
					) : (
						<select
							onChange={handleChange}
							className="w-full flex gap-2 p-2 rounded-md bg-white text-black"
							value={selectedEvent}
						>
							<option value="" className="p-2" disabled>
								Select an Event
							</option>
							{dropDown?.map((event, index) => (
								<option className="p-2" key={index} value={event?._id}>
									{event?.name}
								</option>
							))}
						</select>
					)}
				</div>

				<div className="mt-4 w-full flex flex-col gap-2">
					<h1 className="text-white text-lg">
						{!selectedEvent
							? `Please select an event for payment`
							: `Payment for ${selectedEventName}`}
					</h1>
					{!selectedEvent ? (
						<h1 className="p-2 w-full text-gray-500 rounded-lg bg-white text-center">
							{eventDetails?.event?.amount}
						</h1>
					) : (
						<button
							className={`p-2 rounded-lg w-full ${
								loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-700"
							} text-white`}
							onClick={handlePayment}
							disabled={loading}
						>
							{loading ? "Processing..." : `Pay ₹${eventDetails?.event?.amount}`}
						</button>
					)}
				</div>
			</div>
			<div className="w-full flex justify-center items-center">
				<ul className="w-5/6 md:w-1/2 flex flex-col  rounded-lg gap-2 p-2 text-white bg-gray-400">
					{appliedEvents?.groupIds &&
						appliedEvents?.groupIds?.map((event) => {
							return (
								<li
									className="flex gap-2 justify-between bg-zinc-700 p-2 rounded-lg"
									key={event?._id}
								>
									<h1>{event?.name}</h1>
									<TiTick color="green" size={20} />
								</li>
							);
						})}
				</ul>
			</div>
		</div>
	);
};

export default PaymentPage;
