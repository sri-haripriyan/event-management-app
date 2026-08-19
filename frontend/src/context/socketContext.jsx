import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const { user } = useAuth();

	useEffect(() => {
		if (user) {
			const socket = io(import.meta.env.VITE_BACKEND_URL, {
				query: {
					userId: user._id,
				},
			});
			console.log(`${user?.userName} is connected`);
			setSocket(socket);

			return () => socket.close();
		} else {
			if (socket) {
				socket.close();
				setSocket(null);
			}
		}
	}, [user]);

	return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};
