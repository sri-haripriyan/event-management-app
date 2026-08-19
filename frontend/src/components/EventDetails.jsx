const EventDetails = ({ event }) => {
  return (
    <div className="mb-6 ">
      <h2 className="text-2xl font-bold mb-2">{event?.eventDetails?.title}</h2>
      <p className="text-gray-400 mb-4">{event?.eventDetails?.description}</p>
    </div>
  );
};
export default EventDetails;
