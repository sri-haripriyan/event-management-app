import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
	return (
		<div className="text-center pt-1 flex flex-col gap-3 items-center">
			<h1>Home</h1>
			<Link
				className="bg-blue-500 px-2 py-1 text-white rounded-md w-fit"
				to={"/events/1234567/attendance/eventName"}
			>
				Go to attendance
			</Link>
		</div>
	);
};

export default Home;
