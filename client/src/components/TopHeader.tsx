import { Link, useNavigate } from "react-router-dom";

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
}: TopHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-12 ${className}`}>
      <div className="flex items-center h-full px-4 gap-2">

        {showBack ? (
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors mr-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        ) : (
          <Link to="/dashboard" className="flex items-center gap-2">
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

        {rightSlot && (
          <div className="flex items-center gap-1 ml-auto">
            {rightSlot}
          </div>
        )}

      </div>
    </header>
  );
}
