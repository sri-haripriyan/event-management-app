export function formatTimeToIST(timeString) {
	const [hours, minutes, seconds] = timeString.split(":").map(Number);

	const date = new Date();
	date.setHours(hours, minutes, seconds);

	const options = {
		timeZone: "Asia/Kolkata",
		hour12: true,
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
	};

	return date.toLocaleString("en-IN", options);
}
export function convertTo12Hour(timeStr) {
	let [hours, minutes] = timeStr.split(":").map(Number);
	let period = hours >= 12 ? "PM" : "AM";
	hours = hours % 12 || 12;
	// Format the time properly
	return `${hours.toString().padStart(2, "0")}:${minutes
		.toString()
		.padStart(2, "0")} ${period}`;
}
