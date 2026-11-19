import toast from "react-hot-toast";

// Enhance react-hot-toast with warn, warning, info helpers and autoClose compatibility
if (typeof toast === "function") {
  if (!toast.warn) {
    toast.warn = (message, options = {}) => {
      const { autoClose, duration, ...rest } = options;
      return toast(message, {
        icon: "⚠️",
        duration: duration || autoClose || 3500,
        ...rest,
      });
    };
  }
  if (!toast.warning) {
    toast.warning = toast.warn;
  }
  if (!toast.info) {
    toast.info = (message, options = {}) => {
      const { autoClose, duration, ...rest } = options;
      return toast(message, {
        icon: "ℹ️",
        duration: duration || autoClose || 3500,
        ...rest,
      });
    };
  }
}

export default toast;
export { toast };
