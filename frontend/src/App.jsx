import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Spinner from "./components/Spinner";
import Layout from "./layout/Layout";

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
        <div className="w-full h-screen bg-surface flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <Router>
        <div className="w-full min-h-screen bg-surface text-on-surface mx-auto">
          <Routes>
            <Route element={<Layout />}>
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
            </Route>
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface font-poppins">
                  <h1 className="text-4xl font-extrabold mb-2">404</h1>
                  <p className="text-on-surface-variant font-medium">Page Not Found</p>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </Suspense>
  );
};

export default App;
