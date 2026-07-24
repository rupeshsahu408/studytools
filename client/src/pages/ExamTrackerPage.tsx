import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  paper:      "#F6F1E4",
  ink:        "#1C3B3A",
  inkSoft:    "#3E5C5A",
  amber:      "#D98E3C",
  amberSoft:  "#F0D3A6",
  rose:       "#B4544A",
  roseSoft:   "#EBC6C0",
  done:       "#5C8A6A",
  line:       "#C9BFA4",
  card:       "#FFFDF8",
  altRow:     "#FBF7EE",
};

// ─── Chemistry Schedule (chapter-grouped) ─────────────────────────────────────
const CHEM_SCHEDULE = [
  { name: "Solutions",                              dates: ["24 Jul","25 Jul","26 Jul"],                     indices: [0,1,2] },
  { name: "Electrochemistry",                       dates: ["27 Jul","28 Jul","29 Jul"],                     indices: [3,4,5] },
  { name: "Chemical Kinetics",                      dates: ["30 Jul","31 Jul","1 Aug"],                      indices: [6,7,8] },
  { name: "Surface Chemistry",                      dates: ["2 Aug","3 Aug"],                                indices: [9,10] },
  { name: "Isolation of Elements",                  dates: ["4 Aug","5 Aug"],                                indices: [11,12] },
  { name: "p-Block Elements",                       dates: ["6 Aug","7 Aug","8 Aug","9 Aug","10 Aug"],       indices: [13,14,15,16,17] },
  { name: "d and f-Block Elements",                 dates: ["11 Aug","12 Aug","13 Aug","14 Aug"],            indices: [18,19,20,21] },
  { name: "Haloalkanes & Haloarenes",               dates: ["15 Aug","16 Aug","17 Aug"],                     indices: [22,23,24] },
  { name: "Alcohols, Phenols & Ethers",             dates: ["18 Aug","19 Aug","20 Aug"],                     indices: [25,26,27] },
  { name: "Aldehydes, Ketones & Carboxylic Acids",  dates: ["21 Aug","22 Aug","23 Aug","24 Aug"],            indices: [28,29,30,31] },
  { name: "Amines",                                 dates: ["25 Aug"],                                       indices: [32] },
  { name: "Biomolecules",                           dates: ["26 Aug"],                                       indices: [33] },
];

// ─── Hindi Schedule (chapter-grouped) ─────────────────────────────────────────
const HINDI_SCHEDULE = [
  { name: "बातचीत",                   dates: ["24 Jul"],              indices: [0] },
  { name: "उसने कहा था",              dates: ["25 Jul","26 Jul"],     indices: [1,2] },
  { name: "संपूर्ण क्रांति",          dates: ["27 Jul","28 Jul"],     indices: [3,4] },
  { name: "अर्द्धनारीश्वर",           dates: ["29 Jul","30 Jul"],     indices: [5,6] },
  { name: "रोज",                       dates: ["31 Jul","1 Aug"],      indices: [7,8] },
  { name: "एक लेख और एक पत्र",        dates: ["2 Aug"],               indices: [9] },
  { name: "ओ सदानीरा",                dates: ["3 Aug","4 Aug"],       indices: [10,11] },
  { name: "सिपाही की माँ",            dates: ["5 Aug"],               indices: [12] },
  { name: "प्रगीत और समाज",           dates: ["6 Aug","7 Aug"],       indices: [13,14] },
  { name: "जूठन",                     dates: ["8 Aug","9 Aug"],       indices: [15,16] },
  { name: "हँसते हुए मेरा अकेलापन",   dates: ["10 Aug"],              indices: [17] },
  { name: "तिरिछ",                    dates: ["11 Aug","12 Aug"],     indices: [18,19] },
  { name: "शिक्षा",                   dates: ["13 Aug"],              indices: [20] },
  { name: "कड़बक",                    dates: ["14 Aug"],              indices: [21] },
  { name: "सूरदास के पद",             dates: ["15 Aug"],              indices: [22] },
  { name: "तुलसीदास के पद",           dates: ["16 Aug"],              indices: [23] },
  { name: "छप्पय",                    dates: ["17 Aug"],              indices: [24] },
  { name: "कवित्त",                   dates: ["18 Aug"],              indices: [25] },
  { name: "तुमुल कोलाहल कलह में",    dates: ["19 Aug"],              indices: [26] },
  { name: "पुत्र वियोग",              dates: ["20 Aug"],              indices: [27] },
  { name: "उषा",                      dates: ["21 Aug"],              indices: [28] },
  { name: "जन-जन का चेहरा एक",       dates: ["22 Aug"],              indices: [29] },
  { name: "अधिनायक",                  dates: ["23 Aug"],              indices: [30] },
  { name: "प्यारे नन्हें बेटे को",   dates: ["24 Aug"],              indices: [31] },
  { name: "हार-जीत",                  dates: ["25 Aug"],              indices: [32] },
  { name: "गाँव का घर",               dates: ["26 Aug"],              indices: [33] },
];

