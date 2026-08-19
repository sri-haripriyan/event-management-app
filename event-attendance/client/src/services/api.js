import axios from "axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const getAttendances = async (eventId) => {
	return axios.get(`${BASE_URL}/attendance/${eventId}`).then((res) => res.data);
};
export const checkAttendance = async ({ eventId, decodedText }) => {
	const response = await axios.post(`${BASE_URL}/attendance/scan/${eventId}`, decodedText);
	return response.data;
};
