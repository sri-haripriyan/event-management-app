const GroupSection = ({
  title,
  users,
  fallback = "No members available",
  loading,
  handleClick,
  setModEmail,
  modEmail,
}) => {
  const handleChange = (e) => {
    setModEmail(e.target.value);
  };
  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm w-full text-on-surface my-2">
      <div className="border-b border-outline-variant/30 flex flex-col md:flex-row justify-between items-center p-3">
        <h5 className="font-semibold">{title}</h5>
        {title === "Moderators" && (
          <form onSubmit={handleClick} className="flex gap-2 w-full md:w-2/3 mt-2 md:mt-0">
            <input
              type="email"
              className="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface placeholder:text-outline text-xs outline-none"
              placeholder="moderator email"
              onChange={handleChange}
              value={modEmail}
            />
            <button
              className="p-1.5 bg-primary-container hover:bg-surface-tint text-on-primary rounded-lg text-xs font-semibold px-3 transition"
              disabled={loading}>
              {loading ? "..." : "Add"}
            </button>
          </form>
        )}
      </div>
      <div className="px-4">
        <ol className="list-decimal p-2">
          {users?.length > 0 ? (
            users?.map((user, index) => (
              <li key={index} className="p-2">
                {user?.userName} ({user?.email})
              </li>
            ))
          ) : (
            <p className="text-gray-500">{fallback}</p>
          )}
        </ol>
      </div>
    </div>
  );
};

export default GroupSection;
