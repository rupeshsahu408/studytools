import { useState, useRef } from "react";
import {
  FileText, Download, Eye, EyeOff, RefreshCw, Loader2,
  Printer, CheckCircle2, BookOpen, Clock, Award,
} from "lucide-react";

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface TwoMarkQ {
  id: string;
  question: string;
  answer: string;
  type?: string;
}

interface FiveMarkQ {
  id: string;
  question: string;
  answer: string;
  keyPoints?: string[];
  type?: string;
}

interface ExamPaperData {
  mcq: MCQQuestion[];
  twoMarks: TwoMarkQ[];
  fiveMarks: FiveMarkQ[];
}

interface Props {
  subject: string;
  classNum: string;
  chapterName: string;
  paper: ExamPaperData | null;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
  onReset: () => void;
}

const OPTION_LABELS = ["(A)", "(B)", "(C)", "(D)"];

function escHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function openWithBlob(html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, "_blank");
  if (!tab) {
    alert("Pop-ups blocked. Please allow pop-ups for this site and try again.");
    URL.revokeObjectURL(url);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

function buildPaperHTML(
  paper: ExamPaperData,
  meta: { schoolName: string; examDate: string; duration: string; subject: string; classNum: string; chapterName: string }
): string {
  const { mcq, twoMarks, fiveMarks } = paper;
  const { schoolName, examDate, duration, subject, classNum, chapterName } = meta;
  const maxMarks = mcq.length + twoMarks.length * 2 + fiveMarks.length * 5;
  const fiveMarkStart = mcq.length + twoMarks.length + 1;

  const mcqRows = mcq.map((q, i) => {
    const opts = (q.options || []).map((o, oi) => `<span style="display:inline-block;margin-right:16px;min-width:120px">${OPTION_LABELS[oi]} ${escHtml(o)}</span>`).join("");
    return `<div style="margin-bottom:12px;break-inside:avoid;page-break-inside:avoid">
      <div><strong>${i + 1}.</strong> ${escHtml(q.question)}</div>
      <div style="margin-left:18px;margin-top:5px;color:#222;line-height:1.7">${opts}</div>
    </div>`;
  }).join("");

  const twoMarkRows = twoMarks.map((q, i) => `<div style="margin-bottom:14px;break-inside:avoid;page-break-inside:avoid">
    <div><strong>${mcq.length + i + 1}.</strong> ${escHtml(q.question)}</div>
    <div style="margin-left:18px;height:38px;border-bottom:1px dashed #999;margin-top:8px"></div>
    <div style="margin-left:18px;height:38px;border-bottom:1px dashed #999;margin-top:2px"></div>
  </div>`).join("");

  const fiveMarkRows = fiveMarks.map((q, i) => `<div style="margin-bottom:18px;break-inside:avoid;page-break-inside:avoid">
    <div><strong>${fiveMarkStart + i}.</strong> ${escHtml(q.question)}</div>
    ${Array.from({ length: 8 }, () => `<div style="margin-left:18px;height:30px;border-bottom:1px dashed #ccc;margin-top:2px"></div>`).join("")}
  </div>`).join("");

  return `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Exam Paper — ${escHtml(chapterName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; margin: 0; padding: 0; font-size: 12pt; color: #000; background: #fff; }
  .page { max-width: 820px; margin: 0 auto; padding: 32px 44px; }
  .header-box { border: 3px double #000; padding: 14px 20px; text-align: center; margin-bottom: 18px; }
  .school-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .exam-title { font-size: 13pt; font-weight: bold; margin: 6px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; }
  .meta-row { display: flex; justify-content: space-between; font-size: 11pt; margin-top: 8px; flex-wrap: wrap; gap: 4px; }
  .instructions { border: 1px solid #555; padding: 10px 16px; margin: 14px 0 20px; font-size: 10.5pt; }
  .instructions p { margin: 4px 0; line-height: 1.5; }
  .section-header { background: #efefef; border: 1px solid #555; padding: 6px 14px; margin: 24px 0 14px; font-weight: bold; font-size: 11.5pt; text-align: center; }
  .mcq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 28px; }
  .no-print-btn { display: inline-block; margin: 12px 0 20px; padding: 8px 20px; background: #1a5276; color: #fff; border: none; border-radius: 6px; font-size: 11pt; cursor: pointer; font-family: inherit; }
  @media print {
    body { margin: 0; }
    .page { padding: 14px 22px; max-width: 100%; }
    .section-header { background: #efefef !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .instructions { background: #fafafa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print-btn { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">

  <div style="text-align:center;margin-bottom:10px" class="no-print-btn" onclick="window.print()">
    🖨️ Save as PDF / Print
  </div>

  <div class="header-box">
    <div class="school-name">${escHtml(schoolName || "Board Exam — Practice Examination")}</div>
    <div class="exam-title">ANNUAL EXAMINATION / वार्षिक परीक्षा</div>
    <div class="meta-row">
      <span><strong>Class / कक्षा :</strong> ${escHtml(classNum)}</span>
      <span><strong>Subject / विषय :</strong> ${escHtml(subject)}</span>
      <span><strong>Date / दिनांक :</strong> ${escHtml(examDate)}</span>
    </div>
    <div class="meta-row" style="margin-top:6px">
      <span><strong>Chapter :</strong> ${escHtml(chapterName)}</span>
      <span><strong>Time / समय :</strong> ${escHtml(duration)}</span>
      <span><strong>Max Marks / पूर्णांक :</strong> ${maxMarks}</span>
    </div>
  </div>

  <div class="instructions">
    <p><strong>General Instructions / सामान्य निर्देश :</strong></p>
    <p>(i) This paper contains <strong>${mcq.length + twoMarks.length + fiveMarks.length} questions</strong> divided into 3 Sections.</p>
    <p>(ii) <strong>Section A</strong> — ${mcq.length} Objective Questions (MCQ), each carrying <strong>1 mark</strong>. Total: ${mcq.length} marks.</p>
    <p>(iii) <strong>Section B</strong> — ${twoMarks.length} Short Answer Questions, each carrying <strong>2 marks</strong>. Total: ${twoMarks.length * 2} marks.</p>
    <p>(iv) <strong>Section C</strong> — ${fiveMarks.length} Long Answer Questions, each carrying <strong>5 marks</strong>. Total: ${fiveMarks.length * 5} marks.</p>
    <p>(v) All questions are compulsory. / सभी प्रश्न अनिवार्य हैं।</p>
    <p>(vi) Write your answers neatly and clearly. / उत्तर स्पष्ट और सुव्यवस्थित लिखें।</p>
  </div>

  <!-- Section A -->
  <div class="section-header">
    SECTION A — OBJECTIVE QUESTIONS / वस्तुनिष्ठ प्रश्न &nbsp;(${mcq.length} &times; 1 = ${mcq.length} Marks)
  </div>
  <p style="font-size:10.5pt;margin-bottom:14px"><em>Choose the correct option. / सही विकल्प चुनें।</em></p>
  <div class="mcq-grid">${mcqRows}</div>

  <!-- Section B -->
  <div class="section-header">
    SECTION B — SHORT ANSWER QUESTIONS / लघु उत्तरीय प्रश्न &nbsp;(${twoMarks.length} &times; 2 = ${twoMarks.length * 2} Marks)
  </div>
  <p style="font-size:10.5pt;margin-bottom:14px"><em>Answer in 2–3 sentences. / प्रत्येक प्रश्न का उत्तर 2–3 वाक्यों में दें।</em></p>
  ${twoMarkRows}

  <!-- Section C -->
  <div class="section-header">
    SECTION C — LONG ANSWER QUESTIONS / दीर्घ उत्तरीय प्रश्न &nbsp;(${fiveMarks.length} &times; 5 = ${fiveMarks.length * 5} Marks)
  </div>
  <p style="font-size:10.5pt;margin-bottom:14px"><em>Answer in detail. / विस्तार से उत्तर दें।</em></p>
  ${fiveMarkRows}

  <div style="margin-top:32px;text-align:center;font-size:10pt;color:#555;border-top:1px solid #ccc;padding-top:12px">
    &#8212; &times; &#8212; &times; &#8212; &nbsp; End of Question Paper / प्रश्न पत्र समाप्त &nbsp; &#8212; &times; &#8212; &times; &#8212;
  </div>
</div>
</body>
</html>`;
}

function buildAnswerKeyHTML(
  paper: ExamPaperData,
  meta: { schoolName: string; examDate: string; subject: string; classNum: string; chapterName: string }
): string {
  const { mcq } = paper;
  const { schoolName, examDate, subject, classNum, chapterName } = meta;

  const answerPairs = mcq.map((q, i) => {
    const correctIdx = (q.options || []).findIndex(
      o => o.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase()
    );
    const label = correctIdx >= 0 ? ["A", "B", "C", "D"][correctIdx] : q.correctAnswer;
    return `${i + 1}-(${label})`;
  });

  const rows: string[] = [];
  for (let i = 0; i < answerPairs.length; i += 10) {
    rows.push(answerPairs.slice(i, i + 10).join("&nbsp;&nbsp;&nbsp;"));
  }

  const keyTable = mcq.map((q, i) => {
    const correctIdx = (q.options || []).findIndex(
      o => o.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase()
    );
    const label = correctIdx >= 0 ? ["A", "B", "C", "D"][correctIdx] : q.correctAnswer;
    const shortQ = q.question.slice(0, 80) + (q.question.length > 80 ? "…" : "");
    return `<tr>
      <td style="padding:4px 8px;border:1px solid #ccc;font-weight:bold">${i + 1}</td>
      <td style="padding:4px 8px;border:1px solid #ccc;max-width:400px">${escHtml(shortQ)}</td>
      <td style="padding:4px 8px;border:1px solid #ccc;font-weight:bold;color:#006600;text-align:center">${escHtml(label)}</td>
      <td style="padding:4px 8px;border:1px solid #ccc">${escHtml(q.correctAnswer)}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Answer Key — ${escHtml(chapterName)}</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; margin: 0; padding: 0; font-size: 12pt; color: #000; background: #fff; }
  .page { max-width: 820px; margin: 0 auto; padding: 30px 40px; }
  .header-box { border: 3px double #000; padding: 14px 20px; text-align: center; margin-bottom: 18px; }
  .title { font-size: 15pt; font-weight: bold; margin-bottom: 6px; }
  .meta { font-size: 11pt; }
  .quick-key { background: #f5f5f5; border: 1px solid #999; padding: 12px 18px; margin: 16px 0; font-size: 10.5pt; line-height: 2; }
  .no-print-btn { display: inline-block; margin: 12px 0 20px; padding: 8px 20px; background: #1a5276; color: #fff; border: none; border-radius: 6px; font-size: 11pt; cursor: pointer; font-family: inherit; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
  th { background: #e0e0e0; padding: 6px 10px; border: 1px solid #999; text-align: left; }
  @media print {
    body { margin: 0; }
    .page { padding: 15px 25px; max-width: 100%; }
    .no-print-btn { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">
  <div style="text-align:center;margin-bottom:10px">
    <button class="no-print-btn" onclick="window.print()">🖨️ Save as PDF / Print</button>
  </div>
  <div class="header-box">
    <div class="title">OBJECTIVE ANSWER KEY / वस्तुनिष्ठ उत्तर कुंजी</div>
    <div class="meta">${escHtml(schoolName)} &nbsp;|&nbsp; Class ${escHtml(classNum)} — ${escHtml(subject)} &nbsp;|&nbsp; ${escHtml(chapterName)}</div>
    <div class="meta" style="margin-top:4px">Date: ${escHtml(examDate)} &nbsp;|&nbsp; Total MCQs: ${mcq.length}</div>
  </div>

  <h3 style="margin-bottom:8px">Quick Answer Key / संक्षिप्त उत्तर कुंजी</h3>
  <div class="quick-key">
    ${rows.join("<br>")}
  </div>

  <h3 style="margin:18px 0 10px">Detailed Answer Key / विस्तृत उत्तर कुंजी</h3>
  <table>
    <thead>
      <tr>
        <th style="width:40px">Q. No.</th>
        <th>Question (short)</th>
        <th style="width:60px;text-align:center">Answer</th>
        <th>Correct Option Text</th>
      </tr>
    </thead>
    <tbody>${keyTable}</tbody>
  </table>

  <div style="margin-top:24px;text-align:center;font-size:10pt;color:#666">
    &#8212; End of Answer Key / उत्तर कुंजी समाप्त &#8212;
  </div>
</div>
</body>
</html>`;
}

export default function ExamPaperView({ subject, classNum, chapterName, paper, generating, error, onGenerate, onReset }: Props) {
  const [showMCQAnswers, setShowMCQAnswers] = useState(false);
  const [schoolName, setSchoolName] = useState("Board Exam — Practice Examination");
  const [examDate, setExamDate] = useState(() => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }));
  const [duration, setDuration] = useState("3 Hours / 3 घंटे");
  const paperRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    setShowMCQAnswers(false);
    onGenerate();
  };

  const handleReset = () => {
    setShowMCQAnswers(false);
    onReset();
  };

  const meta = { schoolName, examDate, duration, subject, classNum, chapterName };

  const handleDownloadPaper = () => {
    if (!paper) return;
    openWithBlob(buildPaperHTML(paper, meta));
  };

  const handleDownloadAnswerKey = () => {
    if (!paper) return;
    openWithBlob(buildAnswerKeyHTML(paper, meta));
  };

  const getMCQAnswerLabel = (q: MCQQuestion): string => {
    const idx = (q.options || []).findIndex(
      o => o.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase()
    );
    return idx >= 0 ? ["A", "B", "C", "D"][idx] : q.correctAnswer;
  };

  if (!paper && !generating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Exam Paper Generator</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI will generate a full practice exam paper — 100 MCQs, 20 short-answer, and 5–6 long-answer questions.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Paper Settings</h3>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">School / Institution Name</label>
            <input
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              placeholder="e.g. XYZ High School, Patna"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Exam Date</label>
              <input
                type="text"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="e.g. 3 Hours"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Paper will include:</p>
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>100 Objective (MCQ) Questions — 1 mark each</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>20 Short Answer Questions — 2 marks each</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>5–6 Long Answer Questions — 5 marks each</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>MCQ answers hidden — revealed separately</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <FileText className="w-4 h-4" />
            Generate Exam Paper
          </button>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            This takes 30–60 seconds. AI is generating ~126 questions.
          </p>
        </div>
      </div>
    );
  }

  if (!paper) return null;

  const maxMarks = paper.mcq.length + paper.twoMarks.length * 2 + paper.fiveMarks.length * 5;
  const fiveMarkStart = paper.mcq.length + paper.twoMarks.length + 1;

  return (
    <div className="max-w-4xl mx-auto px-2 pb-16">

      {/* ── Toolbar ── */}
      <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 pt-3 pb-3 mb-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-auto">
            <FileText className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-800 dark:text-white">{chapterName}</span>
            <span className="text-xs text-gray-400">— {paper.mcq.length} MCQ · {paper.twoMarks.length} × 2M · {paper.fiveMarks.length} × 5M · {maxMarks} marks</span>
          </div>
          <button
            onClick={() => setShowMCQAnswers(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              showMCQAnswers
                ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
            }`}
          >
            {showMCQAnswers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showMCQAnswers ? "Hide MCQ Answers" : "Reveal MCQ Answers"}
          </button>
          <button
            onClick={handleDownloadPaper}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Download Paper PDF
          </button>
          <button
            onClick={handleDownloadAnswerKey}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Answer Key PDF
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Paper
          </button>
        </div>
      </div>

      {/* ── MCQ Answer Key Panel ── */}
      {showMCQAnswers && (
        <div className="bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h3 className="text-sm font-bold text-green-700 dark:text-green-400">MCQ Answer Key / वस्तुनिष्ठ उत्तर कुंजी</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {paper.mcq.map((q, i) => (
              <div key={i} className="flex items-center gap-0.5 bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded-lg px-2 py-1 text-xs font-mono">
                <span className="text-gray-500 dark:text-gray-400">{i + 1}-</span>
                <span className="font-bold text-green-600 dark:text-green-400">{getMCQAnswerLabel(q)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-600 dark:text-green-500 mt-3">
            ↑ Format: Question Number — Correct Option. Click "Download Answer Key PDF" for the full detailed key.
          </p>
        </div>
      )}

      {/* ── Exam Paper Display ── */}
      <div ref={paperRef} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">

        {/* Paper Header */}
        <div className="border-b-4 border-double border-gray-800 dark:border-gray-400 p-6 text-center">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-wide uppercase mb-1">{schoolName}</h1>
          <div className="border-t border-b border-gray-400 dark:border-gray-600 py-1.5 my-2">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 tracking-widest">ANNUAL EXAMINATION / वार्षिक परीक्षा</p>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-700 dark:text-gray-300 mt-2 flex-wrap gap-1">
            <span><strong>Class / कक्षा:</strong> {classNum}</span>
            <span><strong>Subject / विषय:</strong> {subject}</span>
            <span><strong>Date / दिनांक:</strong> {examDate}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-700 dark:text-gray-300 mt-1 flex-wrap gap-1">
            <span><strong>Chapter:</strong> {chapterName}</span>
            <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><strong>Time:</strong> {duration}</div>
            <div className="flex items-center gap-1"><Award className="w-3 h-3" /><strong>Max Marks:</strong> {maxMarks}</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">General Instructions / सामान्य निर्देश:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {[
              `This paper has ${paper.mcq.length + paper.twoMarks.length + paper.fiveMarks.length} questions in 3 sections.`,
              `Section A: ${paper.mcq.length} MCQs × 1 mark = ${paper.mcq.length} marks.`,
              `Section B: ${paper.twoMarks.length} Short answers × 2 marks = ${paper.twoMarks.length * 2} marks.`,
              `Section C: ${paper.fiveMarks.length} Long answers × 5 marks = ${paper.fiveMarks.length * 5} marks.`,
              "All questions are compulsory. / सभी प्रश्न अनिवार्य हैं।",
              "Write neatly and clearly. / साफ और स्पष्ट लिखें।",
            ].map((inst, i) => (
              <p key={i} className="text-xs text-gray-600 dark:text-gray-400">({String.fromCharCode(105 + i)}) {inst}</p>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-8">

          {/* ── Section A: MCQs ── */}
          <section>
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-5 text-center">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                SECTION A — OBJECTIVE QUESTIONS / वस्तुनिष्ठ प्रश्न
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {paper.mcq.length} Questions × 1 Mark = {paper.mcq.length} Marks
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4">
              Choose the correct option for each question. / प्रत्येक प्रश्न के लिए सही विकल्प चुनें।
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {paper.mcq.map((q, i) => (
                <div key={i} className="border-b border-gray-100 dark:border-gray-800 pb-3">
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-1.5 leading-snug">
                    <span className="font-bold text-gray-900 dark:text-white">{i + 1}.</span> {q.question}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-4">
                    {(q.options || []).map((opt, oi) => (
                      <p key={oi} className={`text-xs leading-snug ${
                        showMCQAnswers && opt.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase()
                          ? "text-green-600 dark:text-green-400 font-semibold"
                          : "text-gray-600 dark:text-gray-400"
                      }`}>
                        {OPTION_LABELS[oi]} {opt}
                        {showMCQAnswers && opt.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase() && " ✓"}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section B: 2-Mark ── */}
          <section>
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-5 text-center">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                SECTION B — SHORT ANSWER QUESTIONS / लघु उत्तरीय प्रश्न
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {paper.twoMarks.length} Questions × 2 Marks = {paper.twoMarks.length * 2} Marks
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4">
              Answer each question in 2–3 sentences. / प्रत्येक प्रश्न का उत्तर 2–3 वाक्यों में दें।
            </p>
            <div className="space-y-4">
              {paper.twoMarks.map((q, i) => (
                <div key={i} className="border-b border-gray-100 dark:border-gray-800 pb-3">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    <span className="font-bold text-gray-900 dark:text-white">{paper.mcq.length + i + 1}.</span> {q.question}
                  </p>
                  {q.type && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
                      {q.type}
                    </span>
                  )}
                  <div className="mt-2 space-y-1">
                    <div className="h-5 border-b border-dashed border-gray-300 dark:border-gray-700" />
                    <div className="h-5 border-b border-dashed border-gray-300 dark:border-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section C: 5-Mark ── */}
          <section>
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-5 text-center">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                SECTION C — LONG ANSWER QUESTIONS / दीर्घ उत्तरीय प्रश्न
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {paper.fiveMarks.length} Questions × 5 Marks = {paper.fiveMarks.length * 5} Marks
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4">
              Answer the following questions in detail. / निम्नलिखित प्रश्नों के विस्तृत उत्तर दें।
            </p>
            <div className="space-y-6">
              {paper.fiveMarks.map((q, i) => (
                <div key={i} className="border-b border-gray-100 dark:border-gray-800 pb-4">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    <span className="font-bold text-gray-900 dark:text-white">{fiveMarkStart + i}.</span> {q.question}
                  </p>
                  {q.type && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium">
                      {q.type}
                    </span>
                  )}
                  <div className="mt-2 space-y-1">
                    {Array.from({ length: 6 }, (_, li) => (
                      <div key={li} className="h-5 border-b border-dashed border-gray-300 dark:border-gray-700" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-widest">
              — × — × — End of Question Paper / प्रश्न पत्र समाप्त — × — × —
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <BookOpen className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Generated by Topper 2.0 AI · {subject} Class {classNum} · {chapterName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
