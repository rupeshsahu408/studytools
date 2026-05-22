import { Link } from "react-router-dom";
import { BookOpen, Zap, Brain, BarChart2, ArrowRight, Sparkles, Users, MessageCircle, Trophy, Mail, MapPin } from "lucide-react";
import SEOHead from "../components/SEOHead";

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function IconGithub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

const features = [
  { icon: BookOpen, title: "Smart Notes", desc: "AI generates complete, structured notes from any NCERT chapter instantly." },
  { icon: Zap, title: "Question Bank", desc: "MCQ, 1-mark, 2-mark, 5-mark, Assertion-Reason — all question types auto-generated." },
  { icon: Brain, title: "Practice Modes", desc: "Practice at your pace or take timed tests just like real board exams." },
  { icon: BarChart2, title: "All Subjects", desc: "Physics, Chemistry, Biology, Math, Social Science, Hindi, English & more — Class 9 to 12 NCERT." },
  { icon: MessageCircle, title: "Doubt Chat", desc: "Ask any question about your chapter and get instant AI-powered answers." },
  { icon: Users, title: "Community", desc: "Discuss with thousands of NCERT board students. Share tips, ask doubts, climb the leaderboard." },
];

const steps = [
  { num: "01", title: "Upload or Browse", desc: "Upload your own PDF or pick any NCERT chapter from our built-in library." },
  { num: "02", title: "AI Processes It", desc: "Our AI reads the chapter and generates everything you need to become a topper." },
  { num: "03", title: "Study Smart", desc: "Use notes, practice questions, and test yourself — all in one place." },
];

const stats = [
  { value: "11+", label: "Study Tools" },
  { value: "10+", label: "Subjects" },
  { value: "Class 9–12", label: "All Classes" },
  { value: "AI", label: "Powered" },
];

const communityFeatures = [
  {
    icon: Trophy,
    color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    title: "Weekly Leaderboard",
    desc: "Compete with students from across the country. Top rankers every Monday.",
  },
  {
    icon: MessageCircle,
    color: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    title: "Live Discussion Rooms",
    desc: "Subject-wise chat rooms — Physics, Chemistry, Math, Biology, Social Science, Hindi, English & more.",
  },
  {
    icon: Users,
    color: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
    title: "Study Groups",
    desc: "Teachers create classes, students join with an invite code and study together.",
  },
];

