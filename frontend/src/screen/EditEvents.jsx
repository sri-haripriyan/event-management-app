import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Fetchevent } from "../services/api";
import EventForm from "../components/eventForm/EventForm";
import Spinner from "../components/Spinner";

const EditEvents = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["getevents", eventId],
    queryFn: () => Fetchevent(eventId),
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
        <Spinner size="lg" />
        <span className="text-sm text-on-surface-variant font-medium mt-3">Loading event details...</span>
      </div>
    );
  }

  if (error || !data?.event) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface font-poppins">
        <div className="w-14 h-14 rounded-2xl bg-error-container/20 text-error flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">event_busy</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
        <p className="text-sm text-on-surface-variant mb-6 text-center max-w-sm">
          The event you are trying to edit could not be found or has been removed.
        </p>
        <button
          onClick={() => navigate("/events")}
          className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary text-sm font-semibold hover:bg-surface-tint transition shadow-sm"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return <EventForm mode="edit" eventId={eventId} initialData={data.event} />;
};

export default EditEvents;
