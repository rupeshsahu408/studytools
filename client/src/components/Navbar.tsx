import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, LogOut, BarChart2, UserCircle, Users, Compass, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { onNotificationsSnapshot } from "../lib/firestore";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadNotifs(0); return; }
    const unsub = onNotificationsSnapshot(user.uid, setUnreadNotifs);
    return unsub;
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-40 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-14">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">T2</span>
          </div>
          <span className="font-bold text-base text-gray-900 dark:text-white">Topper 2.0</span>
        </Link>

        <div className="flex items-center gap-1">
          <button onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <>
              <Link to="/discover"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive("/discover")
                    ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                }`}
                title="Discover People">
                <Compass className="w-4 h-4" />
              </Link>

              <Link to="/community"
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive("/community")
                    ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                }`}
                title="Community">
                <Users className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                )}
              </Link>

              <Link to="/progress"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive("/progress")
                    ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                }`}
                title="My Progress">
                <BarChart2 className="w-4 h-4" />
              </Link>

              <Link to="/profile"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive("/profile")
                    ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                }`}
                title="Profile">
                <UserCircle className="w-4 h-4" />
              </Link>

              <Link to="/settings"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive("/settings")
                    ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                }`}
                title="Settings">
                <Settings className="w-4 h-4" />
              </Link>

              <button onClick={handleLogout}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Login</Link>
              <Link to="/signup" className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
