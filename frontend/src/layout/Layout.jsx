import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Layout = () => {
  const location = useLocation();
  const isChatRoute =
    location.pathname.startsWith("/chats") ||
    location.pathname.startsWith("/community");

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface flex flex-col font-poppins">
      <Header />
      <main className="w-full flex-1 flex flex-col">
        <Outlet />
      </main>
      {!isChatRoute && <Footer />}
    </div>
  );
};

export default Layout;
