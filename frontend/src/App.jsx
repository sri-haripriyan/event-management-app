import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy } from "react";
import Spinner from "./components/Spinner";
const Events = lazy(() => import("./screen/Events"));
const Event = lazy(() => import("./screen/Event"));
const Login = lazy(() => import("./screen/Login"));
const Signup = lazy(() => import("./screen/Signup"));
const Group = lazy(() => import("./screen/Group"));
const GetStarted = lazy(() => import("./screen/GetStarted"));
const Dashboard = lazy(() => import("./screen/Dashboard"));
const CreateEvents = lazy(() => import("./screen/CreateEvents"));
const PaymentPage = lazy(() => import("./screen/PaymentPage"));
const EditEvents = lazy(() => import("./screen/EditEvents"));
const Request = lazy(() => import("./screen/Request"));
const About = lazy(() => import("./screen/About"));
const ProfilePage = lazy(() => import("./screen/ProfilePage"));

const App = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen">
          <Spinner />
        </div>
      }
    >
      <Router>
        <div className="w-full min-h-screen bg-slate-950 mx-auto">
          <Routes>
            <Route path="/" element={<GetStarted />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventId" element={<Event />} />
            <Route path="/chats" element={<Group />} />
            <Route path="/create-events" element={<CreateEvents />} />
            <Route path="/updateEvent/:eventId" element={<EditEvents />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/request" element={<Request />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/payments/:eventId" element={<PaymentPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </div>
      </Router>
    </Suspense>
  );
};

export default App;
