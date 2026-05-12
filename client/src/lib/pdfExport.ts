// ─── PDF Export Utility ───────────────────────────────────────────────────────
// Uses a Blob URL opened in a new tab + browser print-to-PDF.
// Blob URL approach avoids popup blockers on mobile and desktop alike.
// Perfect Devanagari/Hindi text rendering — zero extra dependencies.
// The user manually taps "Save as PDF" inside the new tab, which is a direct
// user gesture — this is the only approach that works reliably on iOS Safari.

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
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke after a generous delay so the tab has time to load the resource
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch {
    // Final fallback — should rarely be needed
    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups or new tabs for this site to export PDF."); return; }
    win.document.write(html);
    win.document.close();
  }
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

// ─── SUMMARY / QUICK REVISION PDF ────────────────────────────────────────────

const SUMMARY_EXTRA = `
  .essence-box { background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:14px 16px; margin-bottom:14px; }
  .essence-label { font-size:9pt; font-weight:700; color:#1d4ed8; text-transform:uppercase; letter-spacing:.5px; margin-bottom:5px; }
  .essence-text { font-size:10.5pt; color:#1e40af; line-height:1.75; }

  .priority-high   { border-left:4px solid #ef4444; background:#fef2f2; }
  .priority-medium { border-left:4px solid #f59e0b; background:#fffbeb; }
  .priority-low    { border-left:4px solid #9ca3af; background:#f9fafb; }
  .pbadge-high   { background:#fee2e2; color:#b91c1c; font-size:8.5pt; font-weight:700; padding:2px 8px; border-radius:9px; white-space:nowrap; }
  .pbadge-medium { background:#fef3c7; color:#92400e; font-size:8.5pt; font-weight:700; padding:2px 8px; border-radius:9px; white-space:nowrap; }
  .pbadge-low    { background:#f3f4f6; color:#4b5563; font-size:8.5pt; font-weight:700; padding:2px 8px; border-radius:9px; white-space:nowrap; }
  .concept-card { border-radius:9px; padding:12px 14px; margin-bottom:8px; }
  .concept-top  { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:5px; }
  .concept-title { font-size:11pt; font-weight:700; color:#111827; }
  .concept-expl  { font-size:10pt; color:#374151; line-height:1.7; }
  .concept-kf    { font-family:'Courier New',monospace; font-size:11pt; font-weight:700; color:#15803d; background:#dcfce7; padding:3px 9px; border-radius:6px; display:inline-block; margin-top:6px; }

  .fsnap-panel { background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; padding:14px; }
  .fsnap-item  { display:flex; gap:10px; align-items:flex-start; margin-bottom:10px; }
  .fsnap-num   { width:22px; height:22px; border-radius:6px; background:#dcfce7; border:1px solid #86efac; display:flex; align-items:center; justify-content:center; font-size:9pt; font-weight:700; color:#15803d; flex-shrink:0; margin-top:2px; }
  .fsnap-formula { font-family:'Courier New',monospace; font-size:11pt; font-weight:700; color:#15803d; line-height:1.4; }
  .fsnap-ctx   { font-size:9.5pt; color:#6b7280; margin-top:2px; line-height:1.5; }

  .spotlight-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
  @media print, (max-width:640px) { .spotlight-grid { grid-template-columns:1fr; } }
  .spot-card   { border-radius:9px; padding:12px 14px; }
  .spot-red    { background:#fef2f2; border:1px solid #fecaca; }
  .spot-purple { background:#faf5ff; border:1px solid #e9d5ff; }
  .spot-amber  { background:#fffbeb; border:1px solid #fde68a; }
  .spot-label  { font-size:9pt; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
  .sl-red    { color:#dc2626; }
  .sl-purple { color:#7c3aed; }
  .sl-amber  { color:#d97706; }
  .spot-li   { display:flex; gap:6px; align-items:flex-start; margin-bottom:5px; font-size:10pt; color:#374151; line-height:1.6; }
  .spot-num  { width:16px; height:16px; border-radius:50%; font-size:8pt; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
  .sn-red    { background:#fee2e2; color:#dc2626; }
  .spot-dot  { width:6px; height:6px; border-radius:50%; background:#a78bfa; flex-shrink:0; margin-top:7px; }
  .spot-warn { font-weight:700; color:#d97706; flex-shrink:0; }

  .revision-list { background:#fff; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
  .revision-item { display:flex; gap:10px; align-items:flex-start; padding:10px 14px; border-bottom:1px solid #f3f4f6; }
  .revision-item:last-child { border-bottom:none; }
  .rev-num  { width:20px; height:20px; border-radius:50%; background:#f3f4f6; font-size:9pt; font-weight:700; color:#6b7280; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
  .rev-check { width:16px; height:16px; border:2px solid #d1d5db; border-radius:4px; flex-shrink:0; margin-top:3px; background:#fff; }
  .rev-text  { font-size:10.5pt; color:#374151; line-height:1.65; }
`;

