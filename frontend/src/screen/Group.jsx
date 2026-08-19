import React, { lazy, Suspense, useState } from "react";
import Spinner from "../components/Spinner";

const GroupSidebar = lazy(() => import("../components/GroupSidebar"));
const GroupChatSection = lazy(() => import("../components/GroupChatSection"));
const GroupEmptyView = lazy(() => import("../components/GroupEmptyView"));

const GroupV1 = () => {
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	return (
		<div className="flex p-2 w-full h-screen gap-2">
			<Suspense
				fallback={
					<div className="w-full h-screen flex items-center justify-center">
						<Spinner />
					</div>
				}
			>
				<GroupSidebar
					selectedGroup={selectedGroup}
					setSelectedGroup={setSelectedGroup}
					isSidebarOpen={isSidebarOpen}
					toggleSidebar={toggleSidebar}
				/>
			</Suspense>
			<Suspense
				fallback={
					<div className="w-full h-screen flex items-center justify-center">
						<Spinner />
					</div>
				}
			>
				{selectedGroup ? (
					<GroupChatSection selectedGroup={selectedGroup} toggleSidebar={toggleSidebar} />
				) : (
					<GroupEmptyView toggleSidebar={toggleSidebar} />
				)}
			</Suspense>
		</div>
	);
};

export default GroupV1;
