import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, Bell, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { onNotificationsSnapshot } from "../lib/firestore";

interface TopHeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
  className?: string;
  hideSettings?: boolean;
}

export default function TopHeader({
  title,
  showBack = false,
  backTo = "/dashboard",
  backLabel = "Back",
  rightSlot,
  className = "",
  hideSettings = false,
}: TopHeaderProps) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
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

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-12 ${className}`}>
      <div className="flex items-center h-full px-4 gap-2">

        {showBack ? (
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors mr-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        ) : (
          <Link to="/dashboard" className="flex items-center gap-2 mr-auto">
            <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white font-bold text-[10px]">T2</span>
            </div>
            {!title && (
              <span className="font-bold text-sm text-gray-900 dark:text-white">Topper 2.0</span>
            )}
          </Link>
        )}

        {title && (
          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate flex-1 text-center">
            {title}
          </span>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {rightSlot}

          {/* Settings icon */}
          {user && !hideSettings && (
            <Link
              to="/settings"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user && (
            <Link
              to="/community"
              className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </Link>
          )}

          {user && (
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
