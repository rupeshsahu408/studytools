import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";

const ADMIN_PASSWORD = "pastlove7890";

export default function TeliGatePage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("adm_ok") === "1") {
      navigate("/TELI/panel", { replace: true });
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("adm_ok", "1");
      navigate("/TELI/panel", { replace: true });
    } else {
      setError(true);
      setShaking(true);
      setPassword("");
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 2500);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div
        className={`w-full max-w-sm transition-all ${shaking ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
        style={shaking ? { animation: "shake 0.4s ease-in-out" } : {}}
      >
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-green-600/20 border border-green-600/30 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-green-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Restricted Access</h1>
            <p className="text-sm text-gray-500 mt-1">Enter password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
              <input
                ref={inputRef}
                type={show ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                placeholder="Password"
                autoComplete="off"
                className={`w-full bg-gray-800 border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors ${
                  error
                    ? "border-red-500 focus:border-red-400"
                    : "border-gray-700 focus:border-green-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center">Incorrect password. Try again.</p>
            )}

            <button
              type="submit"
              disabled={!password}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Access Panel
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
