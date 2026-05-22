import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

export default function AdminPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("adm_ok") !== "1") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center">
          <Shield className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Topper 2.0 — Admin Panel</h1>
          <p className="text-xs text-gray-500">Internal use only</p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <p className="text-gray-500 text-sm">Admin panel is ready. More sections coming soon.</p>
      </main>
    </div>
  );
}
