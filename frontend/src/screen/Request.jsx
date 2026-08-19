import React, { lazy } from "react";
import { useNavigate } from "react-router-dom";
import { LuCircleArrowLeft } from "react-icons/lu";
const RequestComponent = lazy(() => import("../components/RequestComponent"));

const Request = () => {
	const navigate = useNavigate();
	return (
		<div>
			<div
				onClick={() => navigate("/events")}
				className="flex items-center w-fit gap-2 rounded-md border-2 border-gray-500 hover:bg-gray-600 px-2 py-1 text-white cursor-pointer"
			>
				<LuCircleArrowLeft />
				<p>Back</p>
			</div>
			<RequestComponent />
		</div>
	);
};

export default Request;
