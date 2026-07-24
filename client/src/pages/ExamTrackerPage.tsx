import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Data ────────────────────────────────────────────────────────────────────
const DAYS = [
  { date: "24 Jul", chem: "Solutions",                             hindi: "बातचीत" },
  { date: "25 Jul", chem: "Solutions",                             hindi: "उसने कहा था" },
  { date: "26 Jul", chem: "Solutions",                             hindi: "उसने कहा था" },
  { date: "27 Jul", chem: "Electrochemistry",                      hindi: "संपूर्ण क्रांति" },
  { date: "28 Jul", chem: "Electrochemistry",                      hindi: "संपूर्ण क्रांति" },
  { date: "29 Jul", chem: "Electrochemistry",                      hindi: "अर्द्धनारीश्वर" },
  { date: "30 Jul", chem: "Chemical Kinetics",                     hindi: "अर्द्धनारीश्वर" },
  { date: "31 Jul", chem: "Chemical Kinetics",                     hindi: "रोज" },
  { date: "1 Aug",  chem: "Chemical Kinetics",                     hindi: "रोज" },
  { date: "2 Aug",  chem: "Surface Chemistry",                     hindi: "एक लेख और एक पत्र" },
  { date: "3 Aug",  chem: "Surface Chemistry",                     hindi: "ओ सदानीरा" },
  { date: "4 Aug",  chem: "Isolation of Elements",                 hindi: "ओ सदानीरा" },
  { date: "5 Aug",  chem: "Isolation of Elements",                 hindi: "सिपाही की माँ" },
  { date: "6 Aug",  chem: "p-Block Elements",                      hindi: "प्रगीत और समाज" },
  { date: "7 Aug",  chem: "p-Block Elements",                      hindi: "प्रगीत और समाज" },
  { date: "8 Aug",  chem: "p-Block Elements",                      hindi: "जूठन" },
  { date: "9 Aug",  chem: "p-Block Elements",                      hindi: "जूठन" },
  { date: "10 Aug", chem: "p-Block Elements",                      hindi: "हँसते हुए मेरा अकेलापन" },
  { date: "11 Aug", chem: "d and f-Block Elements",                hindi: "तिरिछ" },
  { date: "12 Aug", chem: "d and f-Block Elements",                hindi: "तिरिछ" },
  { date: "13 Aug", chem: "d and f-Block Elements",                hindi: "शिक्षा" },
  { date: "14 Aug", chem: "d and f-Block Elements",                hindi: "कड़बक" },
  { date: "15 Aug", chem: "Haloalkanes & Haloarenes",              hindi: "सूरदास के पद" },
  { date: "16 Aug", chem: "Haloalkanes & Haloarenes",              hindi: "तुलसीदास के पद" },
  { date: "17 Aug", chem: "Haloalkanes & Haloarenes",              hindi: "छप्पय" },
  { date: "18 Aug", chem: "Alcohols, Phenols & Ethers",            hindi: "कवित्त" },
  { date: "19 Aug", chem: "Alcohols, Phenols & Ethers",            hindi: "तुमुल कोलाहल कलह में" },
  { date: "20 Aug", chem: "Alcohols, Phenols & Ethers",            hindi: "पुत्र वियोग" },
  { date: "21 Aug", chem: "Aldehydes, Ketones & Carboxylic Acids", hindi: "उषा" },
  { date: "22 Aug", chem: "Aldehydes, Ketones & Carboxylic Acids", hindi: "जन-जन का चेहरा एक" },
  { date: "23 Aug", chem: "Aldehydes, Ketones & Carboxylic Acids", hindi: "अधिनायक" },
  { date: "24 Aug", chem: "Aldehydes, Ketones & Carboxylic Acids", hindi: "प्यारे नन्हें बेटे को" },
  { date: "25 Aug", chem: "Amines",                                hindi: "हार-जीत" },
  { date: "26 Aug", chem: "Biomolecules",                          hindi: "गाँव का घर" },
];

const STORAGE_KEY = "exam-tracker-v1";
const START_DATE  = new Date("2026-07-24T00:00:00");

type Tab = "chem" | "hindi";
type TrackerState = Record<string, boolean>;

function getTodayIndex() {
  const diff = Date.now() - START_DATE.getTime();
  return Math.min(Math.max(Math.floor(diff / 86400000), 0), DAYS.length - 1);
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: "amber" | "rose" }) {
  const fill = color === "amber"
    ? "linear-gradient(90deg,#F0D3A6,#D98E3C)"
    : "linear-gradient(90deg,#EBC6C0,#B4544A)";
  return (
    <div style={{ height: 10, background: "#C9BFA4", borderRadius: 5, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: fill, transition: "width .4s ease" }} />
    </div>
  );
}

