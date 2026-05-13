import "./_group.css";
import { useState } from "react";
import { ArrowLeft, Share2, BookOpen, HelpCircle, Zap, Sigma, GitFork, AlertTriangle, Layers, Brain, MessageCircle, FileText, ChevronDown, Download, RotateCcw, Atom, Play } from "lucide-react";

const TABS = [
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "questions", label: "Questions", icon: HelpCircle },
  { id: "flashcards", label: "Flash Cards", icon: Layers },
  { id: "formulas", label: "Formulas", icon: Sigma },
  { id: "mindmap", label: "Mind Map", icon: GitFork },
  { id: "mistakes", label: "Ye Galti", icon: AlertTriangle },
  { id: "simulations", label: "Simulations", icon: Atom },
  { id: "chat", label: "Doubt Chat", icon: MessageCircle },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "exam", label: "Exam Paper", icon: Brain },
];

const NOTE_SECTIONS = [
  { title: "Chapter Overview", words: 320, expanded: true },
  { title: "Electric Flux", words: 540, expanded: false },
  { title: "Gauss's Law", words: 680, expanded: false },
  { title: "Applications of Gauss's Law", words: 890, expanded: false },
];

function NotesContent() {
  return (
    <div style={{ padding: "0 16px" }}>
      {/* Notes meta row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ background: "var(--t2-green-dim)", padding: "3px 10px", borderRadius: 99, fontSize: 11, color: "var(--t2-green-lt)", fontWeight: 700 }}>Detailed</div>
          <span style={{ fontSize: 11, color: "var(--t2-muted)" }}>· 4,594 words</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ width: 32, height: 32, background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Download size={14} color="var(--t2-muted)" />
          </button>
          <button style={{ width: 32, height: 32, background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <RotateCcw size={14} color="var(--t2-muted)" />
          </button>
        </div>
      </div>

      {NOTE_SECTIONS.map((s, i) => (
        <div key={i} style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 14, marginBottom: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: s.expanded ? "var(--t2-green-lt)" : "var(--t2-text)" }}>{s.title}</p>
              <p style={{ fontSize: 11, color: "var(--t2-muted)", marginTop: 2 }}>{s.words} words</p>
            </div>
            <ChevronDown size={16} color="var(--t2-muted2)" style={{ transform: s.expanded ? "rotate(180deg)" : "none" }} />
          </div>
          {s.expanded && (
            <div style={{ padding: "0 14px 14px" }}>
              <p style={{ fontSize: 13, color: "var(--t2-muted)", lineHeight: 1.7 }}>
                विद्युत चुम्बकीय प्रेरण वह घटना है जिसमें किसी चालक में EMF (विद्युत वाहक बल) उत्पन्न होती है जब उससे संबद्ध चुम्बकीय फ्लक्स में परिवर्तन होता है।
              </p>
              <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--t2-bg)", borderRadius: 10, borderLeft: "3px solid var(--t2-green)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t2-green-lt)", marginBottom: 4 }}>Key Formula</p>
                <p style={{ fontSize: 13, color: "var(--t2-text)", fontFamily: "monospace" }}>ε = -dΦ/dt</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QuestionsContent() {
  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {["MCQ", "1 Mark", "2 Marks", "5 Marks", "Assertion", "Case Study", "True/False", "Fill Blank"].map((type) => (
          <div key={type} style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 12, padding: "12px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t2-text)" }}>{type}</span>
            <span style={{ fontSize: 11, color: "var(--t2-green-lt)", fontWeight: 700 }}>→</span>
          </div>
        ))}
      </div>
      <button style={{ width: "100%", background: "var(--t2-green)", border: "none", borderRadius: 14, padding: "14px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        Generate All Questions
      </button>
    </div>
  );
}

export function ChapterPage() {
  const [activeTab, setActiveTab] = useState("notes");

  return (
    <div className="phone-frame">
      {/* Header */}
      <div style={{ background: "var(--t2-bg)", borderBottom: "1px solid var(--t2-border)", padding: "12px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--t2-muted)", fontSize: 13, padding: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <button style={{ width: 32, height: 32, background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Share2 size={14} color="var(--t2-muted)" />
          </button>
        </div>
        {/* Chapter info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#3b82f633", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Atom size={20} color="#3b82f6" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 5, marginBottom: 2 }}>
              <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700 }}>Physics</span>
              <span style={{ fontSize: 11, color: "var(--t2-muted)" }}>· Class 12</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--t2-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Electric Charges and Fields</p>
          </div>
        </div>
      </div>

      {/* Horizontal Tab Scroll */}
      <div style={{ borderBottom: "1px solid var(--t2-border)", background: "var(--t2-bg)", flexShrink: 0, overflowX: "auto", display: "flex", gap: 4, padding: "0 12px" }} className="no-scrollbar">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)} style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", padding: "10px 10px", background: "none", border: "none", borderBottom: active ? "2px solid var(--t2-green-lt)" : "2px solid transparent", color: active ? "var(--t2-green-lt)" : "var(--t2-muted)", fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", flexShrink: 0 }}>
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="content-scroll no-nav">
        {activeTab === "notes" && <NotesContent />}
        {activeTab === "questions" && <QuestionsContent />}
        {activeTab === "simulations" && (
          <div style={{ padding: "20px 16px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#3b82f633", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Play size={26} color="#3b82f6" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--t2-text)", marginBottom: 6 }}>Interactive Simulations</p>
            <p style={{ fontSize: 12, color: "var(--t2-muted)", marginBottom: 16 }}>AI has selected 3 simulations for this chapter</p>
            {["Electric Field Visualizer", "Coulomb's Law Simulator", "Gauss's Law Demo"].map((sim, i) => (
              <div key={i} style={{ background: "var(--t2-card)", border: "1px solid var(--t2-border)", borderRadius: 14, padding: "14px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#3b82f633", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Atom size={16} color="#3b82f6" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--t2-text)" }}>{sim}</p>
                  <p style={{ fontSize: 11, color: "var(--t2-muted)" }}>Interactive · Tap to launch</p>
                </div>
                <Play size={15} color="var(--t2-green-lt)" />
              </div>
            ))}
          </div>
        )}
        {!["notes","questions","simulations"].includes(activeTab) && (
          <div style={{ padding: "40px 16px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--t2-card)", border: "1px solid var(--t2-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              {(() => { const T = TABS.find(t => t.id === activeTab); return T ? <T.icon size={22} color="var(--t2-green-lt)" /> : null; })()}
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--t2-text)", marginBottom: 6 }}>{TABS.find(t => t.id === activeTab)?.label}</p>
            <p style={{ fontSize: 12, color: "var(--t2-muted)", marginBottom: 20 }}>Tap generate to create this content with AI</p>
            <button style={{ background: "var(--t2-green)", border: "none", borderRadius: 14, padding: "13px 28px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Generate with AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
