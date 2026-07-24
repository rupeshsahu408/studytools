import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
const EXAM_DATE   = new Date("2026-08-27T00:00:00");
const START_DATE  = new Date("2026-07-24T00:00:00");

type TrackerState = Record<string, boolean>;

function getDaysRemaining() {
  return Math.max(0, Math.ceil((EXAM_DATE.getTime() - Date.now()) / 86400000));
}
function getTodayIndex() {
  return Math.min(Math.max(Math.floor((Date.now() - START_DATE.getTime()) / 86400000), 0), DAYS.length - 1);
}

function getCountdown() {
  const diff = Math.max(0, EXAM_DATE.getTime() - Date.now());
  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

function CountdownUnit({ value, label, flash }: { value: number; label: string; flash: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 62 }}>
      <div
        style={{
          background: "#1C3B3A",
          color: "#F0D3A6",
          borderRadius: 6,
          padding: "10px 14px",
          fontFamily: "'Courier New',monospace",
          fontSize: 32,
          fontWeight: "bold",
          lineHeight: 1,
          minWidth: 62,
          textAlign: "center",
          letterSpacing: 1,
          boxShadow: "0 4px 12px rgba(28,59,58,0.25)",
          transition: "transform 0.12s ease, color 0.12s ease",
          transform: flash ? "scale(1.08)" : "scale(1)",
          color: flash ? "#D98E3C" : "#F0D3A6",
        } as React.CSSProperties}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div style={{ fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#3E5C5A", marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: "#FFFDF8", border: "1px solid #C9BFA4", borderRadius: 4, padding: "16px 20px", flex: 1, minWidth: 130 }}>
      <div style={{ fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#D98E3C", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: "bold", color: "#1C3B3A", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function ExamPage() {
  const navigate = useNavigate();
  const [trackerState, setTrackerState] = useState<TrackerState>({});
  const [countdown, setCountdown] = useState(getCountdown());
  const [flashSec, setFlashSec] = useState(false);
  const [flashMin, setFlashMin] = useState(false);
  const prevSecRef = useRef(countdown.seconds);
  const prevMinRef = useRef(countdown.minutes);
  const daysLeft = getDaysRemaining();
  const todayIdx = getTodayIndex();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setTrackerState(raw ? JSON.parse(raw) : {});
    } catch { setTrackerState({}); }
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      const next = getCountdown();
      setCountdown(next);
      if (next.seconds !== prevSecRef.current) {
        prevSecRef.current = next.seconds;
        setFlashSec(true);
        setTimeout(() => setFlashSec(false), 120);
      }
      if (next.minutes !== prevMinRef.current) {
        prevMinRef.current = next.minutes;
        setFlashMin(true);
        setTimeout(() => setFlashMin(false), 200);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const chemDone   = DAYS.filter((_, i) => trackerState[`chem-${i}`]).length;
  const hindiDone  = DAYS.filter((_, i) => trackerState[`hindi-${i}`]).length;
  const totalDone  = chemDone + hindiDone;
  const totalTasks = DAYS.length * 2;
  const overallPct = Math.round((totalDone / totalTasks) * 100);

  const todayData      = DAYS[todayIdx];
  const todayChemDone  = !!trackerState[`chem-${todayIdx}`];
  const todayHindiDone = !!trackerState[`hindi-${todayIdx}`];

  return (
    <div style={{ minHeight: "100vh", background: "#F6F1E4", fontFamily: "'Georgia','Times New Roman',serif", color: "#1C3B3A", padding: "32px 16px 80px" }}>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.15} }`}</style>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <header style={{ borderBottom: "3px double #1C3B3A", paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#D98E3C", marginBottom: 4 }}>
            BSEB Class 12 · Science Stream
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: "bold" }}>Exam Prep Dashboard</h1>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, color: "#3E5C5A" }}>
            24 July – 26 August 2026 &nbsp;·&nbsp; Chemistry &amp; Hindi
          </div>
        </header>

        {/* Animated Countdown Timer */}
        <div style={{ background: "#FFFDF8", border: "2px solid #1C3B3A", borderRadius: 8, padding: "20px 16px", marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#D98E3C", marginBottom: 16 }}>
            ⏳ Exam Countdown — 27 August 2026
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <CountdownUnit value={countdown.days}    label="Days"    flash={false} />
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#C9BFA4", paddingTop: 10, fontFamily: "'Courier New',monospace", animation: "blink 1s step-end infinite" }}>:</div>
            <CountdownUnit value={countdown.hours}   label="Hours"   flash={false} />
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#C9BFA4", paddingTop: 10, fontFamily: "'Courier New',monospace", animation: "blink 1s step-end infinite" }}>:</div>
            <CountdownUnit value={countdown.minutes} label="Minutes" flash={flashMin} />
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#C9BFA4", paddingTop: 10, fontFamily: "'Courier New',monospace", animation: "blink 1s step-end infinite" }}>:</div>
            <CountdownUnit value={countdown.seconds} label="Seconds" flash={flashSec} />
          </div>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A", marginTop: 14, letterSpacing: 1 }}>
            {countdown.days > 0 ? `${countdown.days} din baaki — Karo mehnat, results aayenge! 💪` : "Aaj hai exam! All the best! 🎯"}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard label="Days Left"  value={daysLeft}          sub="until 27 Aug exam" />
          <StatCard label="Completed"  value={`${overallPct}%`} sub={`${totalDone} / ${totalTasks} tasks`} />
          <StatCard label="Chemistry"  value={`${chemDone}/${DAYS.length}`}  sub="days done" />
          <StatCard label="Hindi"      value={`${hindiDone}/${DAYS.length}`} sub="days done" />
        </div>

        {/* Overall progress */}
        <div style={{ background: "#FFFDF8", border: "1px solid #C9BFA4", borderRadius: 4, padding: "14px 20px", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Overall Progress</span>
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#D98E3C", fontWeight: "bold" }}>{overallPct}%</span>
          </div>
          <div style={{ height: 12, background: "#C9BFA4", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${overallPct}%`, height: "100%", background: "linear-gradient(90deg,#F0D3A6,#D98E3C 50%,#B4544A)", transition: "width .5s ease" }} />
          </div>
        </div>

        {/* Today's plan */}
        {todayData && (
          <div style={{ background: "#FFFDF8", border: "2px solid #D98E3C", borderRadius: 4, padding: "16px 20px", marginBottom: 28 }}>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#D98E3C", marginBottom: 10 }}>
              📅 Today — {todayData.date}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Chemistry", text: todayData.chem,  done: todayChemDone,  color: "#D98E3C" },
                { label: "Hindi",     text: todayData.hindi, done: todayHindiDone, color: "#B4544A" },
              ].map(({ label, text, done, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontWeight: "bold" }}>{label}:</span>
                  <span style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1 }}>{text}</span>
                  {done && <span style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color }}>✓ Done</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Books download button */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <a
            href="https://biharboardbooks.com/download/#1l1QJI0tUo5OO7JJ-bDoHXNnq3PPNuEkm"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#2E7D32", color: "#fff",
              border: "none", borderRadius: 4,
              padding: "8px 18px", fontSize: 13,
              fontFamily: "'Courier New',monospace",
              fontWeight: "bold", letterSpacing: 0.5,
              cursor: "pointer", textDecoration: "none",
              boxShadow: "0 2px 8px rgba(46,125,50,0.3)",
            }}
          >
            📚 BSEB Books Download
          </a>
        </div>

        {/* CTA button — navigates to /exam/tracker */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <button
            onClick={() => navigate("/exam/tracker")}
            style={{
              background: "#1C3B3A", color: "#F6F1E4",
              border: "none", borderRadius: 4,
              padding: "14px 44px", fontSize: 15,
              fontFamily: "'Georgia','Times New Roman',serif",
              fontWeight: "bold", letterSpacing: 0.5,
              cursor: "pointer", transition: "background .2s, transform .15s",
              boxShadow: "0 2px 10px rgba(28,59,58,0.25)",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = "#2E5754"; (e.target as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = "#1C3B3A"; (e.target as HTMLElement).style.transform = "translateY(0)"; }}
          >
            📋 Open Study Tracker
          </button>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A", marginTop: 8 }}>
            Tick each subject as you finish · Progress saves automatically
          </div>
        </div>

        {/* Footer */}
        <footer style={{ borderTop: "1px dashed #C9BFA4", paddingTop: 16, textAlign: "center", fontFamily: "'Courier New',monospace", fontSize: 11, color: "#3E5C5A" }}>
          {daysLeft > 0
            ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} to go — ek din, ek chapter. 💪`
            : "Exam day! Best of luck! 🎯"}
          <br />
          <span style={{ fontSize: 10, opacity: 0.6 }}>studyai.plyndrox.app/exam</span>
        </footer>
      </div>
    </div>
  );
}
