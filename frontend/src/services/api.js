import axios from "axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Send httpOnly cookies with all API requests
axios.defaults.withCredentials = true;

// Fetch blogs
export const fetchBlogs = async ({ queryKey }) => {
  const [key, page] = queryKey;
  const { data } = await axios.get(
    `${BASE_URL}/api/events?page=${page}&limit=10`
  );
  return data;
};

// Fetch events created by user
export const fetchUserEvents = (userId) =>
  axios.get(`${BASE_URL}/api/events?userId=${userId}`).then((res) => res.data);

export const Fetchevent = (eventId) =>
  axios.get(`${BASE_URL}/api/events/${eventId}`).then((res) => res.data);

//create a new event
export const createEvent = (formData) =>
  axios
    .post(`${BASE_URL}/api/events`, formData, { withCredentials: true })
    .then((res) => res.data);

//delete event
export const deleteEvent = (eventId) =>
  axios
    .delete(`${BASE_URL}/api/events/${eventId}`, { withCredentials: true })
    .then((res) => res.data);

// Sign up a user
export const SignupData = ({ userName, email, password }) =>
  axios
    .post(
      `${BASE_URL}/api/auth/signup`,
      { userName, email, password },
      { withCredentials: true }
    )
    .then((res) => res.data);

// Log in a user
export const logindata = ({ userName, password }) =>
  axios
    .post(
      `${BASE_URL}/api/auth/login`,
      { userName, password },
      { withCredentials: true }
    )
    .then((res) => res.data);

// Sign out a user
export const signout = () =>
  axios
    .post(`${BASE_URL}/api/auth/logout`, {}, { withCredentials: true })
    .then((res) => res.data);

// Upload profile image
export const uploadImage = (formData) =>
  axios
    .post(`${BASE_URL}/api/profile/upload`, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => res.data);

// Update profile data
export const updateProfile = (profile) =>
  axios
    .put(`${BASE_URL}/api/profile`, profile, { withCredentials: true })
    .then((res) => res.data);

// Get the paneldata
export const getPanelData = () =>
  axios
    .get(`${BASE_URL}/api/profile`, { withCredentials: true })
    .then((res) => res.data);

// Scan ticket / Check-in validation
export const scanTicketCheckIn = (payload) =>
  axios
    .post(`${BASE_URL}/api/tickets/scan-ticket`, payload, { withCredentials: true })
    .then((res) => res.data);

// Fetch Event Attendance (for organizers & hosts)
export const getEventAttendance = async (eventId) => {
  return axios
    .get(`${BASE_URL}/api/tickets/attendance/${eventId}`, { withCredentials: true })
    .then((res) => res.data);
};

// Mark attendee attendance by scanning QR code
export const markEventAttendance = async ({ eventId, decodedText }) => {
  const payload = typeof decodedText === "object" ? decodedText : { qrPayload: decodedText };
  return axios
    .post(`${BASE_URL}/api/tickets/scan/${eventId}`, payload, { withCredentials: true })
    .then((res) => res.data);
};

// Fetch comments
export const commentsFetch = (blogId) =>
  axios
    .get(`${BASE_URL}/api/comment/getPostComments/${blogId}`)
    .then((res) => res.data);

// Create comment
export const createComment = (comment) =>
  axios
    .post(`${BASE_URL}/api/comment/create`, comment, { withCredentials: true })
    .then((res) => res.data);

export const getgroups = async (role = "member") => {
  return axios
    .get(`${BASE_URL}/api/group?role=${role}`)
    .then((res) => res.data);
};

export const getgroupInfo = async (groupId) => {
  return axios.get(`${BASE_URL}/api/group/${groupId}`);
};

export const fetchChat = async (groupid) => {
  return axios.get(`${BASE_URL}/api/message/${groupid}`);
};

export const request = async (data) => {
  return axios.post(`${BASE_URL}/api/group/request`, data, {
    withCredentials: true,
  });
};

export const getGroupJoinRequests = async () => {
  return axios
    .get(`${BASE_URL}/api/group/r/request`, { withCredentials: true })
    .then((res) => res.data);
};

export const approve = async (data) => {
  return axios.post(`${BASE_URL}/api/group/approve`, data, {
    withCredentials: true,
  });
};

export const updateLike = (eventId) => {
  axios.post(`${BASE_URL}/api/like/${eventId}`);
};

export const getGroupByEventId = (eventId) =>
  axios
    .get(`${BASE_URL}/api/group/byEvent/${eventId}`, { withCredentials: true })
    .then((res) => res.data);

export const getAppliedEvents = (eventId) =>
  axios
    .get(`${BASE_URL}/api/payment/${eventId}`, { withCredentials: true })
    .then((res) => res.data);

export const updateEvent = (formData, eventId) =>
  axios
    .put(`${BASE_URL}/api/events/${eventId}`, formData, {
      withCredentials: true,
    })
    .then((res) => res.data);

export const fetchRoles = () =>
  axios.get(`${BASE_URL}/api/auth/check-role`, { withCredentials: true }).then((res) => res.data);

export const sendMessage = (message, groupId) =>
  axios.post(
    `${BASE_URL}/api/message/send`,
    { message, groupId },
    { withCredentials: true }
  );
