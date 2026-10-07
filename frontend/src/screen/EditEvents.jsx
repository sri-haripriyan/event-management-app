import { useRef, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Fetchevent, updateEvent } from "../services/api";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNavigate, useParams } from "react-router-dom";

const EditEvents = () => {
  const { user } = useAuth();
  const { eventId } = useParams();
  const imageRef = useRef();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

  // Fetch event data
  const { data } = useQuery({
    queryKey: ["getevents", eventId],
    queryFn: () => Fetchevent(eventId),
  });

  // Initialize state based on fetched data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    swags: false,
    refreshments: false,
  });

  useEffect(() => {
    if (data?.event) {
      setFormData({
        title: data?.event?.title || "",
        description: data?.event?.description || "",
        imageUrl: data?.event?.imageUrl || "",
        swags: data?.event?.swags || false,
        refreshments: data?.event?.refreshments || false,
      });
    }
  }, [data, user]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value === "on" ? !prev[name] : value,
    }));
  };

  // Handle file change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedFormData = { ...formData };

    if (file) {
      updatedFormData.file = file;
    }
    const data = new FormData();
    data.append("title", formData?.title);
    data.append("description", formData?.description);
    data.append("file", file);
    data.append("swags", formData?.swags);
    data.append("refreshments", formData?.refreshments);
    mutate(data);
    navigate("/events");
  };

  // Mutation for updating event
  const { isLoading, mutate } = useMutation({
    mutationFn: (formData) => updateEvent(formData, eventId),
  });

  return (
    <div className="flex justify-center items-center min-h-screen p-6 sm:p-8 bg-surface text-on-surface font-poppins text-sm md:text-base">
      <div className="bg-surface-container-lowest border border-outline-variant/30 shadow-sm p-6 sm:p-8 rounded-3xl w-full max-w-2xl flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full gap-5">
          <h2 className="text-xl font-bold text-on-surface border-b border-outline-variant/30 pb-2">
            Edit Event Details
          </h2>

          {/* Event Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Event Name</label>
            <input
              type="text"
              name="title"
              className="w-full px-4 py-2.5 border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-container/30 focus:border-primary-container bg-surface-container-low text-on-surface placeholder:text-outline text-sm"
              placeholder="Enter event name"
              value={formData?.title}
              onChange={handleChange}
            />
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Description</label>
            <textarea
              name="description"
              className="w-full px-4 py-2.5 border border-outline-variant/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-container/30 focus:border-primary-container bg-surface-container-low text-on-surface placeholder:text-outline text-sm min-h-[90px] resize-none"
              placeholder="Description"
              value={formData?.description}
              onChange={handleChange}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider pl-1">Update Poster Image</label>
            <input
              className="w-full px-4 py-2 border border-outline-variant/40 rounded-xl focus:outline-none bg-surface-container-low text-on-surface-variant text-xs cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-container/10 file:text-primary-container"
              type="file"
              ref={imageRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="flex flex-col gap-4 text-sm text-on-surface">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Refreshments And Swags</h3>
            <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low flex flex-col gap-3">
              {/* Refreshments Toggle Switch */}
              <label className="relative inline-flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-on-surface">
                  Refreshments Included
                </span>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  id="refreshments"
                  checked={formData?.refreshments}
                  onChange={(e) =>
                    handleCheckboxChange("refreshments", e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:bg-primary-container after:absolute after:top-1 after:right-5 peer-checked:after:translate-x-4 after:bg-white after:border-0 after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>

              {/* Swags Toggle Switch */}
              <label className="relative inline-flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-on-surface">
                  Swags Included
                </span>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  id="swags"
                  checked={formData?.swags}
                  onChange={(e) =>
                    handleCheckboxChange("swags", e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:bg-primary-container after:absolute after:top-1 after:right-5 peer-checked:after:translate-x-4 after:bg-white after:border-0 after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>

            <div className="pt-2">
              <button
                className="w-full bg-primary-container hover:bg-surface-tint text-on-primary font-medium py-3 rounded-xl transition duration-200 shadow-md shadow-primary-container/20 active:scale-[0.98]"
                disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvents;
