// ─── PDF Export Utility ───────────────────────────────────────────────────────
// Uses browser print-to-PDF via a dedicated popup window.
// This guarantees perfect Devanagari/Hindi text rendering with zero extra deps.

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escMl(s: string | undefined | null): string {
  return esc(s).replace(/\n/g, "<br>");
}

function openPrintWindow(html: string): void {
  const win = window.open("", "_blank", "width=960,height=760");
  if (!win) {
    alert("Please allow popups for this site to export PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 700);
}

const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans Devanagari', 'Noto Sans', 'Arial Unicode MS', Arial, sans-serif;
    font-size: 10.5pt;
    color: #111827;
    line-height: 1.65;
    background: #fff;
  }
  @media print {
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
    .avoid-break { page-break-inside: avoid; }
    a { text-decoration: none; color: inherit; }
  }
  @media screen {
    body { max-width: 900px; margin: 0 auto; padding: 20px; background: #f8fafc; }
    .doc-wrap { background: #fff; padding: 32px 36px; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
  }

  /* ── Print toolbar ── */
  .print-toolbar {
    position: sticky; top: 0; z-index: 100; display: flex; align-items: center;
    gap: 10px; background: #166534; color: #fff; padding: 10px 20px;
    border-radius: 10px; margin-bottom: 24px;
    font-family: 'Noto Sans', Arial, sans-serif;
  }
  .print-toolbar strong { flex: 1; font-size: 13px; }
  .print-toolbar button {
    font-family: 'Noto Sans', Arial, sans-serif; font-size: 12px; font-weight: 600;
    padding: 6px 16px; border: none; cursor: pointer; border-radius: 7px;
  }
  .btn-save { background: #fff; color: #166534; }
  .btn-close { background: rgba(255,255,255,.15); color: #fff; }

  /* ── Document header ── */
  .doc-header {
    border-bottom: 3px solid #16a34a; padding-bottom: 14px; margin-bottom: 22px;
  }
  .doc-header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .app-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 9pt; font-weight: 700; color: #16a34a; letter-spacing: .3px;
  }
  .app-badge-icon {
    width: 22px; height: 22px; background: #16a34a; border-radius: 5px;
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; font-size: 9pt; font-weight: 900;
  }
  .doc-title { font-size: 17pt; font-weight: 700; color: #111827; margin: 8px 0 4px; line-height: 1.25; }
  .doc-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 9pt; color: #6b7280; }
  .doc-meta span { display: flex; align-items: center; gap: 4px; }
  .meta-dot { width: 3px; height: 3px; border-radius: 50%; background: #d1d5db; }

  /* ── Section heading ── */
  .sec-heading {
    font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: .6px;
    padding: 5px 10px; border-radius: 6px; margin: 18px 0 10px; display: flex; align-items: center; gap: 6px;
  }
  .sh-green  { background: #dcfce7; color: #15803d; }
  .sh-blue   { background: #dbeafe; color: #1d4ed8; }
  .sh-purple { background: #f3e8ff; color: #7e22ce; }
  .sh-orange { background: #ffedd5; color: #c2410c; }
  .sh-amber  { background: #fef9c3; color: #a16207; }
  .sh-gray   { background: #f1f5f9; color: #475569; }
  .sh-teal   { background: #ccfbf1; color: #0f766e; }
  .sh-indigo { background: #e0e7ff; color: #4338ca; }
  .sh-pink   { background: #fce7f3; color: #be185d; }

  /* ── Content blocks ── */
  .overview-box {
    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;
    padding: 14px 16px; margin-bottom: 18px; font-size: 10.5pt; color: #166534; line-height: 1.7;
  }
  .topic-block {
    border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 14px; overflow: hidden;
  }
  .topic-title {
    display: flex; align-items: center; gap: 10px;
    background: #f9fafb; padding: 10px 14px; font-size: 11pt; font-weight: 700; color: #111827;
    border-bottom: 1px solid #e5e7eb;
  }
  .topic-num {
    width: 24px; height: 24px; border-radius: 50%; background: #16a34a; color: #fff;
    font-size: 9pt; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .topic-body { padding: 14px 16px; }
  .topic-content { font-size: 10.5pt; color: #374151; line-height: 1.75; margin-bottom: 12px; }

  .subtopic-item { border-left: 3px solid #86efac; padding-left: 12px; margin-bottom: 10px; }
  .subtopic-title { font-size: 9.5pt; font-weight: 700; color: #15803d; margin-bottom: 3px; }
  .subtopic-content { font-size: 10pt; color: #374151; line-height: 1.7; }

  .formula-box {
    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
    padding: 10px 14px; margin-bottom: 8px;
  }
  .formula-name { font-size: 9.5pt; font-weight: 700; color: #1d4ed8; margin-bottom: 4px; }
  .formula-expr {
    font-family: 'Courier New', Courier, monospace; font-size: 11pt; font-weight: 700;
    color: #1e3a8a; background: #dbeafe; padding: 3px 8px; border-radius: 5px;
    display: inline-block; margin-bottom: 5px;
  }
  .formula-expl { font-size: 9.5pt; color: #4b5563; }

  .derivation-box {
    background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 12px 14px;
  }
  .derivation-step { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; }
  .step-num {
    width: 20px; height: 20px; border-radius: 50%; background: #d8b4fe; color: #7e22ce;
    font-size: 8.5pt; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;
  }
  .step-text { font-size: 10pt; color: #374151; line-height: 1.65; }

  .diagram-box {
    background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;
    padding: 10px 14px; font-size: 10pt; color: #431407; font-style: italic; line-height: 1.7;
  }

  .keypoints-list { list-style: none; }
  .keypoints-list li { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 5px; font-size: 10pt; color: #374151; }
  .kp-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; flex-shrink: 0; margin-top: 6px; }

  .terms-list { display: flex; flex-direction: column; gap: 6px; }
  .term-item { background: #f8fafc; border-radius: 7px; padding: 7px 12px; font-size: 10pt; }
  .term-key { font-weight: 700; color: #15803d; }
  .term-dash { color: #9ca3af; margin: 0 6px; }
  .term-def { color: #374151; }

  .examples-list { display: flex; flex-direction: column; gap: 6px; }
  .example-item {
    background: #fefce8; border: 1px solid #fde68a; border-radius: 7px;
    padding: 8px 12px; font-size: 10pt; color: #374151; line-height: 1.65;
  }

  .summary-box {
    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;
    padding: 14px 16px; font-size: 10.5pt; color: #166534; line-height: 1.75;
  }

  .exam-tips-list { list-style: none; }
  .exam-tip { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; }
  .tip-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
  .tip-text { font-size: 10.5pt; color: #374151; line-height: 1.65; }

  /* ── Question styles ── */
  .qtype-section { margin-bottom: 24px; }
  .q-item {
    border: 1px solid #e5e7eb; border-radius: 9px; padding: 12px 14px;
    margin-bottom: 10px; page-break-inside: avoid;
  }
  .q-row { display: flex; gap: 10px; align-items: flex-start; }
  .q-num {
    width: 22px; height: 22px; border-radius: 50%; background: #e5e7eb;
    font-size: 9pt; font-weight: 700; color: #374151;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;
  }
  .q-text { font-size: 10.5pt; font-weight: 600; color: #111827; line-height: 1.65; flex: 1; }
  .q-reason { font-size: 10pt; color: #4b5563; margin-top: 4px; }
  .q-reason strong { color: #374151; }
  .q-marks { font-size: 8.5pt; font-weight: 700; background: #fee2e2; color: #b91c1c; padding: 2px 7px; border-radius: 10px; white-space: nowrap; margin-left: 6px; }
  .q-marks-amber { background: #fef3c7; color: #92400e; }

  .options-list { list-style: none; margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
  .opt-item {
    font-size: 10pt; color: #374151; padding: 4px 10px; border-radius: 6px; border: 1px solid #e5e7eb;
  }
  .opt-correct { background: #dcfce7; border-color: #86efac; color: #166534; font-weight: 600; }

  .tf-row { display: flex; gap: 8px; margin-top: 7px; }
  .tf-btn {
    padding: 4px 14px; border-radius: 6px; font-size: 10pt; font-weight: 600;
    border: 1px solid #e5e7eb; color: #6b7280; background: #f9fafb;
  }
  .tf-true-correct  { background: #dcfce7; border-color: #86efac; color: #166534; }
  .tf-false-correct { background: #dcfce7; border-color: #86efac; color: #166534; }

  .answer-box {
    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
    padding: 10px 13px; margin-top: 9px;
  }
  .answer-label { font-size: 9pt; font-weight: 700; color: #16a34a; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .4px; }
  .answer-text { font-size: 10pt; color: #374151; line-height: 1.65; }
  .answer-keypoints { list-style: none; margin-top: 6px; }
  .answer-keypoints li { display: flex; gap: 6px; align-items: flex-start; font-size: 9.5pt; color: #4b5563; margin-bottom: 4px; }
  .answer-keypoints li::before { content: "✓"; color: #22c55e; font-weight: 700; flex-shrink: 0; }
  .answer-diagram {
    margin-top: 7px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 7px;
    padding: 8px 12px; font-size: 9.5pt; color: #1e40af;
  }
  .answer-diagram strong { display: block; font-size: 9pt; margin-bottom: 3px; }
  .answer-expl { font-size: 9.5pt; color: #6b7280; font-style: italic; margin-top: 5px; border-top: 1px solid #e5e7eb; padding-top: 5px; }

  .blank-line { display: inline-block; border-bottom: 1.5px solid #374151; min-width: 80px; height: 14px; margin: 0 2px; vertical-align: bottom; }

  .case-block { border: 1px solid #e0e7ff; border-radius: 10px; margin-bottom: 14px; overflow: hidden; }
  .case-header {
    background: #e0e7ff; padding: 8px 14px; font-size: 9.5pt; font-weight: 700;
    color: #3730a3; display: flex; justify-content: space-between;
  }
  .case-para {
    background: #f8fafc; border-bottom: 1px solid #e0e7ff;
    padding: 12px 14px; font-size: 10pt; color: #374151; line-height: 1.75;
  }
  .case-questions { padding: 10px 14px; display: flex; flex-direction: column; gap: 10px; }
  .case-q { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
  .case-q-row { display: flex; gap: 8px; align-items: flex-start; }
  .case-q-num {
    width: 20px; height: 20px; border-radius: 50%; background: #c7d2fe; color: #3730a3;
    font-size: 8.5pt; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;
  }

  .no-qs-msg { color: #9ca3af; font-style: italic; text-align: center; padding: 12px 0; font-size: 10pt; }
  .footer {
    margin-top: 28px; padding-top: 10px; border-top: 1px solid #e5e7eb;
    font-size: 8.5pt; color: #9ca3af; text-align: center;
  }
`;

function makeHeader(title: string, chapterName: string, subject: string, classNum: string, extra?: string): string {
  const now = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return `
  <div class="doc-header">
    <div class="doc-header-top">
      <div>
        <div class="app-badge">
          <span class="app-badge-icon">T2</span>
          Topper 2.0 — Bihar Board Study Notes
        </div>
        <div class="doc-title">${esc(chapterName)}</div>
        <div class="doc-meta">
          <span>📚 ${esc(subject)}</span>
          <span class="meta-dot"></span>
          <span>🏫 Class ${esc(classNum)}</span>
          <span class="meta-dot"></span>
          <span>📄 ${title}</span>
          ${extra ? `<span class="meta-dot"></span><span>${extra}</span>` : ""}
          <span class="meta-dot"></span>
          <span>🗓 ${now}</span>
        </div>
      </div>
    </div>
  </div>`;
}

function makeFooter(chapterName: string): string {
  return `<div class="footer">Topper 2.0 &mdash; AI-powered study notes for Bihar Board &mdash; ${esc(chapterName)}</div>`;
}

// ─── NOTES PDF ────────────────────────────────────────────────────────────────

export function exportNotesPDF(
  notes: any,
  meta: { chapterName: string; subject: string; classNum: string }
): void {
  const { chapterName, subject, classNum } = meta;
  const topics: any[] = notes.topics || [];
  const totalWords = (() => {
    let c = 0;
    const wc = (s: string) => (s || "").trim().split(/\s+/).filter(Boolean).length;
    c += wc(notes.chapterOverview); c += wc(notes.summary);
    (notes.examTips || []).forEach((t: string) => { c += wc(t); });
    topics.forEach((t: any) => {
      c += wc(t.content);
      (t.subTopics || []).forEach((s: any) => { c += wc(s.content); });
      (t.keyPoints || []).forEach((k: string) => { c += wc(k); });
      (t.importantTerms || []).forEach((it: any) => { c += wc(it.definition); });
      (t.formulasUsed || []).forEach((f: any) => { c += wc(f.explanation); });
      (t.derivationSteps || []).forEach((d: string) => { c += wc(d); });
      c += wc(t.diagramDescription);
      (t.examples || []).forEach((ex: string) => { c += wc(ex); });
    });
    return c;
  })();

  let body = "";

  // Chapter Overview
  if (notes.chapterOverview) {
    body += `
    <div class="overview-box avoid-break">
      <strong style="font-size:9pt;text-transform:uppercase;letter-spacing:.5px;color:#15803d;display:block;margin-bottom:6px;">Chapter Overview</strong>
      ${escMl(notes.chapterOverview)}
    </div>`;
  }

  // Topics
  topics.forEach((topic: any, i: number) => {
    const hasFormulas = (topic.formulasUsed || []).length > 0;
    const hasDerivation = (topic.derivationSteps || []).length > 0;
    const hasDiagram = (topic.diagramDescription || "").trim().length > 0;
    const hasSubTopics = (topic.subTopics || []).length > 0;
    const hasKeyPoints = (topic.keyPoints || []).length > 0;
    const hasTerms = (topic.importantTerms || []).length > 0;
    const hasExamples = (topic.examples || []).length > 0;

    body += `<div class="topic-block avoid-break">`;
    body += `<div class="topic-title">
      <span class="topic-num">${i + 1}</span>
      ${esc(topic.title)}
    </div>`;
    body += `<div class="topic-body">`;

    if (topic.content) {
      body += `<div class="topic-content">${escMl(topic.content)}</div>`;
    }

    if (hasSubTopics) {
      body += `<div class="sec-heading sh-green">▶ Sub-Topics</div>`;
      topic.subTopics.forEach((sub: any) => {
        body += `<div class="subtopic-item">
          <div class="subtopic-title">› ${esc(sub.title)}</div>
          <div class="subtopic-content">${escMl(sub.content)}</div>
        </div>`;
      });
    }

    if (hasFormulas) {
      body += `<div class="sec-heading sh-blue">⚗ Formulas &amp; Laws</div>`;
      topic.formulasUsed.forEach((f: any) => {
        body += `<div class="formula-box avoid-break">
          <div class="formula-name">${esc(f.name)}</div>
          <div class="formula-expr">${esc(f.formula)}</div>
          <div class="formula-expl">${escMl(f.explanation)}</div>
        </div>`;
      });
    }

    if (hasDerivation) {
      body += `<div class="sec-heading sh-purple">⤳ Derivation / Proof</div>`;
      body += `<div class="derivation-box avoid-break"><ol style="list-style:none;">`;
      topic.derivationSteps.forEach((step: string, j: number) => {
        body += `<div class="derivation-step">
          <span class="step-num">${j + 1}</span>
          <span class="step-text">${escMl(step)}</span>
        </div>`;
      });
      body += `</ol></div>`;
    }

    if (hasDiagram) {
      body += `<div class="sec-heading sh-orange">📐 Diagram / Experiment</div>`;
      body += `<div class="diagram-box avoid-break">${escMl(topic.diagramDescription)}</div>`;
    }

    if (hasKeyPoints) {
      body += `<div class="sec-heading sh-gray">★ Key Points to Remember</div>`;
      body += `<ul class="keypoints-list">`;
      topic.keyPoints.forEach((pt: string) => {
        body += `<li><span class="kp-dot"></span>${escMl(pt)}</li>`;
      });
      body += `</ul>`;
    }

    if (hasTerms) {
      body += `<div class="sec-heading sh-gray"># Important Terms</div>`;
      body += `<div class="terms-list">`;
      topic.importantTerms.forEach((t: any) => {
        body += `<div class="term-item"><span class="term-key">${esc(t.term)}</span><span class="term-dash">—</span><span class="term-def">${escMl(t.definition)}</span></div>`;
      });
      body += `</div>`;
    }

    if (hasExamples) {
      body += `<div class="sec-heading sh-amber">💡 Examples &amp; Applications</div>`;
      body += `<div class="examples-list">`;
      topic.examples.forEach((ex: string) => {
        body += `<div class="example-item">${escMl(ex)}</div>`;
      });
      body += `</div>`;
    }

    body += `</div></div>`;
  });

  // Summary
  if (notes.summary) {
    body += `<div style="margin-top:20px;" class="avoid-break">`;
    body += `<div class="sec-heading sh-green" style="font-size:11pt;">📋 Chapter Summary</div>`;
    body += `<div class="summary-box">${escMl(notes.summary)}</div>`;
    body += `</div>`;
  }

  // Exam Tips
  if ((notes.examTips || []).length > 0) {
    body += `<div style="margin-top:16px;" class="avoid-break">`;
    body += `<div class="sec-heading sh-amber" style="font-size:11pt;">🎯 Exam Tips</div>`;
    body += `<ul class="exam-tips-list">`;
    notes.examTips.forEach((tip: string) => {
      body += `<div class="exam-tip"><span class="tip-icon">✅</span><span class="tip-text">${escMl(tip)}</span></div>`;
    });
    body += `</ul></div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Notes — ${esc(chapterName)}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="no-print print-toolbar">
    <strong>📖 ${esc(chapterName)} — Notes</strong>
    <button class="btn-save" onclick="window.print()">📥 Save as PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
  <div class="doc-wrap">
    ${makeHeader("Chapter Notes", chapterName, subject, classNum, `${totalWords.toLocaleString()} words · ${topics.length} sections`)}
    ${body}
    ${makeFooter(chapterName)}
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

// ─── QUESTIONS PDF ─────────────────────────────────────────────────────────────

const Q_TYPE_CONFIG: Record<string, { label: string; colorClass: string; icon: string }> = {
  mcq:             { label: "MCQ — Multiple Choice Questions",          colorClass: "sh-blue",   icon: "🔵" },
  oneMarks:        { label: "1 Mark Questions",                         colorClass: "sh-green",  icon: "1️⃣" },
  twoMarks:        { label: "2 Marks Questions",                        colorClass: "sh-purple", icon: "2️⃣" },
  fiveMarks:       { label: "5 Marks Questions",                        colorClass: "sh-orange", icon: "5️⃣" },
  assertionReason: { label: "Assertion-Reason Questions",               colorClass: "sh-amber",  icon: "🔷" },
  caseBased:       { label: "Case-Based Questions",                     colorClass: "sh-indigo", icon: "📄" },
  trueFalse:       { label: "True / False Questions",                   colorClass: "sh-teal",   icon: "✅" },
  fillBlanks:      { label: "Fill in the Blanks",                       colorClass: "sh-pink",   icon: "📝" },
  examImportant:   { label: "Exam Important Questions",                 colorClass: "sh-amber",  icon: "⭐" },
};

const Q_ORDER = ["mcq","oneMarks","twoMarks","fiveMarks","assertionReason","caseBased","trueFalse","fillBlanks","examImportant"];

function renderQAnswer(q: any, qType: string): string {
  const answer = q.answer ?? q.correctAnswer ?? "";
  const hasKeyPoints = (q.keyPoints || []).length > 0;
  const hasExpl = !!(q.explanation);
  const hasDiagram = qType === "fiveMarks" && (q.diagramDescription || "").trim();

  let html = `<div class="answer-box avoid-break">
    <div class="answer-label">Answer</div>
    <div class="answer-text">${escMl(String(answer))}</div>`;

  if (hasKeyPoints) {
    html += `<ul class="answer-keypoints">`;
    q.keyPoints.forEach((kp: string) => {
      html += `<li>${escMl(kp)}</li>`;
    });
    html += `</ul>`;
  }

  if (hasDiagram) {
    html += `<div class="answer-diagram">
      <strong>📐 Diagram</strong>${escMl(q.diagramDescription)}
    </div>`;
  }

  if (hasExpl) {
    html += `<div class="answer-expl">${escMl(q.explanation)}</div>`;
  }

  html += `</div>`;
  return html;
}

function renderMCQOptions(q: any, showAnswer: boolean): string {
  if (!q.options || q.options.length === 0) return "";
  const correct: string = showAnswer ? (q.correctAnswer || "") : "";
  const items = q.options.map((opt: string) => {
    const isCorrect = showAnswer && opt.startsWith(correct);
    return `<li class="opt-item ${isCorrect ? "opt-correct" : ""}">${esc(opt)}</li>`;
  }).join("");
  return `<ul class="options-list">${items}</ul>`;
}

function renderTrueFalseButtons(q: any, showAnswer: boolean): string {
  const isTrue  = showAnswer && q.answer === true;
  const isFalse = showAnswer && q.answer === false;
  return `<div class="tf-row">
    <span class="tf-btn ${isTrue  ? "tf-true-correct"  : ""}">True</span>
    <span class="tf-btn ${isFalse ? "tf-false-correct" : ""}">False</span>
  </div>`;
}

function renderFillBlanksQuestion(q: any): string {
  const text: string = q.question || q.statement || "";
  const blanked = esc(text).replace(/_{3,}|___/g, '<span class="blank-line"></span>');
  return `<span class="q-text">${blanked}</span>`;
}

export function exportQuestionsPDF(
  questions: Record<string, any[]>,
  meta: { chapterName: string; subject: string; classNum: string },
  options: { showAnswers: boolean }
): void {
  const { chapterName, subject, classNum } = meta;
  const { showAnswers } = options;

  const totalQs = Q_ORDER.reduce((sum, key) => {
    const arr = questions[key] || [];
    if (key === "caseBased") return sum + arr.reduce((s: number, set: any) => s + (set.questions?.length || 0), 0);
    return sum + arr.length;
  }, 0);

  let body = "";

  Q_ORDER.forEach((key) => {
    const arr = questions[key] || [];
    if (arr.length === 0) return;

    const cfg = Q_TYPE_CONFIG[key];
    body += `<div class="qtype-section">`;
    body += `<div class="sec-heading ${cfg.colorClass}" style="font-size:11pt;">${cfg.icon} ${cfg.label}</div>`;

    if (key === "caseBased") {
      arr.forEach((set: any, setIdx: number) => {
        const totalMarks = (set.questions || []).reduce((s: number, q: any) => s + (q.marks || 0), 0);
        body += `<div class="case-block avoid-break">
          <div class="case-header">
            <span>Case Study ${setIdx + 1}</span>
            <span>${(set.questions || []).length} sub-questions · ${totalMarks} marks</span>
          </div>
          <div class="case-para">${escMl(set.paragraph)}</div>
          <div class="case-questions">`;

        (set.questions || []).forEach((q: any, qIdx: number) => {
          body += `<div class="case-q">
            <div class="case-q-row">
              <span class="case-q-num">${qIdx + 1}</span>
              <div style="flex:1;">
                <div class="q-text">${escMl(q.question)} <span class="q-marks">[${q.marks}M]</span></div>
                ${showAnswers ? renderQAnswer(q, "caseBased") : ""}
              </div>
            </div>
          </div>`;
        });

        body += `</div></div>`;
      });

    } else {
      arr.forEach((q: any, i: number) => {
        const questionText = q.question || q.statement || q.assertion || "";
        const marksTag = (key === "fiveMarks") ? `<span class="q-marks">[5M]</span>` :
          (key === "twoMarks") ? `<span class="q-marks" style="background:#f3e8ff;color:#7e22ce">[2M]</span>` :
          (key === "examImportant" && q.marks) ? `<span class="q-marks q-marks-amber">[${q.marks}M]</span>` : "";

        body += `<div class="q-item avoid-break">
          <div class="q-row">
            <span class="q-num">${i + 1}</span>
            <div style="flex:1;">`;

        if (key === "fillBlanks") {
          body += renderFillBlanksQuestion(q);
        } else {
          body += `<div class="q-text">${escMl(questionText)} ${marksTag}</div>`;
        }

        if (key === "assertionReason" && q.reason) {
          body += `<div class="q-reason"><strong>Reason:</strong> ${escMl(q.reason)}</div>`;
        }

        if (key === "twoMarks" && q.type) {
          body += `<div style="margin-top:4px;"><span style="font-size:9pt;background:#f3e8ff;color:#7e22ce;padding:2px 8px;border-radius:8px;font-weight:600;">${esc(q.type)}</span></div>`;
        }

        if (key === "mcq" || key === "assertionReason") {
          body += renderMCQOptions(q, showAnswers);
        }

        if (key === "trueFalse") {
          body += renderTrueFalseButtons(q, showAnswers);
        }

        if (showAnswers) {
          if (key === "mcq" || key === "assertionReason") {
            if (q.explanation) {
              body += `<div class="answer-expl" style="margin-top:8px;padding:6px 10px;background:#f8fafc;border-radius:7px;">
                <strong style="color:#16a34a;">Correct: ${esc(q.correctAnswer)}</strong> — ${escMl(q.explanation)}
              </div>`;
            }
          } else if (key !== "trueFalse" || !q.explanation) {
            body += renderQAnswer(q, key);
          } else {
            body += `<div class="answer-box" style="margin-top:8px;">
              <div class="answer-label">Answer: ${q.answer === true ? "TRUE" : "FALSE"}</div>
              ${q.explanation ? `<div class="answer-expl" style="border:none;padding:0;margin:0;">${escMl(q.explanation)}</div>` : ""}
            </div>`;
          }
        }

        body += `</div></div></div>`;
      });
    }

    body += `</div>`;
  });

  if (!body) {
    body = `<div class="no-qs-msg">No questions available for this chapter.</div>`;
  }

  const modeLabel = showAnswers ? "With Answer Key" : "Without Answers (Exam Mode)";

  const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Questions — ${esc(chapterName)}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="no-print print-toolbar">
    <strong>❓ ${esc(chapterName)} — Question Bank ${showAnswers ? "(With Answers)" : "(Exam Mode)"}</strong>
    <button class="btn-save" onclick="window.print()">📥 Save as PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
  <div class="doc-wrap">
    ${makeHeader("Question Bank", chapterName, subject, classNum, `${totalQs} questions · ${modeLabel}`)}
    ${body}
    ${makeFooter(chapterName)}
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
