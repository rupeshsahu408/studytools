import { useState, useEffect } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────
const DAYS = [
  { date: "24 Jul", chem: "Solutions",                              hindi: "बातचीत" },
  { date: "25 Jul", chem: "Solutions",                              hindi: "उसने कहा था" },
  { date: "26 Jul", chem: "Solutions",                              hindi: "उसने कहा था" },
  { date: "27 Jul", chem: "Electrochemistry",                       hindi: "संपूर्ण क्रांति" },
  { date: "28 Jul", chem: "Electrochemistry",                       hindi: "संपूर्ण क्रांति" },
  { date: "29 Jul", chem: "Electrochemistry",                       hindi: "अर्द्धनारीश्वर" },
  { date: "30 Jul", chem: "Chemical Kinetics",                      hindi: "अर्द्धनारीश्वर" },
  { date: "31 Jul", chem: "Chemical Kinetics",                      hindi: "रोज" },
  { date: "1 Aug",  chem: "Chemical Kinetics",                      hindi: "रोज" },
  { date: "2 Aug",  chem: "Surface Chemistry",                      hindi: "एक लेख और एक पत्र" },
  { date: "3 Aug",  chem: "Surface Chemistry",                      hindi: "ओ सदानीरा" },
  { date: "4 Aug",  chem: "Isolation of Elements",                  hindi: "ओ सदानीरा" },
  { date: "5 Aug",  chem: "Isolation of Elements",                  hindi: "सिपाही की माँ" },
  { date: "6 Aug",  chem: "p-Block Elements",                       hindi: "प्रगीत और समाज" },
  { date: "7 Aug",  chem: "p-Block Elements",                       hindi: "प्रगीत और समाज" },
  { date: "8 Aug",  chem: "p-Block Elements",                       hindi: "जूठन" },
  { date: "9 Aug",  chem: "p-Block Elements",                       hindi: "जूठन" },
  { date: "10 Aug", chem: "p-Block Elements",                       hindi: "हँसते हुए मेरा अकेलापन" },
  { date: "11 Aug", chem: "d and f-Block Elements",                 hindi: "तिरिछ" },
  { date: "12 Aug", chem: "d and f-Block Elements",                 hindi: "तिरिछ" },
  { date: "13 Aug", chem: "d and f-Block Elements",                 hindi: "शिक्षा" },
  { date: "14 Aug", chem: "d and f-Block Elements",                 hindi: "कड़बक" },
  { date: "15 Aug", chem: "Haloalkanes & Haloarenes",               hindi: "सूरदास के पद" },
  { date: "16 Aug", chem: "Haloalkanes & Haloarenes",               hindi: "तुलसीदास के पद" },
  { date: "17 Aug", chem: "Haloalkanes & Haloarenes",               hindi: "छप्पय" },
  { date: "18 Aug", chem: "Alcohols, Phenols & Ethers",             hindi: "कवित्त" },
  { date: "19 Aug", chem: "Alcohols, Phenols & Ethers",             hindi: "तुमुल कोलाहल कलह में" },
  { date: "20 Aug", chem: "Alcohols, Phenols & Ethers",             hindi: "पुत्र वियोग" },
  { date: "21 Aug", chem: "Aldehydes, Ketones & Carboxylic Acids",  hindi: "उषा" },
  { date: "22 Aug", chem: "Aldehydes, Ketones & Carboxylic Acids",  hindi: "जन-जन का चेहरा एक" },
  { date: "23 Aug", chem: "Aldehydes, Ketones & Carboxylic Acids",  hindi: "अधिनायक" },
  { date: "24 Aug", chem: "Aldehydes, Ketones & Carboxylic Acids",  hindi: "प्यारे नन्हें बेटे को" },
  { date: "25 Aug", chem: "Amines",                                 hindi: "हार-जीत" },
  { date: "26 Aug", chem: "Biomolecules",                           hindi: "गाँव का घर" },
];

const STORAGE_KEY = "exam-tracker-v1";
const EXAM_DATE = new Date("2026-08-27T00:00:00");
const START_DATE = new Date("2026-07-24T00:00:00");

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDaysRemaining(): number {
  const now = new Date();
  const diff = EXAM_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getTodayIndex(): number {
  const now = new Date();
  const diff = now.getTime() - START_DATE.getTime();
  const idx = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(idx, 0), DAYS.length - 1);
}

// ─── Types ───────────────────────────────────────────────────────────────────
type TrackerState = Record<string, boolean>;

// ─── Sub-components ──────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: "amber" | "rose" }) {
  const fill = color === "amber"
    ? "linear-gradient(90deg, #F0D3A6, #D98E3C)"
    : "linear-gradient(90deg, #EBC6C0, #B4544A)";
  return (
    <div style={{ height: 10, background: "#C9BFA4", borderRadius: 5, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: fill, transition: "width .4s ease" }} />
    </div>
  );
}

