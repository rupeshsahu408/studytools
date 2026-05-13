import "./_group.css";
import { ArrowLeft, Upload, Link2, FileText, ChevronRight, BookOpen, Atom, FlaskConical, Calculator, Leaf, CheckCircle, X } from "lucide-react";
import { useState } from "react";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];
const CLASSES = ["11", "12"];
const NCERT_CHAPTERS = [
  "Chapter 1: Electric Charges and Fields",
  "Chapter 2: Electrostatic Potential",
  "Chapter 3: Current Electricity",
  "Chapter 4: Moving Charges and Magnetism",
  "Chapter 5: Magnetism and Matter",
];

export function UploadPage() {
  const [tab, setTab] = useState<"upload"|"browse">("upload");
  const [subject, setSubject] = useState("Physics");
  const [classNum, setClassNum] = useState("12");
  const [fileName, setFileName] = useState("");
  const [selectedChapter, setSelectedChapter] = useState<string|null>(null);

  return (
    <div className="phone-frame">
      {/* Header */}
      <div className="top-header">
        <button style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--t2-muted)", fontSize: 13, padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--t2-text)" }}>Add Chapter</span>
        <div style={{ width: 60 }} />
      </div>

      <div className="content-scroll no-nav" style={{ padding: "16px 16px" }}>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "var(--t2-card)", borderRadius: 12, padding: 3, marginBottom: 20 }}>
          {(["upload","browse"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px", borderRadius: 10, background: tab === t ? "var(--t2-green)" : "none", border: "none", color: tab === t ? "#fff" : "var(--t2-muted)", fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {t === "upload" ? <Upload size={13} /> : <BookOpen size={13} />}
              {t === "upload" ? "Upload PDF" : "NCERT Library"}
            </button>
          ))}
        </div>

        {/* Subject selector */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Subject</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => setSubject(s)} style={{ padding: "10px 12px", borderRadius: 12, background: subject === s ? "var(--t2-green-dim)" : "var(--t2-card)", border: subject === s ? "1.5px solid var(--t2-green)" : "1px solid var(--t2-border)", color: subject === s ? "var(--t2-green-lt)" : "var(--t2-muted)", fontSize: 13, fontWeight: subject === s ? 700 : 500, cursor: "pointer", textAlign: "left" }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Class selector */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Class</p>
          <div style={{ display: "flex", gap: 6 }}>
            {CLASSES.map(c => (
              <button key={c} onClick={() => setClassNum(c)} style={{ flex: 1, padding: "10px", borderRadius: 12, background: classNum === c ? "var(--t2-green-dim)" : "var(--t2-card)", border: classNum === c ? "1.5px solid var(--t2-green)" : "1px solid var(--t2-border)", color: classNum === c ? "var(--t2-green-lt)" : "var(--t2-muted)", fontSize: 14, fontWeight: classNum === c ? 700 : 500, cursor: "pointer" }}>
                Class {c}
              </button>
            ))}
          </div>
        </div>

        {tab === "upload" ? (
          <>
            {/* Chapter name input */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Chapter Name</p>
              <input placeholder="e.g. Electromagnetic Induction" style={{ width: "100%", background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 12, padding: "12px 14px", color: "var(--t2-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Drop zone */}
            <div style={{ background: "var(--t2-card)", border: "1.5px dashed var(--t2-border2)", borderRadius: 16, padding: "28px 16px", textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--t2-green-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Upload size={22} color="var(--t2-green-lt)" />
              </div>
              {fileName ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <FileText size={16} color="var(--t2-green-lt)" />
                  <span style={{ fontSize: 13, color: "var(--t2-text)", fontWeight: 600 }}>{fileName}</span>
                  <button onClick={() => setFileName("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t2-muted)" }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--t2-text)", marginBottom: 4 }}>Tap to select PDF</p>
                  <p style={{ fontSize: 12, color: "var(--t2-muted)" }}>or drag and drop · Max 20 MB</p>
                </>
              )}
            </div>

            <button style={{ width: "100%", background: "var(--t2-green)", border: "none", borderRadius: 14, padding: "15px", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Upload & Generate
            </button>
          </>
        ) : (
          <>
            {/* NCERT Chapter list */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{subject} · Class {classNum}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              {NCERT_CHAPTERS.map((ch, i) => (
                <button key={i} onClick={() => setSelectedChapter(ch)} style={{ display: "flex", alignItems: "center", gap: 12, background: selectedChapter === ch ? "var(--t2-green-dim)" : "var(--t2-card)", border: selectedChapter === ch ? "1.5px solid var(--t2-green)" : "1px solid var(--t2-border)", borderRadius: 14, padding: "14px 14px", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: selectedChapter === ch ? "var(--t2-green)" : "var(--t2-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selectedChapter === ch ? <CheckCircle size={15} color="#fff" /> : <BookOpen size={15} color="var(--t2-muted)" />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: selectedChapter === ch ? 700 : 500, color: selectedChapter === ch ? "var(--t2-green-lt)" : "var(--t2-text)", flex: 1 }}>{ch}</span>
                </button>
              ))}
            </div>
            <button style={{ width: "100%", background: selectedChapter ? "var(--t2-green)" : "var(--t2-border)", border: "none", borderRadius: 14, padding: "15px", color: selectedChapter ? "#fff" : "var(--t2-muted)", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              {selectedChapter ? "Use This Chapter" : "Select a Chapter"}
            </button>
          </>
        )}

        {/* Limit note */}
        <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--t2-green-dim)", borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={14} color="var(--t2-green-lt)" />
          <p style={{ fontSize: 11, color: "var(--t2-muted)" }}>3 / 5 chapters used. You can add 2 more chapters.</p>
        </div>
      </div>
    </div>
  );
}
