import GroupCard from "./GroupCard";
const GroupList = ({ event }) => {
  return (
    <div className="space-y-4">
      {event.groups.map((group) => (
        <GroupCard key={group?._id} group={group} eventId={event?._id} />
      ))}
    </div>
  );
};
export default GroupList;