// ─── Main Tracker Modal ───────────────────────────────────────────────────────
function TrackerModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<TrackerState>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setState(raw ? JSON.parse(raw) : {});
    } catch { setState({}); }
  }, []);

  const toggle = (key: string, val: boolean) => {
    const next = { ...state, [key]: val };
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const reset = () => {
    if (!window.confirm("Reset all progress? This cannot be undone.")) return;
    setState({});
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  };

  const chemDone  = DAYS.filter((_, i) => state[`chem-${i}`]).length;
  const hindiDone = DAYS.filter((_, i) => state[`hindi-${i}`]).length;
  const todayIdx  = getTodayIndex();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(28,59,58,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      overflowY: "auto", padding: "24px 12px 60px",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 780,
        background: "#F6F1E4", borderRadius: 6,
        border: "1px solid #C9BFA4",
        fontFamily: "'Georgia','Times New Roman',serif",
        color: "#1C3B3A",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "3px double #1C3B3A" }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#D98E3C", marginBottom: 4 }}>
            BSEB Class 12 · Study Tracker
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: "bold" }}>Chemistry + Hindi — 34 Days</h2>
            <button onClick={onClose} style={{
              background: "none", border: "1px solid #C9BFA4", color: "#3E5C5A",
              padding: "4px 14px", borderRadius: 3, fontFamily: "'Courier New',monospace",
              fontSize: 11, cursor: "pointer",
            }}>✕ Close</button>
          </div>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: "#3E5C5A", marginTop: 4 }}>
            24 July – 26 August 2026
          </div>
        </div>

        <div style={{ padding: "16px 24px 24px" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: "'Courier New',monospace", color: "#3E5C5A", marginBottom: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#D98E3C", display: "inline-block" }} />
              Chemistry
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#B4544A", display: "inline-block" }} />
              Hindi
            </span>
          </div>

          {/* Progress bars */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { label: "Chemistry", done: chemDone, color: "amber" as const },
              { label: "Hindi",     done: hindiDone, color: "rose" as const },
            ].map(({ label, done, color }) => (
              <div key={label} style={{ flex: 1, minWidth: 200, background: "#FFFDF8", border: "1px solid #C9BFA4", borderRadius: 4, padding: "12px 14px" }}>
                <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                <ProgressBar pct={Math.round((done / DAYS.length) * 100)} color={color} />
                <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: "#3E5C5A", marginTop: 4 }}>
                  {done} / {DAYS.length} days
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#FFFDF8", border: "1px solid #C9BFA4", borderRadius: 4, overflow: "hidden" }}>
              <thead>
                <tr>
                  {["Date", "Chemistry", "Hindi"].map(h => (
                    <th key={h} style={{
                      background: "#1C3B3A", color: "#F6F1E4",
                      fontFamily: "'Courier New',monospace", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 1,
                      padding: "8px 10px", textAlign: "left",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d, i) => {
                  const isToday = i === todayIdx;
                  const chemKey  = `chem-${i}`;
                  const hindiKey = `hindi-${i}`;
                  const chemDone  = !!state[chemKey];
                  const hindiDone = !!state[hindiKey];
                  return (
                    <tr key={i} style={{
                      borderBottom: "1px dashed #C9BFA4",
                      background: isToday ? "#FFF8E8" : i % 2 === 0 ? "#FFFDF8" : "#FBF7EE",
                      outline: isToday ? "2px solid #D98E3C" : "none",
                      outlineOffset: -1,
                    }}>
                      <td style={{ padding: "7px 10px", fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A", whiteSpace: "nowrap", width: 56 }}>
                        {d.date}
                        {isToday && <span style={{ display: "block", fontSize: 9, color: "#D98E3C", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>Today</span>}
                      </td>
                      {[
                        { key: chemKey,  text: d.chem,  done: chemDone,  accentColor: "#D98E3C" },
                        { key: hindiKey, text: d.hindi, done: hindiDone, accentColor: "#B4544A" },
                      ].map(({ key, text, done, accentColor }) => (
                        <td key={key} style={{ padding: "7px 10px", fontSize: 13 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={done}
                              onChange={e => toggle(key, e.target.checked)}
                              style={{ width: 16, height: 16, flexShrink: 0, accentColor, cursor: "pointer" }}
                            />
                            <span style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1, transition: "all .2s" }}>
                              {text}
                            </span>
                          </label>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Reset */}
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button onClick={reset} style={{
              background: "none", border: "1px solid #C9BFA4", color: "#3E5C5A",
              padding: "6px 16px", borderRadius: 3, fontFamily: "'Courier New',monospace",
              fontSize: 11, cursor: "pointer",
            }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "#1C3B3A"; (e.target as HTMLElement).style.color = "#1C3B3A"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "#C9BFA4"; (e.target as HTMLElement).style.color = "#3E5C5A"; }}
            >
              Reset all progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: "#FFFDF8", border: "1px solid #C9BFA4", borderRadius: 4,
      padding: "16px 20px", flex: 1, minWidth: 140,
    }}>
      <div style={{ fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#D98E3C", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: "bold", color: "#1C3B3A", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExamPage() {
  const [showTracker, setShowTracker] = useState(false);
  const [trackerState, setTrackerState] = useState<TrackerState>({});
  const daysLeft = getDaysRemaining();
  const todayIdx = getTodayIndex();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setTrackerState(raw ? JSON.parse(raw) : {});
    } catch { setTrackerState({}); }

    // Keep in sync when tracker closes
    const sync = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setTrackerState(raw ? JSON.parse(raw) : {});
      } catch { /* noop */ }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [showTracker]);

  const chemDone  = DAYS.filter((_, i) => trackerState[`chem-${i}`]).length;
  const hindiDone = DAYS.filter((_, i) => trackerState[`hindi-${i}`]).length;
  const totalDone = chemDone + hindiDone;
  const totalTasks = DAYS.length * 2;
  const overallPct = Math.round((totalDone / totalTasks) * 100);

  const todayChemDone  = !!trackerState[`chem-${todayIdx}`];
  const todayHindiDone = !!trackerState[`hindi-${todayIdx}`];
  const todayData = DAYS[todayIdx];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F6F1E4",
      fontFamily: "'Georgia','Times New Roman',serif",
      color: "#1C3B3A",
      padding: "32px 16px 80px",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* ── Header ── */}
        <header style={{ borderBottom: "3px double #1C3B3A", paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#D98E3C", marginBottom: 4 }}>
            BSEB Class 12 · Science Stream
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: "bold" }}>Exam Prep Dashboard</h1>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: "#3E5C5A" }}>
            24 July – 26 August 2026 &nbsp;·&nbsp; Chemistry &amp; Hindi
          </div>
        </header>

        {/* ── Stat Cards ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard label="Days Left"   value={daysLeft}    sub="until 27 Aug exam" />
          <StatCard label="Completed"   value={`${overallPct}%`} sub={`${totalDone} / ${totalTasks} tasks`} />
          <StatCard label="Chemistry"   value={`${chemDone}/${DAYS.length}`} sub="days done" />
          <StatCard label="Hindi"       value={`${hindiDone}/${DAYS.length}`} sub="days done" />
        </div>

        {/* ── Overall progress bar ── */}
        <div style={{ background: "#FFFDF8", border: "1px solid #C9BFA4", borderRadius: 4, padding: "14px 20px", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Overall Progress</span>
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#D98E3C", fontWeight: "bold" }}>{overallPct}%</span>
          </div>
          <div style={{ height: 12, background: "#C9BFA4", borderRadius: 6, overflow: "hidden" }}>
            <div style={{
              width: `${overallPct}%`, height: "100%",
              background: "linear-gradient(90deg, #F0D3A6, #D98E3C 50%, #B4544A)",
              transition: "width .5s ease",
            }} />
          </div>
        </div>

        {/* ── Today's Plan ── */}
        {todayData && (
          <div style={{ background: "#FFFDF8", border: "2px solid #D98E3C", borderRadius: 4, padding: "16px 20px", marginBottom: 28 }}>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#D98E3C", marginBottom: 8 }}>
              📅 Today — {todayData.date}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#D98E3C", flexShrink: 0 }} />
                <span style={{ fontWeight: "bold" }}>Chemistry:</span>
                <span style={{ textDecoration: todayChemDone ? "line-through" : "none", opacity: todayChemDone ? 0.5 : 1 }}>{todayData.chem}</span>
                {todayChemDone && <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#D98E3C" }}>✓ Done</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#B4544A", flexShrink: 0 }} />
                <span style={{ fontWeight: "bold" }}>Hindi:</span>
                <span style={{ textDecoration: todayHindiDone ? "line-through" : "none", opacity: todayHindiDone ? 0.5 : 1 }}>{todayData.hindi}</span>
                {todayHindiDone && <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#B4544A" }}>✓ Done</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── Main CTA Button ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <button
            onClick={() => setShowTracker(true)}
            style={{
              background: "#1C3B3A", color: "#F6F1E4",
              border: "none", borderRadius: 4,
              padding: "14px 40px", fontSize: 15,
              fontFamily: "'Georgia','Times New Roman',serif",
              fontWeight: "bold", letterSpacing: 0.5,
              cursor: "pointer", transition: "background .2s, transform .1s",
              boxShadow: "0 2px 8px rgba(28,59,58,0.2)",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = "#2E5754"; (e.target as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = "#1C3B3A"; (e.target as HTMLElement).style.transform = "translateY(0)"; }}
          >
            📋 Open Study Tracker
          </button>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A", marginTop: 8 }}>
            Tick each subject as you finish · Progress saves automatically
          </div>
        </div>

        {/* ── Motivational Footer ── */}
        <footer style={{ borderTop: "1px dashed #C9BFA4", paddingTop: 16, textAlign: "center", fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A" }}>
          {daysLeft > 0
            ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} to go — ek din, ek chapter. 💪`
            : "Exam day! Best of luck! 🎯"}
          <br />
          <span style={{ fontSize: 10, opacity: 0.6 }}>studyai.plyndrox.app/exam</span>
        </footer>
      </div>

      {/* ── Tracker Modal ── */}
      {showTracker && <TrackerModal onClose={() => { setShowTracker(false); }} />}
    </div>
  );
}
