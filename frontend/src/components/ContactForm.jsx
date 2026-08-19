import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import Spinner from "./Spinner.jsx";
import { toast } from "react-toastify";
const ContactForm = () => {
	const [from_name, setFromName] = useState("");
	const [from_email, setFromEmail] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const sendEmail = (e) => {
		e.preventDefault();
		if (!from_name.trim() || !from_email.trim() || !message.trim()) {
			toast.info("Please fill all details");
			return;
		}
		setLoading(true);
		emailjs
			.send(
				import.meta.env.VITE_EMAIL_SERVICE_ID,
				import.meta.env.VITE_EMAIL_TEMPLATE_ID,
				{
					to_name: "Alcognerd",
					from_name: from_name,
					from_email: from_email,
					message: message,
					reply_to: from_email,
				},
				{
					publicKey: import.meta.env.VITE_EMAIL_PUBLIC_KEY,
				}
			)
			.then(
				() => {
					toast.success("Email sent");
					console.log("SUCCESS!");
				},
				(error) => {
					toast.error("Unable to send email. Please try again later");
					console.log("FAILED...", error);
				}
			);
		setFromName("");
		setFromEmail("");
		setMessage("");
		setLoading(false);
	};
  return (
    <div className="w-full max-w-sm bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-md">
      <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 pb-2 border-b border-slate-800">
        📧 Email Support
      </h3>
      <form onSubmit={sendEmail} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
            Name
          </label>
          <input
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-white outline-none transition text-sm focus:ring-1 focus:ring-purple-500/30"
            type="text"
            name="from_name"
            id="name"
            placeholder="Your name"
            value={from_name}
            onChange={(e) => setFromName(e.target.value)}
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
            Email Address
          </label>
          <input
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-white outline-none transition text-sm focus:ring-1 focus:ring-purple-500/30"
            type="email"
            name="from_email"
            id="email"
            placeholder="me@example.com"
            value={from_email}
            onChange={(e) => setFromEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1" htmlFor="message">
            Message
          </label>
          <textarea
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-white outline-none transition text-sm focus:ring-1 focus:ring-purple-500/30 h-24 resize-none"
            name="message"
            id="message"
            placeholder="Your feedback or support query..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-xl transition duration-200 shadow-md shadow-purple-950/20 active:scale-[0.98] flex justify-center items-center h-10"
          >
            {loading ? <Spinner size="sm" /> : "Send Message"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
