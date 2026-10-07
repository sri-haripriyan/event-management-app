import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const Layout = () => {
  return (
    <div className="w-full min-h-screen bg-surface text-on-surface flex flex-col">
      <Header />
      <main className="w-full flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
