import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, LogIn, RefreshCw, CheckCircle } from "lucide-react";

interface AuthPageProps {
  mode: "login" | "signup";
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { signIn, signUp, signInWithGoogle, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyMsg, setVerifyMsg] = useState(false);
  const [notVerified, setNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotVerified(false);
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        setVerifyMsg(true);
      } else {
        await signIn(email, password);
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg = err?.code || err?.message || "Something went wrong";
      if (msg.includes("email-not-verified")) {
        setNotVerified(true);
        setError("Your email is not verified yet. Please check your inbox and click the verification link.");
      } else if (msg.includes("email-already-in-use")) {
        setError("This email is already registered. Please login.");
      } else if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Incorrect email or password.");
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("too-many-requests")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (msg.includes("user-not-found")) {
        setError("No account found with this email. Please sign up.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setNotVerified(false);
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err: any) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !password) {
      setError("Please enter your email and password above to resend the verification email.");
      return;
    }
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await resendVerificationEmail(email, password);
      setResendSuccess(true);
      setError("");
    } catch (err: any) {
      const msg = err?.code || "";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Incorrect password. Please check and try resending.");
      } else {
        setError("Could not resend verification email. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  // ── Email verification sent screen ──
  if (verifyMsg) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2 dark:text-white">Check your inbox</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">
            We sent a verification link to
          </p>
          <p className="font-semibold text-gray-800 dark:text-white mb-5 text-sm">{email}</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">
            Click the link in that email to verify your account, then come back here to login.
          </p>
          <Link to="/login"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-center">
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Main auth form ──
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg max-w-md w-full">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T2</span>
            </div>
            <span className="font-bold text-lg dark:text-white">Topper 2.0</span>
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {mode === "login" ? "Continue your topper journey" : "Start your journey to become a topper"}
          </p>
        </div>

        {/* Google button */}
        <button onClick={handleGoogle} disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-4 dark:text-white disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Email not verified — resend panel */}
        {notVerified && !error.includes("password") && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-4">
            {resendSuccess ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">Verification email sent! Check your inbox.</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">Didn't receive the email?</p>
                <button onClick={handleResend} disabled={resendLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 disabled:opacity-50 transition-colors flex-shrink-0">
                  {resendLoading ? (
                    <span className="w-3.5 h-3.5 border border-amber-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Resend Email
                </button>
              </div>
            )}
          </div>
        )}

        {/* Email + password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <LogIn className="w-4 h-4" />
            }
            {mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        {/* Switch mode link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <Link to="/signup" className="text-green-600 font-medium hover:underline">Sign up free</Link>
            </>
          ) : (
            <>Already have an account?{" "}
              <Link to="/login" className="text-green-600 font-medium hover:underline">Login</Link>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
