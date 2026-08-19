import { useState } from "react";
import GroupSection from "./GroupSection";
import { toast } from "react-toastify";
const GroupDetails = ({ group }) => {
  const groupId = group._id;
  const [loading, setLoading] = useState(false);
  const [mods, setMods] = useState([...group.moderators]);
  const [admin, setAdmin] = useState(group.admin);
  const [members, setMembers] = useState([...group.members]);
  const [modEmail, setModEmail] = useState("");

  const handleClick = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (modEmail.trim === "") return;
    try {
      const response = await fetch("/api/group/addModerator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId,
          userId: modEmail,
        }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message);
    } catch (error) {
    } finally {
      setModEmail("");
      setModerator();
      setLoading(false);
    }
  };

  const setModerator = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/group/${groupId}`, {
        credentials: "include",
      });

      const data = await response.json();

      setMods(data?.moderators);
      setAdmin(data?.admin);
      setMembers(data?.members);
      if (!response.ok) throw new Error(data?.message);
    } catch (error) {
      toast.error()
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mt-4 space-y-4">
      <GroupSection
        title="Admin"
        users={[group?.admin]}
        groupId={group?._id}
        modEmail={modEmail}
        setModEmail={setModEmail}
        handleClick={handleClick}
        loading={loading}
      />
      <GroupSection
        title="Moderators"
        users={mods}
        groupId={group?._id}
        handleClick={handleClick}
        modEmail={modEmail}
        setModEmail={setModEmail}
        loading={loading}
        fallback="No moderators assigned"
      />
      <GroupSection
        title="Members"
        users={members}
        modEmail={modEmail}
        setModEmail={setModEmail}
        groupId={group?._id}
        handleClick={handleClick}
        loading={loading}
      />
    </div>
  );
};
export default GroupDetails;
