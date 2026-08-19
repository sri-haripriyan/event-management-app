import React from "react";

const Spinner = ({ size = "md", color = "text-blue-500" }) => {
	const sizeClasses = {
		sm: "h-6 w-6",
		md: "h-8 w-8",
		lg: "h-12 w-12",
	};

	return (
		<div className="flex items-center justify-center">
			<div
				className={`animate-spin rounded-full border-[3px] border-t-transparent ${color} ${sizeClasses[size]}`}
			/>
		</div>
	);
};

export default Spinner;
