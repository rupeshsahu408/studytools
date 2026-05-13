import "./_group.css";
import { Home, Upload, Users, BarChart2, UserCircle, Settings, Award, Flame, Calendar, Brain, CheckCircle, Star, Zap, BookOpen, HelpCircle, Layers, Beaker, Target, Trophy } from "lucide-react";

const BADGES = [
  { id: "first_chapter", label: "First Chapter", icon: BookOpen, earned: true },
  { id: "first_notes", label: "Notes Read", icon: CheckCircle, earned: true },
  { id: "q_10", label: "10 Questions", icon: HelpCircle, earned: true },
  { id: "q_50", label: "50 Questions", icon: HelpCircle, earned: false },
  { id: "q_100", label: "100 Answered", icon: Award, earned: false },
  { id: "q_250", label: "250 Pro", icon: Trophy, earned: false },
  { id: "streak_3", label: "3-Day Streak", icon: Flame, earned: true },
  { id: "streak_7", label: "7-Day Streak", icon: Flame, earned: false },
  { id: "streak_30", label: "30-Day Legend", icon: Star, earned: false },
  { id: "flashcard_pro", label: "Flash Master", icon: Layers, earned: false },
  { id: "sim_explorer", label: "Sim Explorer", icon: Beaker, earned: false },
  { id: "all_sections", label: "Complete All", icon: Zap, earned: false },
];

const NAV = [
  { icon: Home, label: "Home", active: false },
  { icon: Upload, label: "Upload", active: false },
  { icon: Users, label: "Community", active: false },
  { icon: BarChart2, label: "Progress", active: false },
  { icon: UserCircle, label: "Profile", active: true },
];

export function ProfilePage() {
  return (
    <div className="phone-frame">
      <div className="top-header">
        <span style={{ fontWeight: 800, fontSize: 16, color: "var(--t2-text)" }}>My Profile</span>
        <button style={{ width: 34, height: 34, borderRadius: 10, background: "var(--t2-card)", border: "1px solid var(--t2-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Settings size={15} color="var(--t2-muted)" />
        </button>
      </div>

      <div className="content-scroll" style={{ padding: "0 16px" }}>

        {/* Profile card */}
        <div style={{ paddingTop: 20, marginBottom: 20, textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
            <div style={{ width: 78, height: 78, borderRadius: "50%", background: "linear-gradient(135deg,#2E6F40,#4CBB17)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: "#fff" }}>R</span>
            </div>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "var(--t2-green-lt)", border: "2px solid var(--t2-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={11} color="#fff" />
            </div>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--t2-text)", marginBottom: 2 }}>Rahul Singh</h2>
          <p style={{ fontSize: 12, color: "var(--t2-muted)", marginBottom: 6 }}>@rahulsingh · Class 12 · Patna, Bihar</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--t2-green-dim)", padding: "4px 10px", borderRadius: 99 }}>
            <Flame size={12} color="#f97316" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-green-lt)" }}>7-day streak</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Questions", value: "47", sub: "answered" },
            { label: "Accuracy", value: "78%", sub: "correct" },
            { label: "Badges", value: "4/12", sub: "earned" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t2-text)" }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: "var(--t2-muted)", marginTop: 1 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Exam countdown */}
        <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Calendar size={20} color="#ef4444" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: "var(--t2-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bihar Board Exam</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#ef4444" }}>127 days left</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "var(--t2-muted)" }}>Target</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)" }}>80%+</p>
          </div>
        </div>

        {/* Daily goal */}
        <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={15} color="var(--t2-green-lt)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)" }}>Aaj Ka Target</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t2-green-lt)" }}>4 / 10 done</span>
          </div>
          <div style={{ height: 6, background: "var(--t2-border)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: "40%", height: "100%", background: "var(--t2-green)", borderRadius: 99 }} />
          </div>
        </div>

        {/* Badges */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Badges (4/12 earned)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {BADGES.map(b => (
              <div key={b.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: b.earned ? "var(--t2-green-dim)" : "var(--t2-card)", border: b.earned ? "1.5px solid var(--t2-green)" : "1px solid var(--t2-border)", display: "flex", alignItems: "center", justifyContent: "center", opacity: b.earned ? 1 : 0.4 }}>
                  <b.icon size={22} color={b.earned ? "var(--t2-green-lt)" : "var(--t2-muted2)"} />
                </div>
                <span style={{ fontSize: 9, color: b.earned ? "var(--t2-green-lt)" : "var(--t2-muted2)", textAlign: "center", fontWeight: b.earned ? 700 : 400, lineHeight: 1.2 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Area AI */}
        <div style={{ background: "var(--t2-green-dim)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "14px 16px", marginBottom: 4, display: "flex", alignItems: "center", gap: 12 }}>
          <Brain size={20} color="var(--t2-green-lt)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)" }}>Weak Area Analysis</p>
            <p style={{ fontSize: 11, color: "var(--t2-muted)" }}>AI identifies your trouble spots</p>
          </div>
          <span style={{ fontSize: 12, color: "var(--t2-green-lt)", fontWeight: 700 }}>→</span>
        </div>
      </div>

      <div className="bottom-nav">
        {NAV.map(({ icon: Icon, label, active }) => (
          <button key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "6px 8px", flex: 1 }}>
            <Icon size={21} color={active ? "var(--t2-green-lt)" : "var(--t2-muted2)"} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? "var(--t2-green-lt)" : "var(--t2-muted2)" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
