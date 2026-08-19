import formatDate from "../utils/time";

const Metadata = ({ event }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <p>
          <span className="font-semibold">Created:</span>{" "}
          {formatDate(event?.eventDetails?.createdAt)}
        </p>
        <p>
          <span className="font-semibold">Updated:</span>{" "}
          {formatDate(event?.eventDetails?.updatedAt)}
        </p>
        {event?.eventDetails?.eventDate && (
          <p>
            <span className="font-semibold">Event Date:</span>{" "}
            {event?.eventDetails?.eventDate}
          </p>
        )}
        {event?.eventDetails?.startTime && (
          <p>
            <span className="font-semibold">Time:</span>{" "}
            {event?.eventDetails?.startTime} - {event?.eventDetails?.endTime}
          </p>
        )}
      </div>
      <div>
        <p>
          <span className="font-semibold">Status:</span>{" "}
          {event?.eventDetails?.paid ? "Paid" : "Free"}
        </p>
        {event?.eventDetails?.amount && (
          <p>
            <span className="font-semibold">Amount:</span> $
            {event?.eventDetails?.amount}
          </p>
        )}
        <p>
          <span className="font-semibold">Total Groups:</span>{" "}
          {event?.totalGroups}
        </p>
        <p>
          <span className="font-semibold">Total Members:</span>{" "}
          {event?.membersCount}
        </p>
      </div>
      
    </div>
  );
};

export default Metadata;
