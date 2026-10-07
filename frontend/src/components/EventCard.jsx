import EventDetails from "./EventDetails";
import GroupList from "./GroupList";
const EventCard = ({ event }) => {
  return (
    <div className="rounded-2xl p-6 shadow-sm bg-surface-container-lowest border border-outline-variant/30 text-on-surface my-4">
      <EventDetails event={event} />
      <GroupList event={event} />
    </div>
  );
};

export default EventCard;
