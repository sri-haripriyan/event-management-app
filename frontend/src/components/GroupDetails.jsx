import { useState } from "react";
import GroupSection from "./GroupSection";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth.jsx";
import { addModerator, getgroupInfo } from "../services/api";

const GroupDetails = ({ group }) => {
  const { user } = useAuth();
  const groupId = group._id;
  const [loading, setLoading] = useState(false);
  const [mods, setMods] = useState([...group.moderators]);
  const [admin, setAdmin] = useState(group.admin);
  const [members, setMembers] = useState([...group.members]);
  const [modEmail, setModEmail] = useState("");

  const currentUserId = user?._id ? String(user._id) : null;
  const groupAdminId = group?.admin?._id
    ? String(group.admin._id)
    : group?.admin
      ? String(group.admin)
      : null;
  const isGroupAdmin = Boolean(
    currentUserId && (currentUserId === groupAdminId || user?.role === "admin")
  );

  const handleClick = async (e) => {
    e.preventDefault();
    if (!isGroupAdmin) return;
    const email = modEmail.trim();
    if (!email) return;
    setLoading(true);
    try {
      const data = await addModerator({ groupId, email });
      toast.success(data?.message || "Moderator added successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to add moderator");
    } finally {
      setModEmail("");
      setModerator();
      setLoading(false);
    }
  };

  const setModerator = async () => {
    setLoading(true);
    try {
      const response = await getgroupInfo(groupId);
      const data = response?.data;
      if (data) {
        setMods(data?.moderators || []);
        setAdmin(data?.admin);
        setMembers(data?.members || []);
      }
    } catch (error) {
      console.error("Error fetching group info:", error);
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
        isAdmin={isGroupAdmin}
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
