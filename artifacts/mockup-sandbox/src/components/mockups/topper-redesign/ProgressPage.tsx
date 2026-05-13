import "./_group.css";
import { Home, Upload, Users, BarChart2, UserCircle, Flame, TrendingUp, BookOpen, HelpCircle, Layers, Beaker, CheckCircle, XCircle, Clock, Atom, FlaskConical, Calculator, Leaf } from "lucide-react";

const NAV = [
  { icon: Home, label: "Home", active: false },
  { icon: Upload, label: "Upload", active: false },
  { icon: Users, label: "Community", active: false },
  { icon: BarChart2, label: "Progress", active: true },
  { icon: UserCircle, label: "Profile", active: false },
];

const SUBJECTS = [
  { name: "Physics", color: "#3b82f6", icon: Atom, completion: 75, accuracy: 82, chapters: 2 },
  { name: "Chemistry", color: "#a855f7", icon: FlaskConical, completion: 40, accuracy: 65, chapters: 1 },
  { name: "Mathematics", color: "#f97316", icon: Calculator, completion: 20, accuracy: 55, chapters: 1 },
];

const CHAPTERS = [
  { name: "Electromagnetic Induction", subject: "Physics", color: "#3b82f6", icon: Atom, notes: true, questions: 22, flashcards: true, sims: true, accuracy: 85 },
  { name: "Chemical Bonding", subject: "Chemistry", color: "#a855f7", icon: FlaskConical, notes: true, questions: 8, flashcards: false, sims: false, accuracy: 62 },
  { name: "Integrals", subject: "Mathematics", color: "#f97316", icon: Calculator, notes: false, questions: 0, flashcards: false, sims: false, accuracy: null },
];

export function ProgressPage() {
  return (
    <div className="phone-frame">
      <div className="top-header">
        <span style={{ fontWeight: 800, fontSize: 16, color: "var(--t2-text)" }}>My Progress</span>
      </div>

      <div className="content-scroll" style={{ padding: "16px 16px 0" }}>

        {/* Overview stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Chapters", value: "3", sub: "uploaded", color: "#3b82f6", icon: BookOpen },
            { label: "Questions", value: "47", sub: "answered", color: "var(--t2-green-lt)", icon: HelpCircle },
            { label: "Accuracy", value: "78%", sub: "correct rate", color: "#a855f7", icon: TrendingUp },
            { label: "Streak", value: "7 days", sub: "current", color: "#f97316", icon: Flame },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "14px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <s.icon size={14} color={s.color} />
                <span style={{ fontSize: 11, color: "var(--t2-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--t2-muted)", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Overall completion */}
        <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart2 size={14} color="var(--t2-green-lt)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)" }}>Overall Completion</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, color: "var(--t2-green-lt)" }}>45%</span>
          </div>
          <div style={{ height: 8, background: "var(--t2-border)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: "45%", height: "100%", background: "linear-gradient(90deg,var(--t2-green),var(--t2-green-lt))", borderRadius: 99 }} />
          </div>
          <p style={{ fontSize: 11, color: "var(--t2-muted)", marginTop: 8 }}>Based on notes, questions, flashcards & simulations</p>
        </div>

        {/* Subject Breakdown */}
        <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "14px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Subject Breakdown</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {SUBJECTS.map(s => (
              <div key={s.name}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <s.icon size={14} color={s.color} />
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--t2-text)" }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: "var(--t2-muted)" }}>{s.chapters} ch</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.accuracy >= 70 ? "var(--t2-green-lt)" : s.accuracy >= 50 ? "#f97316" : "#ef4444" }}>{s.accuracy}% acc</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.completion}%</span>
                </div>
                <div style={{ height: 4, background: "var(--t2-border)", borderRadius: 99, overflow: "hidden", marginLeft: 36 }}>
                  <div style={{ width: `${s.completion}%`, height: "100%", background: s.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chapter cards */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Chapter-wise</p>
        {CHAPTERS.map((ch, i) => {
          const done = [ch.notes, ch.questions > 0, ch.flashcards, ch.sims].filter(Boolean).length;
          const pct = Math.round((done / 4) * 100);
          return (
            <div key={i} style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "14px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: ch.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ch.icon size={18} color={ch.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.name}</p>
                  <p style={{ fontSize: 11, color: "var(--t2-muted)", marginTop: 1 }}>{ch.subject}{ch.accuracy ? ` · ${ch.accuracy}% acc` : ""}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: pct === 100 ? "var(--t2-green-lt)" : pct > 0 ? "#f97316" : "var(--t2-muted2)" }}>{pct}%</span>
              </div>
              <div style={{ height: 3, background: "var(--t2-border)", borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: ch.color, borderRadius: 99 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
                {[
                  { label: "Notes", done: ch.notes },
                  { label: `${ch.questions || 0} Q`, done: ch.questions > 0 },
                  { label: "Cards", done: ch.flashcards },
                  { label: "Sims", done: ch.sims },
                ].map(({ label, done: d }) => (
                  <div key={label} style={{ background: d ? "rgba(76,187,23,0.08)" : "var(--t2-bg)", borderRadius: 10, padding: "6px 4px", textAlign: "center" }}>
                    {d ? <CheckCircle size={14} color="var(--t2-green-lt)" /> : <XCircle size={14} color="var(--t2-muted2)" />}
                    <p style={{ fontSize: 9, color: d ? "var(--t2-green-lt)" : "var(--t2-muted2)", marginTop: 3, fontWeight: d ? 700 : 400 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
