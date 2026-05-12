import { useState } from "react";
import { ChevronDown, ChevronUp, Sigma, Info, BookOpen, Copy, Check, FileDown } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { exportFormulasPDF } from "../lib/pdfExport";

interface Variable {
  symbol: string;
  meaning: string;
  unit: string;
}

interface Formula {
  id: string;
  name: string;
  latex: string;
  plain_text: string;
  variables: Variable[];
  si_unit: string;
  derivation_hint: string;
  chapter_section: string;
}

interface FormulaSheetProps {
  formulas: Formula[];
  chapterName?: string;
  subject?: string;
  classNum?: string;
}

function renderLatex(latex: string): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true,
      output: "html",
    });
  } catch {
    return `<span class="font-mono text-gray-800 dark:text-gray-200">${latex}</span>`;
  }
}

function FormulaCard({ formula, index: _index }: { formula: Formula; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">

      {/* Formula header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sigma className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{formula.name}</p>
              {formula.chapter_section && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {formula.chapter_section}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors flex-shrink-0 mt-0.5">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* LaTeX formula display */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 overflow-x-auto">
          <div
            className="katex-display-wrapper text-center"
            dangerouslySetInnerHTML={{ __html: renderLatex(formula.latex) }}
          />
        </div>

        {/* SI unit pill */}
        {formula.si_unit && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="text-xs text-gray-400">SI Unit:</span>
            <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium border border-green-100 dark:border-green-800/40">
              {formula.si_unit}
            </span>
          </div>
        )}
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="border-t border-gray-50 dark:border-gray-800">
          <div className="px-5 py-4 space-y-4">
            {/* Variables table */}
            {formula.variables && formula.variables.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Variables</p>
                <div className="space-y-1.5">
                  {formula.variables.map((v, i) => (
                    <div key={i} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                      <span className="font-mono font-bold text-green-600 dark:text-green-400">{v.symbol}</span>
                      <span className="text-gray-700 dark:text-gray-300">{v.meaning}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-right">{v.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Derivation hint */}
            {formula.derivation_hint && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Derivation Hint</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{formula.derivation_hint}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildPlainText(formulas: Formula[]): string {
  const lines: string[] = ["━━━ FORMULA SHEET ━━━", ""];
  formulas.forEach((f, i) => {
    lines.push(`${i + 1}. ${f.name}`);
    lines.push(`   ${f.plain_text || f.latex}`);
    if (f.variables && f.variables.length > 0) {
      const vars = f.variables.map(v => `${v.symbol} = ${v.meaning}${v.unit ? ` (${v.unit})` : ""}`).join(", ");
      lines.push(`   Variables: ${vars}`);
    }
    if (f.si_unit) lines.push(`   SI Unit: ${f.si_unit}`);
    if (f.derivation_hint) lines.push(`   Hint: ${f.derivation_hint}`);
    lines.push("");
  });
  return lines.join("\n").trim();
}

export default function FormulaSheet({ formulas, chapterName = "Chapter", subject = "Science", classNum = "11" }: FormulaSheetProps) {
  const [filter, setFilter] = useState<string>("All");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = () => {
    setExporting(true);
    try {
      exportFormulasPDF(formulas, { chapterName, subject, classNum });
    } finally {
      setTimeout(() => setExporting(false), 600);
    }
  };

  // Group by chapter_section
  const sections = ["All", ...Array.from(new Set(formulas.map(f => f.chapter_section || "General").filter(Boolean)))];
  const filtered = filter === "All" ? formulas : formulas.filter(f => (f.chapter_section || "General") === filter);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText(filtered));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = buildPlainText(filtered);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sigma className="w-5 h-5 text-green-600" /> Formula Sheet
          <span className="text-sm font-normal text-gray-400 ml-1">{formulas.length} formulas</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
              copied
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-700 hover:text-green-600 dark:hover:text-green-400"
            }`}
          >
            {copied ? (
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Copied!</span>
            ) : (
              <span className="flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Copy as Text</span>
            )}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <span className="w-3.5 h-3.5 border border-green-400 border-t-green-700 rounded-full animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            {exporting ? "Opening…" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Section filter */}
      {sections.length > 2 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {sections.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                filter === s
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-700"
              }`}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Formula list */}
      <div className="space-y-3">
        {filtered.map((f, i) => (
          <FormulaCard key={f.id} formula={f} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm">
            No formulas found for this section.
          </div>
        )}
      </div>
    </div>
  );
}