const TOTAL_DAYS = 34;
const STORAGE_KEY = "exam-tracker-v1";
const START_DATE  = new Date("2026-07-24T00:00:00");

type TrackerState = Record<string, boolean>;
type Tab = "chem" | "hindi";

function getTodayIndex() {
  return Math.min(Math.max(Math.floor((Date.now() - START_DATE.getTime()) / 86400000), 0), TOTAL_DAYS - 1);
}

// ─── Beaker Progress (CSS-based, exact HTML-example style) ───────────────────
function Beaker({ pct, color, softColor, doneDays }: { pct: number; color: string; softColor: string; doneDays: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 20px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 4, marginBottom: 22 }}>

      {/* beaker wrapper — positions the wide rim above the body */}
      <div style={{ position: "relative", width: 46, height: 68, flexShrink: 0 }}>
        {/* wide top rim */}
        <div style={{ position: "absolute", top: 0, left: -5, right: -5, height: 3, background: C.ink, borderRadius: "2px 2px 0 0" }} />
        {/* beaker body: border on 3 sides, rounded bottom, overflow hidden for fill */}
        <div style={{
          position: "absolute", top: 3, left: 0, right: 0, bottom: 0,
          border: `2px solid ${C.ink}`, borderTop: "none",
          borderRadius: "0 0 8px 8px",
          overflow: "hidden", background: "#fff",
        }}>
          {/* liquid fill rising from bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: `${pct}%`,
            background: `linear-gradient(180deg, ${softColor}, ${color})`,
            transition: "height .6s ease",
          }} />
          {/* graduation tick marks */}
          {[25, 50, 75].map(t => (
            <div key={t} style={{
              position: "absolute", bottom: `${t}%`, right: 0,
              width: 7, height: 1, background: `${C.line}CC`,
            }} />
          ))}
        </div>
      </div>

      {/* text beside beaker */}
      <div>
        <div style={{ fontSize: 28, fontWeight: "bold", color: C.ink, lineHeight: 1 }}>{pct}%</div>
        <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: C.inkSoft, marginTop: 5 }}>
          {doneDays} / {TOTAL_DAYS} days done
        </div>
        {pct === 100 && (
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: C.done, marginTop: 4, fontWeight: "bold" }}>
            ✓ Complete!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chapter Card ─────────────────────────────────────────────────────────────
