import useRazorpay from "react-razorpay";

/**
 * Loads the Razorpay Checkout SDK script if not already present.
 * Resolves to true when window.Razorpay is available.
 */
export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      return resolve(true);
    }
    const existing = document.getElementById("razorpay-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export { useRazorpay };
export default loadRazorpayScript;
