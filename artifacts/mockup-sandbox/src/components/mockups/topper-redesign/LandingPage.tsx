import "./_group.css";
import { BookOpen, HelpCircle, Layers, Atom, Brain, Trophy, Flame, ChevronRight, Star, CheckCircle, Zap } from "lucide-react";

const FEATURES = [
  { icon: BookOpen, label: "AI Notes", desc: "Detailed chapter notes in Hindi & English", color: "#3b82f6" },
  { icon: HelpCircle, label: "9 Question Types", desc: "MCQ, 5-Mark, Assertion & more", color: "#a855f7" },
  { icon: Layers, label: "Flash Cards", desc: "Spaced repetition for better recall", color: "#f97316" },
  { icon: Atom, label: "Simulations", desc: "11 interactive Physics & Chemistry sims", color: "var(--t2-green-lt)" },
  { icon: Brain, label: "Doubt Chat", desc: "AI tutor available 24/7", color: "#ec4899" },
  { icon: Trophy, label: "Leaderboard", desc: "Compete with students across Bihar", color: "#f59e0b" },
];

export function LandingPage() {
  return (
    <div className="phone-frame" style={{ overflowY: "auto" }}>
      {/* Top bar */}
      <div className="top-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, background: "var(--t2-green)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 11 }}>T2</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, color: "var(--t2-text)" }}>Topper 2.0</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <a href="#" style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid var(--t2-border)", color: "var(--t2-muted)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Login</a>
          <a href="#" style={{ padding: "6px 12px", borderRadius: 10, background: "var(--t2-green)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Sign up</a>
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1, paddingBottom: 20 }}>
        {/* Hero */}
        <div style={{ padding: "32px 20px 28px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--t2-green-dim)", border: "1px solid var(--t2-border)", borderRadius: 99, padding: "5px 12px", marginBottom: 18 }}>
            <Star size={12} color="#f59e0b" />
            <span style={{ fontSize: 11, color: "var(--t2-muted)", fontWeight: 600 }}>Bihar Board · Class 11 & 12</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--t2-text)", lineHeight: 1.15, marginBottom: 14 }}>
            Bihar ka <span style={{ color: "var(--t2-green-lt)" }}>Sabse Smart</span> Study App
          </h1>
          <p style={{ fontSize: 14, color: "var(--t2-muted)", lineHeight: 1.6, marginBottom: 24 }}>
            AI se padho, practice karo, aur Bihar Board mein top karo. Hindi-medium students ke liye specially banaya gaya.
          </p>

          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            <div style={{ display: "flex" }}>
              {["P","A","S","R"].map((l, i) => (
                <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: `hsl(${i*60},60%,50%)`, border: "2px solid var(--t2-bg)", marginLeft: i > 0 ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{l}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex" }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={11} color="#f59e0b" fill="#f59e0b" />)}
            </div>
            <span style={{ fontSize: 12, color: "var(--t2-muted)" }}>2,400+ students</span>
          </div>

          <button style={{ width: "100%", background: "var(--t2-green)", border: "none", borderRadius: 14, padding: "15px", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Zap size={16} /> Start Free — Abhi Shuru Karo
          </button>
          <p style={{ fontSize: 11, color: "var(--t2-muted)" }}>Free sign up · No credit card · Bihar Board aligned</p>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--t2-border)", marginBottom: 28, overflow: "hidden" }}>
          {[
            { value: "11+", label: "Simulations" },
            { value: "9", label: "Q Types" },
            { value: "12", label: "Badges" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--t2-card)", padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--t2-green-lt)" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--t2-muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ padding: "0 16px", marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Everything you need</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "14px 12px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: f.color + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <f.icon size={18} color={f.color} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)", marginBottom: 4 }}>{f.label}</p>
                <p style={{ fontSize: 11, color: "var(--t2-muted)", lineHeight: 1.4 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why section */}
        <div style={{ padding: "0 16px", marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Why Topper 2.0?</p>
          {[
            "100% Bihar Board exam pattern — not CBSE",
            "Hindi-medium content with clear explanations",
            "Upload any PDF — get full study material in minutes",
            "Track your streak, accuracy & weak areas",
          ].map((point, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--t2-green-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle size={13} color="var(--t2-green-lt)" />
              </div>
              <p style={{ fontSize: 13, color: "var(--t2-text)" }}>{point}</p>
            </div>
          ))}
        </div>

        {/* CTA footer */}
        <div style={{ margin: "0 16px", background: "var(--t2-green-dim)", border: "1px solid var(--t2-border)", borderRadius: 18, padding: "20px 16px", textAlign: "center" }}>
          <Flame size={28} color="#f97316" style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 17, fontWeight: 800, color: "var(--t2-text)", marginBottom: 6 }}>Ready to become a Topper?</p>
          <p style={{ fontSize: 12, color: "var(--t2-muted)", marginBottom: 16 }}>Join 2,400+ Bihar Board students already studying smarter.</p>
          <button style={{ width: "100%", background: "var(--t2-green)", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
            Abhi Sign Up Karo — Free Hai!
          </button>
        </div>
      </div>
    </div>
  );
}
