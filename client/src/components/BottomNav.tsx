import { Link, useLocation } from "react-router-dom";
import { Home, Upload, Users, BarChart2, UserCircle, Compass } from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard",  icon: Home,       label: "Home"      },
  { path: "/discover",   icon: Compass,    label: "Discover"  },
  { path: "/community",  icon: Users,      label: "Community" },
  { path: "/progress",   icon: BarChart2,  label: "Progress"  },
  { path: "/profile",    icon: UserCircle, label: "Profile"   },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 safe-area-pb">
      <div className="flex items-stretch h-14">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                active
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5px]" : "stroke-2"}`} />
              <span className={`text-[10px] font-medium leading-none ${active ? "font-bold" : ""}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-green-600 dark:bg-green-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