export default function LandingPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Kya Topper 2.0 bilkul free hai?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Haan, Topper 2.0 completely free hai. Class 9 se lekar Class 12 tak ke saare students bina kisi payment ke AI-generated notes, question banks, flashcards aur doubt chat use kar sakte hain."
        }
      },
      {
        "@type": "Question",
        "name": "Topper 2.0 mein kaunse subjects hain?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Topper 2.0 mein Class 9 se Class 12 tak ke liye Physics, Chemistry, Mathematics, Biology, Social Science, History, Geography, Hindi, English aur bhi kai subjects hain. Saare NCERT chapters covered hain."
        }
      },
      {
        "@type": "Question",
        "name": "AI notes kaise generate hote hain?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Aap apna NCERT chapter PDF upload karo ya hamare library se select karo. Hamara AI ek baar mein detailed notes, 9 types ka question bank, flashcards, formula sheet, mind map aur simulations generate karta hai."
        }
      },
      {
        "@type": "Question",
        "name": "Kya Topper 2.0 Bihar Board exam pattern follow karta hai?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Haan, Topper 2.0 specifically Bihar Board exam pattern ke liye bana hai. MCQ, 1-mark, 2-mark, 5-mark, Assertion-Reason aur Case-Based — saare question types Bihar Board pattern mein generate hote hain."
        }
      },
      {
        "@type": "Question",
        "name": "Kya main AI se doubt puch sakta hoon?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bilkul! Topper 2.0 mein AI Doubt Chat feature hai jahan aap apne chapter ke baare mein koi bhi sawaal puch sakte ho aur turant AI-powered jawab paate ho — Hindi aur English dono mein."
        }
      },
      {
        "@type": "Question",
        "name": "Kya Topper 2.0 mobile pe bhi chalega?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Haan, Topper 2.0 ek web app hai jo sabhi devices pe smoothly chalta hai — mobile, tablet aur desktop. Koi app download nahi karna, browser mein seedha kholo."
        }
      }
    ]
  };

  const educationalOrgSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Topper 2.0",
    "url": "https://studyai.plyndrox.app/",
    "logo": "https://studyai.plyndrox.app/logo.png",
    "description": "AI-powered study platform for NCERT Class 9 to 12 students providing notes, question banks, flashcards, simulations and doubt chat across Physics, Chemistry, Math, Biology, Social Science, Hindi, English and more.",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Bihar",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://www.instagram.com/rupesh_gupta___/",
      "https://x.com/rupesh__gupta_",
      "https://github.com/rupeshsahu408"
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <SEOHead
        title="Free AI Study Notes for NCERT Class 9, 10, 11 & 12 — All Subjects"
        description="Topper 2.0 is India's #1 free AI study platform for NCERT Class 9 to 12 students. Get instant AI-generated notes, complete question banks, flashcards, simulations & doubt chat for Physics, Chemistry, Math, Biology, Social Science, Hindi, English and more. Study smarter. Score higher."
        keywords="NCERT AI notes Class 9 10 11 12, Bihar Board notes free, NCERT AI study platform India, Bihar Board exam preparation 2025, NCERT question bank AI, AI flashcards Class 9 to 12, Physics Chemistry Math Biology notes, Social Science Hindi English notes NCERT, AI doubt chat NCERT, best study app students India, free online study notes NCERT, AI generated notes Hindi, NCERT chapter question bank, board exam preparation, NCERT AI tutor free, Class 9 10 Science notes"
        canonical="/"
        ogType="website"
        jsonLd={[faqSchema, educationalOrgSchema]}
      />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" className="w-8 h-8 rounded-lg object-cover shadow-sm" alt="Topper 2.0" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">Topper 2.0</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/community" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <Users className="w-4 h-4" /> Community
            </Link>
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
          For All NCERT Board Students — Class 9 to 12
        </div>
        <h1 className="font-black tracking-tight mb-6 text-gray-900 dark:text-white">
          <span className="block text-4xl sm:text-5xl md:text-7xl leading-tight">
            From Beginner to
          </span>
          <span className="block text-4xl sm:text-5xl md:text-7xl leading-tight text-green-600 dark:text-green-400">
            Topper
          </span>
          <span className="block text-xl sm:text-2xl md:text-4xl font-bold text-gray-500 dark:text-gray-400 mt-1">
            Powered by AI
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload any NCERT chapter. Get complete notes, a full question bank,
          and everything you need to ace your board exams — Class 9 to 12.
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

      {/* ── Social Proof Image ── */}
      <section className="px-4 pb-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800">
            <img
              src="/students-studying.png"
              alt="Students using Topper 2.0 in library"
              className="w-full h-64 sm:h-80 md:h-96 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-1">
                  {["bg-green-500", "bg-blue-500", "bg-violet-500"].map((c, i) => (
                    <div key={i} className={`w-5 h-5 rounded-full border-2 border-white ${c}`} />
                  ))}
                </div>
                <span className="text-white text-sm font-semibold">Real students, real results</span>
              </div>
              <p className="text-white/80 text-xs max-w-md leading-relaxed">
                Students across India are using Topper 2.0 to prepare smarter — from NCERT notes to full question banks, all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Intro Video ── */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 tracking-widest uppercase mb-2">Platform Introduction</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              See How It Works
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
              Watch this 2-minute intro — learn what Topper 2.0 is, what you get, and how it can transform the way you study.
            </p>
          </div>
          <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/nI1yNx7DYe4?rel=0&modestbranding=1"
              title="Topper 2.0 — Platform Introduction"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 tracking-widest uppercase mb-2">Everything you need</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">A Topper's Complete Toolkit</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* ── Community Section ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 border border-green-200 dark:border-green-800/50">
              <Users className="w-3 h-3" /> Student Community
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Study Together, Score Together
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
              Join thousands of NCERT board students. Ask doubts, share tips, compete on the leaderboard — and never study alone again.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {communityFeatures.map((f, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 transition-colors text-center">
                <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Community CTA */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border border-green-200 dark:border-green-800/50 rounded-3xl p-8 text-center">
            <div className="flex -space-x-2 justify-center mb-4">
              {["R", "P", "A", "S", "K"].map((l, i) => (
                <div key={i} className={`w-9 h-9 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold ${
                  ["bg-violet-500", "bg-blue-500", "bg-rose-500", "bg-amber-500", "bg-teal-500"][i]
                }`}>
                  {l}
                </div>
              ))}
              <div className="w-9 h-9 rounded-full bg-green-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold">
                +
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Join the Student Community
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Free discussion rooms, live leaderboard, and a community of students just like you — all inside Topper 2.0.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm text-sm"
            >
              Join Now — It's Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-4 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
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

      {/* ── Testimonials ── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 tracking-widest uppercase mb-2">Student Reviews</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">What Students Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                name: "Priya Sharma",
                class: "Class 12 · Science",
                avatar: "P",
                color: "bg-violet-500",
                stars: 5,
                text: "Topper 2.0 ne meri Physics preparation completely change kar di. Notes itne clear hain ki ek baar padhne ke baad sab yaad ho jaata hai!",
              },
              {
                name: "Rahul Kumar",
                class: "Class 11 · Science",
                avatar: "R",
                color: "bg-blue-500",
                stars: 5,
                text: "Question bank bohot helpful hai. MCQ se lekar 5-mark tak sab cover ho jaata hai. Board exam mein 87% aaya — Topper 2.0 ka kamaal hai.",
              },
              {
                name: "Ananya Singh",
                class: "Class 12 · Biology",
                avatar: "A",
                color: "bg-rose-500",
                stars: 5,
                text: "Flashcards feature mera favorite hai! Chemistry ke formulas yaad karna ab itna easy ho gaya. Doubt Chat bhi instant answer deta hai.",
              },
              {
                name: "Sumit Yadav",
                class: "Class 10 · All Subjects",
                avatar: "S",
                color: "bg-amber-500",
                stars: 5,
                text: "Free mein itna sab milta hai — notes, questions, simulations. Kisi bhi coaching se zyada helpful hai ye platform. Sach mein game changer!",
              },
            ].map((t, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col gap-4 hover:border-green-300 dark:hover:border-green-700 transition-colors">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <svg key={s} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {/* Review text */}
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">"{t.text}"</p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.class}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-20 px-4 mx-4 mb-4 rounded-3xl bg-green-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-green-200 text-sm font-semibold tracking-widest uppercase mb-3">Built for Every Board</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Every Board. Built for You.</h2>
          <p className="text-green-100 mb-8 text-lg">All subjects. Class 9 to 12. All NCERT boards. Complete board exam pattern.</p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["Physics", "Chemistry", "Mathematics", "Biology", "Social Science", "Hindi", "English"].map(s => (
              <span key={s} className="bg-white/20 backdrop-blur-sm text-white font-semibold px-5 py-2 rounded-full text-sm border border-white/20">
                {s}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition-colors shadow-md text-base">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/community" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold px-8 py-4 rounded-xl transition-colors text-base">
              <Users className="w-4 h-4" /> Join Community
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 pt-16 pb-8 px-4 mt-4">
        <div className="max-w-6xl mx-auto">

          {/* Top grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/logo.png" className="w-8 h-8 rounded-lg object-cover shadow-sm" alt="Topper 2.0" />
                <span className="font-bold text-white text-base">Topper 2.0</span>
              </div>
              <p className="text-sm leading-relaxed mb-5 text-gray-500">
                An AI-powered study platform built for NCERT Class 9 to 12 board students across India.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/rupesh_gupta___/" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors">
                  <IconInstagram className="w-4 h-4 text-white" />
                </a>
                <a href="https://x.com/rupesh__gupta_" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-800 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
                  <IconX className="w-4 h-4 text-white" />
                </a>
                <a href="https://github.com/rupeshsahu408" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-800 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
                  <IconGithub className="w-4 h-4 text-white" />
                </a>
              </div>

              {/* Parent company */}
              <div className="mt-5 pt-5 border-t border-gray-800">
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider font-medium">Owned By</p>
                <a
                  href="https://company.plyndrox.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 transition-all duration-200 group"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors">company.plyndrox.app</span>
                  <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-green-400 transition-colors" />
                </a>
              </div>
            </div>

            {/* Product links */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/signup" className="hover:text-green-400 transition-colors">Get Started Free</Link></li>
                <li><Link to="/login" className="hover:text-green-400 transition-colors">Login</Link></li>
                <li><Link to="/community" className="hover:text-green-400 transition-colors">Community</Link></li>
                <li><Link to="/discover" className="hover:text-green-400 transition-colors">Discover</Link></li>
                <li><a href="#features" className="hover:text-green-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-green-400 transition-colors">How It Works</a></li>
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="https://plyndrox.app" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">About</a></li>
                <li><a href="https://studyai.plyndrox.app/blog" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">Blog</a></li>
                <li>
                  <a href="mailto:hello@plyndrox.app" className="hover:text-green-400 transition-colors flex items-center gap-1.5">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal + Contact */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-sm mb-6">
                <li><a href="/privacy-policy" className="hover:text-green-400 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-green-400 transition-colors">Terms &amp; Conditions</a></li>
              </ul>

              <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:hello@plyndrox.app" className="hover:text-green-400 transition-colors flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    hello@plyndrox.app
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Bihar, India 821105</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <p>&copy; {new Date().getFullYear()} Topper 2.0. All rights reserved.</p>

            {/* All Systems Operational status button */}
            <Link
              to="/status"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-700 hover:border-green-600/60 hover:bg-green-900/20 transition-all duration-200 group"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-gray-400 group-hover:text-green-400 transition-colors font-medium">
                All Systems Operational
              </span>
            </Link>

            <p>
              Made with ❤️ by{" "}
              <a href="https://www.instagram.com/rupesh_gupta___/" target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors font-medium">
                Rupesh Gupta
              </a>
              {" "}· Bihar, India
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}
