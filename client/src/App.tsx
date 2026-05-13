import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { registerServiceWorker } from "./lib/push";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProgressProvider } from "./contexts/ProgressContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import ChapterPage from "./pages/ChapterPage";
import ProfilePage from "./pages/ProfilePage";
import ProgressPage from "./pages/ProgressPage";
import CommunityPage from "./pages/CommunityPage";
import SharePage from "./pages/SharePage";
import UsernameSetupPage from "./pages/UsernameSetupPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import DiscoverPage from "./pages/DiscoverPage";
import SettingsPage from "./pages/SettingsPage";
import PublicNotesPage from "./pages/PublicNotesPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import BlogPage from "./pages/BlogPage";

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasUsername } = useAuth();
  const location = useLocation();
  if (loading || (user && hasUsername === null)) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (hasUsername === false && location.pathname !== "/setup") {
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
}

function SetupRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasUsername } = useAuth();
  if (loading || (user && hasUsername === null)) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (hasUsername === true) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><AuthPage mode="signup" /></PublicRoute>} />
      <Route path="/setup" element={<SetupRoute><UsernameSetupPage /></SetupRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
      <Route path="/chapter/:id" element={<ProtectedRoute><ChapterPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/public-notes" element={<ProtectedRoute><PublicNotesPage /></ProtectedRoute>} />
      <Route path="/u/:username" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
      <Route path="/share/:token" element={<SharePage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();
  if (!user) return <AppRoutes />;
  return (
    <ProgressProvider>
      <AppRoutes />
    </ProgressProvider>
  );
}

export default function App() {
  useEffect(() => {
    registerServiceWorker().catch(console.warn);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthenticatedApp />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
