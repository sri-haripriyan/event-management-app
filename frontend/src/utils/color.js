export const getRandomColor = (input) => {
  const colors = [
    "#FF5733", // Bright Red-Orange
    "#33FF57", // Neon Green
    "#3357FF", // Strong Blue
    "#F333FF", // Vivid Magenta
    "#FFC733", // Warm Yellow
    "#33FFFF", // Cyan Blue
    "#FF33A1", // Hot Pink
    "#8E44AD", // Purple
    "#1ABC9C", // Teal Green
    "#D35400", // Dark Orange
    "#2C3E50", // Deep Blue-Gray
    "#E67E22", // Pumpkin Orange
    "#16A085", // Dark Cyan
    "#F39C12", // Mustard Yellow
    "#3498DB", // Soft Blue
    "#C0392B", // Deep Red
    "#9B59B6", // Light Purple
    "#27AE60", // Forest Green
  ];

  const hash = Array.from(input).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );

  return colors[hash % colors.length];
};

export const colorMap = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-800",
  purple: "bg-purple-100 text-purple-800",
  gray: "bg-gray-100 text-gray-800",
};
