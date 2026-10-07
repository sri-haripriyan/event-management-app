import { lazy, useState } from "react";
import { ToastContainer } from "react-toastify";
import { LuCircleArrowLeft } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
const MyGroups = lazy(() => import("../components/MyGroups"));
const RequestComponent = lazy(() => import("../components/RequestComponent"));
const Profile = lazy(() => import("../components/Profile"));

const tabs = [
	{ name: "Profile", path: "/tab=profile" },
	{ name: "Groups", path: "/tab=groups" },
	{ name: "Requests", path: "/tab=requests" },
];

export default function Dashboard() {
	const [activeTab, setActiveTab] = useState(tabs[0].path);
	const navigate = useNavigate();
	return (
		<div className="w-full min-h-screen bg-surface text-on-surface font-poppins mx-auto p-4 pt-20">
			{/* Back Button */}
			<div
				onClick={() => navigate("/events")}
				className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container px-3 py-1.5 text-on-surface cursor-pointer shadow-sm transition text-sm font-medium w-fit mb-4"
			>
				<LuCircleArrowLeft />
				<p>Back</p>
			</div>
			<div className="flex justify-around items-center border-b border-outline-variant/30 py-2">
				{tabs.map((tab) => (
					<button
						key={tab?.path}
						onClick={() => setActiveTab(tab?.path)}
						className={`px-4 py-2 text-sm font-medium transition-colors
              ${
						activeTab === tab?.path
							? "text-primary-container border-b-2 border-primary-container font-semibold"
							: "text-on-surface-variant hover:text-on-surface"
					}
            `}
					>
						{tab?.name}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className="p-2 text-on-surface text-sm md:text-base select-none">
				{activeTab === "/tab=profile" && <Profile />}
				{activeTab === "/tab=groups" && <MyGroups />}
				{activeTab === "/tab=requests" && <RequestComponent />}
			</div>
			<ToastContainer />
		</div>
	);
}
