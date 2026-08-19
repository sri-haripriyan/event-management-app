import { colorMap } from "../utils/color";

const Tags = ({ title, tags, color = "gray" }) => {
  const colorClass = colorMap[color] || colorMap["gray"]; // Default to gray if color not found

  return (
    <div className="mb-4">
      <p className="font-semibold mb-2">{title}:</p>
      <div className="flex flex-wrap gap-2">
        {tags?.map((tag, index) => (
          <span
            key={index}
            className={`px-3 py-1 rounded-full text-sm ${colorClass}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Tags;
