import "./_group.css";
import { useState } from "react";
import { Home, Upload, Users, BarChart2, UserCircle, Trophy, MessageCircle, Bell, Flame, ChevronRight, Compass, Star } from "lucide-react";

const NAV = [
  { icon: Home, label: "Home", active: false },
  { icon: Upload, label: "Upload", active: false },
  { icon: Users, label: "Community", active: true },
  { icon: BarChart2, label: "Progress", active: false },
  { icon: UserCircle, label: "Profile", active: false },
];

const TABS = ["Leaderboard", "Rooms", "Discover", "Notifications"];

const LEADERS = [
  { rank: 1, name: "Priya Sharma", points: 1240, streak: 21, district: "Patna", avatar: "P" },
  { rank: 2, name: "Amit Kumar", points: 1185, streak: 14, district: "Muzaffarpur", avatar: "A" },
  { rank: 3, name: "Sita Devi", points: 1090, streak: 9, district: "Gaya", avatar: "S" },
  { rank: 4, name: "Rahul Singh", points: 980, streak: 7, district: "Patna", avatar: "R", isMe: true },
  { rank: 5, name: "Vikram Yadav", points: 870, streak: 5, district: "Bhagalpur", avatar: "V" },
];

const ROOMS = [
  { name: "Physics Doubts — Class 12", members: 24, messages: 6, new: true },
  { name: "Bihar Board Exam Prep 2026", members: 89, messages: 31, new: true },
  { name: "Chemistry Doubt Corner", members: 17, messages: 2, new: false },
  { name: "Math Problem Solvers", members: 42, messages: 0, new: false },
];

function LeaderboardTab() {
  return (
    <div style={{ padding: "16px 16px" }}>
      {/* My rank card */}
      <div style={{ background: "var(--t2-green-dim)", border: "1.5px solid var(--t2-green)", borderRadius: 16, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--t2-green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>R</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: "var(--t2-muted)" }}>Your rank this week</p>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--t2-text)" }}>#4 · 980 pts</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Flame size={14} color="#f97316" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#f97316" }}>7</span>
        </div>
      </div>

      {/* Top 3 podium */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12, alignItems: "flex-end" }}>
        {[LEADERS[1], LEADERS[0], LEADERS[2]].map((l, i) => {
          const heights = [70, 90, 60];
          const colors = ["#9ca3af", "#f59e0b", "#CD7F32"];
          return (
            <div key={l.rank} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: colors[i] + "33", border: `2px solid ${colors[i]}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 800, color: colors[i], fontSize: 14 }}>{l.avatar}</span>
              </div>
              <p style={{ fontSize: 10, color: "var(--t2-text)", fontWeight: 700, textAlign: "center" }}>{l.name.split(" ")[0]}</p>
              <p style={{ fontSize: 9, color: "var(--t2-muted)" }}>{l.points} pts</p>
              <div style={{ width: "100%", height: heights[i], background: colors[i] + "33", borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: colors[i] }}>#{i === 1 ? 1 : i === 0 ? 2 : 3}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {LEADERS.slice(3).concat(LEADERS.slice(3)).map((l, i) => (
          <div key={i} style={{ background: l.isMe ? "var(--t2-green-dim)" : "var(--t2-card)", border: l.isMe ? "1.5px solid var(--t2-green)" : "1px solid var(--t2-border)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-muted)", width: 20, textAlign: "center" }}>#{4 + i}</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--t2-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontWeight: 700, color: "var(--t2-text)", fontSize: 12 }}>{l.avatar}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: l.isMe ? 800 : 600, color: "var(--t2-text)" }}>{l.name}{l.isMe ? " (You)" : ""}</p>
              <p style={{ fontSize: 10, color: "var(--t2-muted)" }}>{l.district}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-green-lt)" }}>{l.points} pts</p>
              <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                <Flame size={10} color="#f97316" />
                <span style={{ fontSize: 10, color: "#f97316" }}>{l.streak}d</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoomsTab() {
  return (
    <div style={{ padding: "16px 16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ROOMS.map((r, i) => (
          <div key={i} style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 14, padding: "14px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--t2-green-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MessageCircle size={18} color="var(--t2-green-lt)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
              <p style={{ fontSize: 11, color: "var(--t2-muted)" }}>{r.members} members</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              {r.new && <span style={{ background: "var(--t2-green)", padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700, color: "#fff" }}>{r.messages} new</span>}
              <ChevronRight size={14} color="var(--t2-muted2)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommunityPage() {
  const [tab, setTab] = useState("Leaderboard");

  return (
    <div className="phone-frame">
      <div className="top-header">
        <span style={{ fontWeight: 800, fontSize: 16, color: "var(--t2-text)" }}>Community</span>
        <button style={{ width: 34, height: 34, borderRadius: 10, background: "var(--t2-card)", border: "1px solid var(--t2-border)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }}>
          <Bell size={15} color="var(--t2-muted)" />
          <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, background: "#ef4444", borderRadius: "50%" }} />
        </button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--t2-border)", background: "var(--t2-bg)", flexShrink: 0, overflowX: "auto", padding: "0 8px" }} className="no-scrollbar">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ whiteSpace: "nowrap", padding: "10px 12px", background: "none", border: "none", borderBottom: tab === t ? "2px solid var(--t2-green-lt)" : "2px solid transparent", color: tab === t ? "var(--t2-green-lt)" : "var(--t2-muted)", fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: "pointer", flexShrink: 0 }}>
            {t}
          </button>
        ))}
      </div>

      <div className="content-scroll">
        {tab === "Leaderboard" && <LeaderboardTab />}
        {tab === "Rooms" && <RoomsTab />}
        {tab === "Discover" && (
          <div style={{ padding: "40px 16px", textAlign: "center" }}>
            <Compass size={40} color="var(--t2-green-lt)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--t2-text)", marginBottom: 6 }}>Discover Students</p>
            <p style={{ fontSize: 12, color: "var(--t2-muted)" }}>Find students by district, subject & class</p>
          </div>
        )}
        {tab === "Notifications" && (
          <div style={{ padding: "16px 16px" }}>
            {[
              { text: "Priya liked your public notes", time: "2m ago" },
              { text: "Amit replied in Physics Doubts room", time: "15m ago" },
              { text: "You earned the 7-Day Streak badge!", time: "1h ago" },
            ].map((n, i) => (
              <div key={i} style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--t2-green-lt)", marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: "var(--t2-text)" }}>{n.text}</p>
                  <p style={{ fontSize: 11, color: "var(--t2-muted)", marginTop: 3 }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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
