import React, { lazy } from "react";
import { useNavigate } from "react-router-dom";
import { LuCircleArrowLeft } from "react-icons/lu";
const RequestComponent = lazy(() => import("../components/RequestComponent"));

const Request = () => {
	const navigate = useNavigate();
	return (
		<div className="min-h-screen bg-surface p-4 pt-20 text-on-surface font-poppins">
			<div
				onClick={() => navigate("/events")}
				className="flex items-center w-fit gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container px-3 py-1.5 text-on-surface cursor-pointer shadow-sm transition mb-4 text-sm font-medium"
			>
				<LuCircleArrowLeft />
				<p>Back</p>
			</div>
			<RequestComponent />
		</div>
	);
};

export default Request;
