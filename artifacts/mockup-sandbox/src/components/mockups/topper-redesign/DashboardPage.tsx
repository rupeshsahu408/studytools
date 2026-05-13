import "./_group.css";
import { Home, Upload, Users, BarChart2, UserCircle, Bell, Flame, Target, TrendingUp, ChevronRight, Plus, Globe, Atom, FlaskConical, Calculator, Leaf, BookOpen } from "lucide-react";

const NAV = [
  { icon: Home, label: "Home", active: true },
  { icon: Upload, label: "Upload", active: false },
  { icon: Users, label: "Community", active: false },
  { icon: BarChart2, label: "Progress", active: false },
  { icon: UserCircle, label: "Profile", active: false },
];

const CHAPTERS = [
  { subject: "Physics", classNum: "12", name: "Electromagnetic Induction", progress: 75, color: "#3b82f6", icon: Atom },
  { subject: "Chemistry", classNum: "11", name: "Chemical Bonding", progress: 40, color: "#a855f7", icon: FlaskConical },
  { subject: "Mathematics", classNum: "12", name: "Integrals", progress: 20, color: "#f97316", icon: Calculator },
];

function SubjectIcon({ color, Icon }: { color: string; Icon: any }) {
  return (
    <div style={{ background: color + "22", borderRadius: 14, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
  );
}

export function DashboardPage() {
  return (
    <div className="phone-frame">
      <div className="top-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, background: "var(--t2-green)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 11 }}>T2</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, color: "var(--t2-text)" }}>Topper 2.0</span>
        </div>
        <button style={{ width: 36, height: 36, borderRadius: 10, background: "var(--t2-green-dim)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }}>
          <Bell size={16} color="var(--t2-green-lt)" />
          <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, background: "#ef4444", borderRadius: "50%" }} />
        </button>
      </div>

      <div className="content-scroll" style={{ padding: "0 16px" }}>
        {/* Greeting */}
        <div style={{ paddingTop: 18, marginBottom: 18 }}>
          <p style={{ color: "var(--t2-muted)", fontSize: 13 }}>Namaste 👋</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--t2-text)", lineHeight: 1.2, margin: "2px 0 4px" }}>Rahul Singh</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--t2-green-lt)" }} />
            <p style={{ fontSize: 12, color: "var(--t2-muted)" }}>3 / 5 chapters used · Class 12</p>
          </div>
        </div>

        {/* Stats Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
          <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "12px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <Flame size={13} color="#f97316" />
              <span style={{ fontSize: 10, color: "var(--t2-muted)", fontWeight: 600 }}>Streak</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#f97316", lineHeight: 1 }}>7</div>
            <div style={{ fontSize: 10, color: "var(--t2-muted)", marginTop: 2 }}>days</div>
          </div>
          <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "12px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <Target size={13} color="var(--t2-green-lt)" />
              <span style={{ fontSize: 10, color: "var(--t2-muted)", fontWeight: 600 }}>Today</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "var(--t2-green-lt)", lineHeight: 1 }}>4<span style={{ fontSize: 11, color: "var(--t2-muted)", fontWeight: 500 }}>/10</span></div>
            <div style={{ height: 3, background: "var(--t2-border)", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
              <div style={{ width: "40%", height: "100%", background: "var(--t2-green-lt)", borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "12px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <TrendingUp size={13} color="#a855f7" />
              <span style={{ fontSize: 10, color: "var(--t2-muted)", fontWeight: 600 }}>Accuracy</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#a855f7", lineHeight: 1 }}>78<span style={{ fontSize: 11, color: "var(--t2-muted)", fontWeight: 500 }}>%</span></div>
            <div style={{ fontSize: 10, color: "var(--t2-muted)", marginTop: 2 }}>correct</div>
          </div>
        </div>

        {/* Chapter Library */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Chapter Library</span>
            <button style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--t2-green)", border: "none", borderRadius: 10, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              <Plus size={12} /> Add
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CHAPTERS.map((ch, i) => (
              <div key={i} style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 18, padding: "14px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <SubjectIcon color={ch.color} Icon={ch.icon} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.name}</p>
                    <p style={{ fontSize: 11, color: "var(--t2-muted)", marginTop: 2 }}>{ch.subject} · Class {ch.classNum}</p>
                  </div>
                  <ChevronRight size={15} color="var(--t2-muted2)" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 3, background: "var(--t2-border)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${ch.progress}%`, height: "100%", background: ch.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ch.color }}>{ch.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Notes shortcut — single occurrence */}
        <div style={{ background: "var(--t2-green-dim)", border: "1px solid var(--t2-border)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <Globe size={20} color="var(--t2-green-lt)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)" }}>Community Notes</p>
            <p style={{ fontSize: 11, color: "var(--t2-muted)" }}>Browse notes from other toppers</p>
          </div>
          <ChevronRight size={15} color="var(--t2-muted2)" />
        </div>
      </div>

      {/* Bottom Nav */}
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
