
import { Outlet } from "react-router-dom";
import MobileNavbar from "./MobileNavbar";
import Sidebar from "./ui/sidebar";

const Layout = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen">
          <Outlet />
        </div>
        <MobileNavbar />
      </div>
    </div>
  );
};

export default Layout;
