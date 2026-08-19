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
    <div className="bg-zinc-800 rounded-lg text-sm w-full md:text-lg">
      <div className="border-b border-zinc-700 flex flex-col md:flex-row justify-between items-center p-2">
        <h5 className="font-medium p-2 ">{title}</h5>
        {title === "Moderators" && (
          <form onSubmit={handleClick} className="flex gap-2 w-5/6 md:w-2/3">
            <input
              type="email"
              className="w-full p-2 rounded-lg text-black placeholder:text-zinc-800"
              placeholder="moderator email"
              onChange={handleChange}
              value={modEmail}
            />
            <button
              className="p-2 bg-green-500 rounded-full w-10 h-10"
              disabled={loading}>
              {loading ? "..." : "+"}
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
