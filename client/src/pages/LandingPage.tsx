import { Link } from "react-router-dom";
import { BookOpen, Zap, Brain, BarChart2, ArrowRight, Sparkles } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Smart Notes", desc: "AI generates complete, structured notes from any NCERT chapter instantly." },
  { icon: Zap, title: "Question Bank", desc: "MCQ, 1-mark, 2-mark, 5-mark, Assertion-Reason — all question types auto-generated." },
  { icon: Brain, title: "Practice Modes", desc: "Practice at your pace or take timed tests just like real board exams." },
  { icon: BarChart2, title: "All Subjects", desc: "Physics, Chemistry, Mathematics, Biology — Class 11 & 12 NCERT covered." },
];

const steps = [
  { num: "01", title: "Upload or Browse", desc: "Upload your own PDF or pick any NCERT chapter from our built-in library." },
  { num: "02", title: "AI Processes It", desc: "Our AI reads the chapter and generates everything you need to become a topper." },
  { num: "03", title: "Study Smart", desc: "Use notes, practice questions, and test yourself — all in one place." },
];

const stats = [
  { value: "11+", label: "Study Tools" },
  { value: "4", label: "Subjects" },
  { value: "Class 11 & 12", label: "Bihar Board" },
  { value: "AI", label: "Powered" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">T2</span>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Topper 2.0</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              Login
            </Link>
            <Link to="/signup" className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-36 pb-24 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8 border border-green-200 dark:border-green-800/50">
          <Sparkles className="w-3 h-3" />
          Made exclusively for Bihar Board Students
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6 text-gray-900 dark:text-white">
          From Beginner<br className="hidden sm:block" /> to{" "}
          <span className="text-green-600 dark:text-green-400">Topper</span>
          <br className="hidden sm:block" />
          <span className="text-4xl md:text-5xl font-bold text-gray-500 dark:text-gray-400">Powered by AI</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload any NCERT chapter. Get complete notes, a full question bank,
          and everything you need to ace Class 11 &amp; 12 board exams.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-md text-base">
            Start Studying Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 text-gray-700 dark:text-gray-300 font-semibold px-8 py-4 rounded-xl transition-colors text-base">
            Already a student? Login
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {stats.map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 text-center">
              <div className="text-xl font-black text-green-600 dark:text-green-400">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 tracking-widest uppercase mb-2">Everything you need</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">A Topper's Complete Toolkit</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 tracking-widest uppercase mb-2">Simple process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl font-black text-green-100 dark:text-green-900 mb-4 leading-none">{s.num}</div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{s.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-20 px-4 mx-4 mb-4 rounded-3xl bg-green-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-green-200 text-sm font-semibold tracking-widest uppercase mb-3">Built for Bihar Board</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Bihar Board. Built for You.</h2>
          <p className="text-green-100 mb-8 text-lg">All 4 subjects. Class 11 &amp; 12. Hindi-medium friendly. Bihar Board exam pattern.</p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["Physics", "Chemistry", "Mathematics", "Biology"].map(s => (
              <span key={s} className="bg-white/20 backdrop-blur-sm text-white font-semibold px-5 py-2 rounded-full text-sm border border-white/20">
                {s}
              </span>
            ))}
          </div>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition-colors shadow-md text-base">
            Start for Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 text-center text-sm text-gray-400 dark:text-gray-600 border-t border-gray-200 dark:border-gray-800">
        <p>Topper 2.0 — AI-powered study platform for Bihar Board students</p>
      </footer>
    </div>
  );
}