// ─── Subject table ────────────────────────────────────────────────────────────
function SubjectTable({
  subject, color, state, onToggle,
}: {
  subject: "chem" | "hindi";
  color: "amber" | "rose";
  state: TrackerState;
  onToggle: (key: string, val: boolean) => void;
}) {
  const todayIdx   = getTodayIndex();
  const accentHex  = color === "amber" ? "#D98E3C" : "#B4544A";
  const label      = subject === "chem" ? "Chemistry" : "Hindi";
  const done       = DAYS.filter((_, i) => state[`${subject}-${i}`]).length;
  const pct        = Math.round((done / DAYS.length) * 100);

  return (
    <div>
      {/* subject progress card */}
      <div style={{ background: "#FFFDF8", border: "1px solid #C9BFA4", borderRadius: 4, padding: "14px 18px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{label} Progress</span>
          <span style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: accentHex, fontWeight: "bold" }}>
            {done} / {DAYS.length} &nbsp;({pct}%)
          </span>
        </div>
        <Bar pct={pct} color={color} />
      </div>

      {/* table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#FFFDF8", border: "1px solid #C9BFA4", borderRadius: 4, overflow: "hidden" }}>
          <thead>
            <tr>
              <th style={{ background: "#1C3B3A", color: "#F6F1E4", fontFamily: "'Courier New',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, padding: "8px 12px", textAlign: "left", width: 70 }}>Date</th>
              <th style={{ background: "#1C3B3A", color: "#F6F1E4", fontFamily: "'Courier New',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, padding: "8px 12px", textAlign: "left" }}>{label}</th>
              <th style={{ background: "#1C3B3A", color: "#F6F1E4", fontFamily: "'Courier New',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, padding: "8px 12px", textAlign: "center", width: 80 }}>Done</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d, i) => {
              const key      = `${subject}-${i}`;
              const checked  = !!state[key];
              const isToday  = i === todayIdx;
              const text     = subject === "chem" ? d.chem : d.hindi;
              return (
                <tr key={i} style={{
                  borderBottom: "1px dashed #C9BFA4",
                  background: isToday ? "#FFF8E8" : i % 2 === 0 ? "#FFFDF8" : "#FBF7EE",
                  outline: isToday ? `2px solid ${accentHex}` : "none",
                  outlineOffset: -1,
                }}>
                  <td style={{ padding: "8px 12px", fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A", whiteSpace: "nowrap", verticalAlign: "middle" }}>
                    {d.date}
                    {isToday && (
                      <span style={{ display: "block", fontSize: 9, color: accentHex, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>Today</span>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: 14, verticalAlign: "middle" }}>
                    <span style={{ textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.45 : 1, transition: "all .2s" }}>
                      {text}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center", verticalAlign: "middle" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => onToggle(key, e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: accentHex, cursor: "pointer" }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ExamTrackerPage() {
  const navigate = useNavigate();
  const [tab, setTab]     = useState<Tab>("chem");
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

  const tabStyle = (active: boolean, color: "amber" | "rose"): React.CSSProperties => ({
    flex: 1,
    padding: "11px 0",
    border: "none",
    borderBottom: active ? `3px solid ${color === "amber" ? "#D98E3C" : "#B4544A"}` : "3px solid transparent",
    background: active ? "#FFFDF8" : "transparent",
    color: active ? (color === "amber" ? "#D98E3C" : "#B4544A") : "#3E5C5A",
    fontFamily: "'Courier New',monospace",
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    fontWeight: active ? "bold" : "normal",
    cursor: "pointer",
    transition: "all .2s",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F6F1E4",
      fontFamily: "'Georgia','Times New Roman',serif",
      color: "#1C3B3A",
      padding: "28px 14px 80px",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* ── Header ── */}
        <header style={{ borderBottom: "3px double #1C3B3A", paddingBottom: 14, marginBottom: 22 }}>
          <button
            onClick={() => navigate("/exam")}
            style={{ background: "none", border: "none", color: "#3E5C5A", fontFamily: "'Courier New',monospace", fontSize: 11, cursor: "pointer", padding: 0, marginBottom: 8, letterSpacing: 1 }}
          >
            ← Back to Dashboard
          </button>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#D98E3C", marginBottom: 4 }}>
            BSEB Class 12 · 34-Day Plan
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: "bold" }}>Study Tracker</h1>
            <div style={{ display: "flex", gap: 10, fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A" }}>
              <span>⬡ Chem: {chemDone}/{DAYS.length}</span>
              <span>⬡ Hindi: {hindiDone}/{DAYS.length}</span>
            </div>
          </div>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A", marginTop: 4 }}>
            24 July – 26 August 2026
          </div>
        </header>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", background: "#EDE8DA", borderRadius: "4px 4px 0 0", border: "1px solid #C9BFA4", borderBottom: "none", marginBottom: 0 }}>
          <button style={tabStyle(tab === "chem", "amber")}  onClick={() => setTab("chem")}>
            🧪 Chemistry &nbsp;{chemDone > 0 && <span style={{ opacity: 0.7 }}>({chemDone}/{DAYS.length})</span>}
          </button>
          <button style={tabStyle(tab === "hindi", "rose")} onClick={() => setTab("hindi")}>
            📖 Hindi &nbsp;{hindiDone > 0 && <span style={{ opacity: 0.7 }}>({hindiDone}/{DAYS.length})</span>}
          </button>
        </div>

        {/* ── Tab content ── */}
        <div style={{ background: "#F6F1E4", border: "1px solid #C9BFA4", borderTop: "none", borderRadius: "0 0 4px 4px", padding: "20px 16px" }}>
          {tab === "chem"
            ? <SubjectTable subject="chem"  color="amber" state={state} onToggle={toggle} />
            : <SubjectTable subject="hindi" color="rose"  state={state} onToggle={toggle} />
          }
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button onClick={reset} style={{
            background: "none", border: "1px solid #C9BFA4", color: "#3E5C5A",
            padding: "6px 18px", borderRadius: 3, fontFamily: "'Courier New',monospace",
            fontSize: 11, cursor: "pointer",
          }}>Reset all progress</button>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "#3E5C5A", opacity: 0.6, marginTop: 8 }}>
            Saves automatically to this browser
          </div>
        </div>
      </div>
    </div>
  );
}
