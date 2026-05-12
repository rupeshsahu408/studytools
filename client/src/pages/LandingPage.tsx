import { Link } from "react-router-dom";
import { BookOpen, Zap, Brain, BarChart2, ArrowRight } from "lucide-react";

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T2</span>
            </div>
            <span className="font-bold text-lg">Topper 2.0</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              Login
            </Link>
            <Link to="/signup" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 text-center max-w-4xl mx-auto">
        <span className="inline-block bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Made for Bihar Board Students
        </span>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          From Beginner to{" "}
          <span className="text-green-600">Topper</span>
          {" "}— Powered by AI
        </h1>
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Upload any NCERT chapter. Get complete notes, a full question bank, and everything you need to ace Class 11 & 12 board exams.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/signup" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors">
            Start Studying Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700 hover:border-green-400 text-gray-700 dark:text-gray-300 font-semibold px-8 py-3.5 rounded-xl transition-colors">
            Already a student? Login
          </Link>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Everything a Topper Needs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-black text-green-100 dark:text-green-900 mb-3">{s.num}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-green-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Built for Bihar Board. Built for You.</h2>
          <p className="text-green-100 mb-8">All 4 subjects. Class 11 & 12. Hindi-medium friendly. Bihar Board exam pattern.</p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {["Physics", "Chemistry", "Mathematics", "Biology"].map(s => (
              <span key={s} className="bg-white/20 text-white font-medium px-4 py-2 rounded-full text-sm">{s}</span>
            ))}
          </div>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-green-600 font-bold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-colors">
            Start for Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="py-8 px-4 text-center text-sm text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800">
        <p>Topper 2.0 — AI-powered study platform for Bihar Board students</p>
      </footer>
    </div>
  );
}