function ChapterCard({
  chapter, subject, state, onToggle, todayIndex, accentColor,
}: {
  chapter: typeof CHEM_SCHEDULE[0];
  subject: Tab;
  state: TrackerState;
  onToggle: (key: string, val: boolean) => void;
  todayIndex: number;
  accentColor: string;
}) {
  const prefix = subject === "chem" ? "chem" : "hindi";
  const doneDays = chapter.indices.filter(i => state[`${prefix}-${i}`]).length;
  const allDone  = doneDays === chapter.indices.length;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 4, marginBottom: 14, overflow: "hidden" }}>
      {/* header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 16px",
        background: allDone ? C.done : C.ink,
        color: C.paper,
        transition: "background .3s",
      }}>
        <span style={{ fontSize: 15, fontWeight: "bold" }}>{chapter.name}</span>
        <span style={{
          fontFamily: "'Courier New',monospace", fontSize: 11,
          color: allDone ? "#d4f0de" : C.amberSoft,
          background: allDone ? "rgba(0,0,0,0.15)" : "transparent",
          padding: allDone ? "2px 8px" : 0,
          borderRadius: 3,
        }}>
          {allDone ? "✓ Complete" : `${doneDays}/${chapter.dates.length} days`}
        </span>
      </div>

      {/* day rows */}
      <div style={{ padding: "4px 16px 6px" }}>
        {chapter.dates.map((date, dIdx) => {
          const globalIdx = chapter.indices[dIdx];
          const key       = `${prefix}-${globalIdx}`;
          const checked   = !!state[key];
          const isToday   = globalIdx === todayIndex;
          return (
            <div key={key} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0",
              borderBottom: dIdx < chapter.dates.length - 1 ? `1px dashed ${C.line}` : "none",
              background: isToday ? "#FFF8E880" : "transparent",
            }}>
              <label style={{ cursor: "pointer", flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => onToggle(key, e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: C.done, cursor: "pointer", flexShrink: 0 }}
                />
                <span style={{
                  fontFamily: "'Courier New',monospace", fontSize: 12,
                  color: isToday ? accentColor : C.inkSoft,
                  width: 54, flexShrink: 0,
                  fontWeight: isToday ? "bold" : "normal",
                }}>
                  {date}
                  {isToday && <span style={{ display: "block", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Today</span>}
                </span>
                <span style={{
                  fontSize: 14,
                  textDecoration: checked ? "line-through" : "none",
                  color: checked ? C.inkSoft : C.ink,
                  opacity: checked ? 0.6 : 1,
                  transition: "all .2s",
                }}>
                  Study session
                </span>
              </label>
              {checked && <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: C.done, flexShrink: 0 }}>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Subject View ─────────────────────────────────────────────────────────────
function SubjectView({
  subject, state, onToggle,
}: {
  subject: Tab;
  state: TrackerState;
  onToggle: (key: string, val: boolean) => void;
}) {
  const schedule    = subject === "chem" ? CHEM_SCHEDULE : HINDI_SCHEDULE;
  const prefix      = subject === "chem" ? "chem" : "hindi";
  const accentColor = subject === "chem" ? C.amber : C.rose;
  const todayIdx    = getTodayIndex();

  const doneDays = Array.from({ length: TOTAL_DAYS }, (_, i) => state[`${prefix}-${i}`]).filter(Boolean).length;
  const pct      = Math.round((doneDays / TOTAL_DAYS) * 100);

  const reset = () => {
    if (!window.confirm(`Reset all ${subject === "chem" ? "Chemistry" : "Hindi"} progress?`)) return;
    const next = { ...state };
    Array.from({ length: TOTAL_DAYS }, (_, i) => { delete next[`${prefix}-${i}`]; });
    onToggle("__reset__" + prefix, false); // triggers re-render via parent
    Array.from({ length: TOTAL_DAYS }, (_, i) => onToggle(`${prefix}-${i}`, false));
  };

  return (
    <div>
      {/* skip note — only for chemistry */}
      {subject === "chem" && (
        <div style={{
          fontFamily: "'Courier New',monospace", fontSize: 12,
          color: C.inkSoft, background: C.amberSoft,
          border: `1px solid ${C.amber}`, borderRadius: 4,
          padding: "8px 14px", marginBottom: 18,
        }}>
          Skipped (already done): Ch.1 Solid State · Ch.9 Coordination Compounds · Ch.15 Polymers · Ch.16 Chemistry in Everyday Life
        </div>
      )}

      {/* skip note — for hindi */}
      {subject === "hindi" && (
        <div style={{
          fontFamily: "'Courier New',monospace", fontSize: 12,
          color: C.inkSoft, background: C.roseSoft,
          border: `1px solid ${C.rose}`, borderRadius: 4,
          padding: "8px 14px", marginBottom: 18,
        }}>
          BSEB Class 12 Hindi · गद्य + पद्य दोनों sections include हैं
        </div>
      )}

      {/* beaker progress */}
      <Beaker pct={pct} color={accentColor} softColor={subject === "chem" ? C.amberSoft : C.roseSoft} doneDays={doneDays} />

      {/* chapter cards */}
      {schedule.map((ch, idx) => (
        <ChapterCard
          key={idx}
          chapter={ch}
          subject={subject}
          state={state}
          onToggle={onToggle}
          todayIndex={todayIdx}
          accentColor={accentColor}
        />
      ))}

      {/* reset */}
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <button
          onClick={reset}
          style={{
            background: "none", border: `1px solid ${C.line}`, color: C.inkSoft,
            padding: "6px 18px", borderRadius: 3,
            fontFamily: "'Courier New',monospace", fontSize: 11, cursor: "pointer",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = C.ink; (e.target as HTMLElement).style.color = C.ink; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = C.line; (e.target as HTMLElement).style.color = C.inkSoft; }}
        >
          Reset {subject === "chem" ? "Chemistry" : "Hindi"} progress
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
    if (key.startsWith("__reset__")) return; // handled inline
    setState(prev => {
      const next = { ...prev, [key]: val };
      if (!val) delete next[key];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };

  const chemDone  = Array.from({ length: TOTAL_DAYS }, (_, i) => state[`chem-${i}`]).filter(Boolean).length;
  const hindiDone = Array.from({ length: TOTAL_DAYS }, (_, i) => state[`hindi-${i}`]).filter(Boolean).length;

  const tabBtn = (t: Tab, label: string, count: number, color: string): React.CSSProperties => ({
    flex: 1,
    padding: "11px 0",
    border: "none",
    borderBottom: tab === t ? `3px solid ${color}` : "3px solid transparent",
    background: tab === t ? C.card : "transparent",
    color: tab === t ? color : C.inkSoft,
    fontFamily: "'Courier New',monospace",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: tab === t ? "bold" : "normal",
    cursor: "pointer",
    transition: "all .2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: "'Georgia','Times New Roman',serif", color: C.ink, padding: "28px 14px 80px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* ── Header ── */}
        <header style={{ borderBottom: "3px double " + C.ink, paddingBottom: 14, marginBottom: 22 }}>
          <button
            onClick={() => navigate("/exam")}
            style={{ background: "none", border: "none", color: C.inkSoft, fontFamily: "'Courier New',monospace", fontSize: 11, cursor: "pointer", padding: 0, marginBottom: 8, letterSpacing: 1 }}
          >
            ← Back to Dashboard
          </button>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.amber, marginBottom: 4 }}>
            BSEB Class 12 · 34-Day Plan
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h1 style={{ margin: "0 0 2px", fontSize: 24, fontWeight: "bold" }}>Study Tracker</h1>
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: C.inkSoft }}>24 July – 26 August 2026</div>
            </div>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: C.inkSoft, textAlign: "right" }}>
              <div>🧪 Chem: {chemDone}/{TOTAL_DAYS}</div>
              <div>📖 Hindi: {hindiDone}/{TOTAL_DAYS}</div>
            </div>
          </div>
        </header>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", background: "#EDE8DA", borderRadius: "4px 4px 0 0", border: `1px solid ${C.line}`, borderBottom: "none" }}>
          <button style={tabBtn("chem",  "🧪 Chemistry", chemDone,  C.amber)} onClick={() => setTab("chem")}>
            🧪 Chemistry {chemDone > 0 && <span style={{ opacity: .65 }}>({chemDone}/{TOTAL_DAYS})</span>}
          </button>
          <button style={tabBtn("hindi", "📖 Hindi",     hindiDone, C.rose)}  onClick={() => setTab("hindi")}>
            📖 Hindi {hindiDone > 0 && <span style={{ opacity: .65 }}>({hindiDone}/{TOTAL_DAYS})</span>}
          </button>
        </div>

        {/* ── Tab content ── */}
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderTop: "none", borderRadius: "0 0 4px 4px", padding: "20px 16px 24px" }}>
          <SubjectView subject={tab} state={state} onToggle={toggle} />
        </div>

        <div style={{ textAlign: "center", marginTop: 18, fontFamily: "'Courier New',monospace", fontSize: 10, color: C.inkSoft, opacity: .6 }}>
          Tick each day as you finish it · Saves automatically to this browser
        </div>
      </div>
    </div>
  );
}
