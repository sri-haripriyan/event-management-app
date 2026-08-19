export function formatTimestamp(isoTimestamp) {
  const date = new Date(isoTimestamp);

  // Extract individual components
  const day = String(date.getDate()).padStart(2, "0"); // Ensure two digits for day
  const month = date.toLocaleString("en-US", { month: "short" }); // Get short month
  const year = date.getFullYear(); // Get full year
  const hours = String(date.getHours()).padStart(2, "0"); // Ensure two digits for hours
  const minutes = String(date.getMinutes()).padStart(2, "0"); // Ensure two digits for minutes

  // Return formatted string
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

export default function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
