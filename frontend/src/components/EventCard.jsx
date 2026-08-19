import EventDetails from "./EventDetails";
import GroupList from "./GroupList";
const EventCard = ({ event }) => {
  return (
    <div className=" rounded-lg p-6 shadow-sm bg-zinc-800">
      <EventDetails event={event} />
      <GroupList event={event} />
    </div>
  );
};

export default EventCard;