export function exportSummaryPDF(
  summary: any,
  meta: { chapterName: string; subject: string; classNum: string }
): void {
  const { chapterName, subject, classNum } = meta;
  const concepts = [...(summary.concepts || [])].sort((a: any, b: any) => {
    const o: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (o[a.examWeight] ?? 1) - (o[b.examWeight] ?? 1);
  });

  let body = "";

  if (summary.chapterEssence) {
    body += `<div class="essence-box avoid-break">
      <div class="essence-label">🧠 Chapter Essence</div>
      <div class="essence-text">${escMl(summary.chapterEssence)}</div>
    </div>`;
  }

  if (concepts.length > 0) {
    body += `<div class="sec-heading sh-green" style="font-size:11pt;">🎯 Key Concepts (${concepts.length})</div>`;
    concepts.forEach((c: any) => {
      const w = c.examWeight === "high" ? "high" : c.examWeight === "low" ? "low" : "medium";
      const bl = w === "high" ? "High Priority" : w === "medium" ? "Medium Priority" : "Good to Know";
      body += `<div class="concept-card priority-${w} avoid-break">
        <div class="concept-top">
          <span class="concept-title">${esc(c.title)}</span>
          <span class="pbadge-${w}">${bl}</span>
        </div>
        <div class="concept-expl">${escMl(c.explanation)}</div>
        ${c.keyFormula ? `<div><span class="concept-kf">${esc(c.keyFormula)}</span></div>` : ""}
      </div>`;
    });
  }

  if ((summary.formulaSnapshot || []).length > 0) {
    body += `<div class="sec-heading sh-green" style="font-size:11pt;">⚡ Formula Snapshot</div>
    <div class="fsnap-panel avoid-break">`;
    summary.formulaSnapshot.forEach((item: any, i: number) => {
      body += `<div class="fsnap-item">
        <span class="fsnap-num">${i + 1}</span>
        <div style="flex:1;">
          <div class="fsnap-formula">${esc(item.formula)}</div>
          <div class="fsnap-ctx">${esc(item.context)}</div>
        </div>
      </div>`;
    });
    body += `</div>`;
  }

  if (summary.examSpotlight) {
    const es = summary.examSpotlight;
    body += `<div class="sec-heading sh-amber" style="font-size:11pt;">📊 Exam Spotlight</div>
    <div class="spotlight-grid">`;
    if ((es.highValueTopics || []).length > 0) {
      body += `<div class="spot-card spot-red avoid-break">
        <div class="spot-label sl-red">🔥 High Value Topics</div>`;
      es.highValueTopics.forEach((t: string, i: number) => {
        body += `<div class="spot-li"><span class="spot-num sn-red">${i + 1}</span><span>${esc(t)}</span></div>`;
      });
      body += `</div>`;
    }
    if ((es.questionPatterns || []).length > 0) {
      body += `<div class="spot-card spot-purple avoid-break">
        <div class="spot-label sl-purple">👁 Question Patterns</div>`;
      es.questionPatterns.forEach((p: string) => {
        body += `<div class="spot-li"><span class="spot-dot" style="margin-top:8px;"></span><span>${esc(p)}</span></div>`;
      });
      body += `</div>`;
    }
    if ((es.mustMemorize || []).length > 0) {
      body += `<div class="spot-card spot-amber avoid-break">
        <div class="spot-label sl-amber">⭐ Must Memorize</div>`;
      es.mustMemorize.forEach((m: string) => {
        body += `<div class="spot-li"><span class="spot-warn">!</span><span style="font-weight:600;">${esc(m)}</span></div>`;
      });
      body += `</div>`;
    }
    body += `</div>`;
  }

  if ((summary.lastNightRevision || []).length > 0) {
    body += `<div class="sec-heading sh-gray" style="font-size:11pt;margin-top:16px;">🌙 Last Night Revision Checklist</div>
    <div class="revision-list">`;
    summary.lastNightRevision.forEach((point: string, i: number) => {
      body += `<div class="revision-item">
        <span class="rev-num">${i + 1}</span>
        <span class="rev-check"></span>
        <span class="rev-text">${escMl(point)}</span>
      </div>`;
    });
    body += `</div>`;
  }

  const stats = [
    `${summary.readTime || "?"}min read`,
    `${concepts.length} concepts`,
    `${(summary.formulaSnapshot || []).length} formulas`,
    `${(summary.lastNightRevision || []).length} revision pts`,
  ].join(" · ");

  const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Quick Revision — ${esc(chapterName)}</title>
  <style>${BASE_STYLES}${SUMMARY_EXTRA}</style>
</head>
<body>
  <div class="no-print print-toolbar">
    <strong>⚡ ${esc(chapterName)} — Quick Revision</strong>
    <button class="btn-save" onclick="window.print()">📥 Save as PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
  <div class="doc-wrap">
    ${makeHeader("Quick Revision", chapterName, subject, classNum, stats)}
    ${body}
    ${makeFooter(chapterName)}
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

// ─── FORMULA SHEET PDF ────────────────────────────────────────────────────────

const FORMULA_EXTRA = `
  .formula-card { border:1px solid #e5e7eb; border-radius:10px; padding:14px 16px; margin-bottom:12px; }
  .formula-card-header { display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; }
  .formula-idx { width:26px; height:26px; border-radius:8px; background:#dcfce7; border:1px solid #86efac; display:flex; align-items:center; justify-content:center; font-size:9pt; font-weight:700; color:#15803d; flex-shrink:0; }
  .formula-name { font-size:11pt; font-weight:700; color:#111827; line-height:1.3; }
  .formula-sec-tag { font-size:8.5pt; color:#6b7280; margin-top:2px; }
  .formula-expr-wrap { background:#f1f5f9; border:1px solid #e2e8f0; border-radius:9px; padding:12px 16px; margin-bottom:10px; text-align:center; }
  .formula-expr-text { font-family:'Courier New','Lucida Console',monospace; font-size:14pt; font-weight:700; color:#0f172a; letter-spacing:0.5px; word-break:break-word; }
  .formula-si { display:inline-flex; align-items:center; gap:6px; margin-bottom:10px; }
  .formula-si-label { font-size:9pt; color:#6b7280; }
  .formula-si-val { font-size:9.5pt; font-weight:600; background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; padding:2px 9px; border-radius:9px; }
  .vars-table { width:100%; border-collapse:collapse; margin-bottom:10px; font-size:9.5pt; }
  .vars-table th { background:#f8fafc; color:#6b7280; font-size:8.5pt; text-transform:uppercase; letter-spacing:.4px; padding:5px 9px; text-align:left; border-bottom:1px solid #e5e7eb; }
  .vars-table td { padding:5px 9px; border-bottom:1px solid #f3f4f6; color:#374151; vertical-align:top; }
  .var-symbol { font-family:'Courier New',monospace; font-weight:700; color:#15803d; }
  .var-unit { color:#6b7280; font-size:9pt; }
  .deriv-box { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:9px 12px; margin-top:6px; font-size:9.5pt; color:#374151; line-height:1.65; }
  .deriv-label { font-size:9pt; font-weight:700; color:#d97706; margin-bottom:3px; }
  .sec-divider { font-size:10pt; font-weight:700; color:#475569; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:7px; padding:6px 12px; margin:16px 0 10px; }
`;

export function exportFormulasPDF(
  formulas: any[],
  meta: { chapterName: string; subject: string; classNum: string }
): void {
  const { chapterName, subject, classNum } = meta;
  if (!formulas || formulas.length === 0) return;

  const grouped = new Map<string, any[]>();
  formulas.forEach(f => {
    const sec = (f.chapter_section || "General").trim();
    if (!grouped.has(sec)) grouped.set(sec, []);
    grouped.get(sec)!.push(f);
  });
  const multiSec = grouped.size > 1;

  let idx = 0;
  let body = "";

  grouped.forEach((group, section) => {
    if (multiSec) body += `<div class="sec-divider">📑 ${esc(section)}</div>`;
    group.forEach(f => {
      idx++;
      const plainText = f.plain_text || f.latex || "";
      const hasVars = (f.variables || []).length > 0;
      body += `<div class="formula-card avoid-break">
        <div class="formula-card-header">
          <span class="formula-idx">${idx}</span>
          <div style="flex:1;">
            <div class="formula-name">${esc(f.name)}</div>
            ${f.chapter_section && !multiSec ? `<div class="formula-sec-tag">📖 ${esc(f.chapter_section)}</div>` : ""}
          </div>
        </div>
        <div class="formula-expr-wrap">
          <div class="formula-expr-text">${esc(plainText)}</div>
        </div>
        ${f.si_unit ? `<div class="formula-si"><span class="formula-si-label">SI Unit:</span><span class="formula-si-val">${esc(f.si_unit)}</span></div>` : ""}
        ${hasVars ? `<table class="vars-table">
          <thead><tr><th>Symbol</th><th>Meaning</th><th>Unit</th></tr></thead>
          <tbody>${f.variables.map((v: any) => `<tr>
            <td><span class="var-symbol">${esc(v.symbol)}</span></td>
            <td>${esc(v.meaning)}</td>
            <td class="var-unit">${esc(v.unit)}</td>
          </tr>`).join("")}</tbody>
        </table>` : ""}
        ${f.derivation_hint ? `<div class="deriv-box"><div class="deriv-label">💡 Derivation Hint</div>${escMl(f.derivation_hint)}</div>` : ""}
      </div>`;
    });
  });

  const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Formula Sheet — ${esc(chapterName)}</title>
  <style>${BASE_STYLES}${FORMULA_EXTRA}</style>
</head>
<body>
  <div class="no-print print-toolbar">
    <strong>Σ ${esc(chapterName)} — Formula Sheet</strong>
    <button class="btn-save" onclick="window.print()">📥 Save as PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
  <div class="doc-wrap">
    ${makeHeader("Formula Sheet", chapterName, subject, classNum, `${formulas.length} formulas`)}
    ${body}
    ${makeFooter(chapterName)}
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

// ─── CONCEPT MAP PDF ──────────────────────────────────────────────────────────

const MINDMAP_EXTRA = `
  .mm-stats { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px; }
  .mm-stat  { background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:6px 12px; font-size:9.5pt; color:#475569; }
  .mm-stat strong { color:#15803d; }
  .mm-root-bar { font-size:14pt; font-weight:800; color:#15803d; background:#f0fdf4; border:2px solid #86efac; border-radius:10px; padding:10px 16px; margin-bottom:12px; }
  .mm-root-expl { font-size:10pt; color:#374151; line-height:1.7; padding:0 4px; margin-bottom:14px; }
  .mm-l1-block { margin-bottom:14px; }
  .mm-l1-row   { display:flex; align-items:flex-start; gap:10px; margin-bottom:4px; }
  .mm-l1-num   { width:24px; height:24px; border-radius:50%; background:#3b82f6; color:#fff; font-size:10pt; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
  .mm-l1-title { font-size:12pt; font-weight:700; color:#1d4ed8; line-height:1.3; }
  .mm-l1-expl  { font-size:9.5pt; color:#374151; line-height:1.65; margin-top:2px; }
  .mm-l1-kids  { margin-left:20px; padding-left:16px; border-left:2px solid #bfdbfe; margin-top:8px; }
  .mm-l2-block { margin-bottom:9px; }
  .mm-l2-row   { display:flex; align-items:flex-start; gap:8px; }
  .mm-l2-dot   { width:8px; height:8px; border-radius:50%; background:#a855f7; flex-shrink:0; margin-top:5px; }
  .mm-l2-title { font-size:10.5pt; font-weight:600; color:#7e22ce; line-height:1.4; }
  .mm-l2-expl  { font-size:9.5pt; color:#374151; line-height:1.65; margin-top:2px; padding-left:16px; }
  .mm-l2-kids  { margin-left:16px; padding-left:14px; border-left:2px solid #e9d5ff; margin-top:6px; }
  .mm-l3-block { margin-bottom:7px; }
  .mm-l3-row   { display:flex; align-items:flex-start; gap:7px; }
  .mm-l3-dot   { width:6px; height:6px; border-radius:50%; background:#f97316; flex-shrink:0; margin-top:5px; }
  .mm-l3-title { font-size:10pt; font-weight:500; color:#c2410c; line-height:1.4; }
  .mm-l3-expl  { font-size:9.5pt; color:#374151; line-height:1.65; margin-top:2px; padding-left:13px; }
`;

function renderMindNodeHTML(node: any, depth: number, idx?: number): string {
  if (depth === 0) {
    let h = `<div class="mm-root-bar">🌐 ${esc(node.label)}</div>`;
    if (node.explanation) h += `<div class="mm-root-expl">${escMl(node.explanation)}</div>`;
    (node.children || []).forEach((c: any, i: number) => { h += renderMindNodeHTML(c, 1, i + 1); });
    return h;
  }
  if (depth === 1) {
    let h = `<div class="mm-l1-block avoid-break">
      <div class="mm-l1-row">
        <span class="mm-l1-num">${idx ?? "•"}</span>
        <div style="flex:1;">
          <div class="mm-l1-title">${esc(node.label)}</div>
          ${node.explanation ? `<div class="mm-l1-expl">${escMl(node.explanation)}</div>` : ""}
        </div>
      </div>`;
    if ((node.children || []).length > 0) {
      h += `<div class="mm-l1-kids">`;
      node.children.forEach((c: any) => { h += renderMindNodeHTML(c, 2); });
      h += `</div>`;
    }
    return h + `</div>`;
  }
  if (depth === 2) {
    let h = `<div class="mm-l2-block">
      <div class="mm-l2-row">
        <span class="mm-l2-dot"></span>
        <div style="flex:1;"><div class="mm-l2-title">${esc(node.label)}</div></div>
      </div>
      ${node.explanation ? `<div class="mm-l2-expl">${escMl(node.explanation)}</div>` : ""}`;
    if ((node.children || []).length > 0) {
      h += `<div class="mm-l2-kids">`;
      node.children.forEach((c: any) => { h += renderMindNodeHTML(c, 3); });
      h += `</div>`;
    }
    return h + `</div>`;
  }
  return `<div class="mm-l3-block">
    <div class="mm-l3-row">
      <span class="mm-l3-dot"></span>
      <div style="flex:1;">
        <div class="mm-l3-title">${esc(node.label)}</div>
        ${node.explanation ? `<div class="mm-l3-expl">${escMl(node.explanation)}</div>` : ""}
      </div>
    </div>
    ${(node.children || []).map((c: any) => renderMindNodeHTML(c, 3)).join("")}
  </div>`;
}

function countAllNodes(node: any): number {
  return 1 + (node.children || []).reduce((s: number, c: any) => s + countAllNodes(c), 0);
}

export function exportMindMapPDF(
  mindmap: any,
  meta: { chapterName: string; subject: string; classNum: string }
): void {
  const { chapterName, subject, classNum } = meta;
  if (!mindmap?.root) return;

  const total    = countAllNodes(mindmap.root);
  const main     = (mindmap.root.children || []).length;
  const subCount = (mindmap.root.children || []).reduce((s: number, c: any) => s + (c.children || []).length, 0);

  const stats = `<div class="mm-stats">
    <div class="mm-stat">🌐 <strong>${main}</strong> Main Topics</div>
    <div class="mm-stat">📌 <strong>${subCount}</strong> Sub-topics</div>
    <div class="mm-stat">🔵 <strong>${total}</strong> Total Nodes</div>
  </div>`;

  const body = stats + renderMindNodeHTML(mindmap.root, 0);

  const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Concept Map — ${esc(chapterName)}</title>
  <style>${BASE_STYLES}${MINDMAP_EXTRA}</style>
</head>
<body>
  <div class="no-print print-toolbar">
    <strong>🗺 ${esc(chapterName)} — Concept Map</strong>
    <button class="btn-save" onclick="window.print()">📥 Save as PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
  <div class="doc-wrap">
    ${makeHeader("Concept Map", chapterName, subject, classNum, `${mindmap.title || ""} · ${total} nodes`)}
    ${body}
    ${makeFooter(chapterName)}
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
