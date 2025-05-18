
import { NavLink } from "react-router-dom";
import { Home, AlertTriangle, Trophy, User, LogOut, Wallet, DollarSign } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Sidebar = () => {
  const { signOut } = useAuth();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/app",
      icon: <Home className="h-5 w-5" />,
      exact: true
    },
    {
      title: "Report Violation",
      path: "/app/report",
      icon: <AlertTriangle className="h-5 w-5" />
    },
    {
      title: "Leaderboard",
      path: "/app/leaderboard",
      icon: <Trophy className="h-5 w-5" />
    },
    {
      title: "Wallet",
      path: "/app/wallet",
      icon: <Wallet className="h-5 w-5" />
    },
    {
      title: "Subscription Plans",
      path: "/app/subscription",
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      title: "Profile",
      path: "/app/profile",
      icon: <User className="h-5 w-5" />
    }
  ];

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="hidden md:block md:h-screen border-r bg-background">
      <div className="flex h-full flex-col py-4">
        <div className="px-4 py-2">
          <h2 className="text-xl font-bold">SpotViolation</h2>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  } transition-all`
                }
              >
                {item.icon}
                {item.title}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t px-2 py-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
