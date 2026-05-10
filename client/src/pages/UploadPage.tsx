import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, FileText, X, BookOpen } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { uploadPDF, generateNotes, generateQuestions, fetchNCERTChapters } from "../lib/api";
import { saveChapter } from "../lib/firestore";
import LoadingScreen from "../components/LoadingScreen";
import Navbar from "../components/Navbar";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];
const CLASSES = ["11", "12"];

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"upload" | "browse">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("Physics");
  const [classNum, setClassNum] = useState("11");
  const [chapterName, setChapterName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState("");
  const [ncertChapters, setNcertChapters] = useState<{ name: string; url: string }[]>([]);
  const [selectedNcert, setSelectedNcert] = useState<{ name: string; url: string } | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      if (!chapterName) setChapterName(accepted[0].name.replace(".pdf", ""));
    }
  }, [chapterName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, maxFiles: 1, maxSize: 20 * 1024 * 1024,
  });

  const loadNcertChapters = async () => {
    setLoadingChapters(true);
    try {
      const chapters = await fetchNCERTChapters(classNum, subject);
      setNcertChapters(chapters);
      setSelectedNcert(null);
    } catch (e) {
      setError("Could not load NCERT chapters. Please try again.");
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) return;
    setError("");

    const nameToUse = tab === "browse" && selectedNcert ? selectedNcert.name : chapterName;
    if (!nameToUse.trim()) { setError("Please enter a chapter name."); return; }
    if (tab === "upload" && !file) { setError("Please select a PDF file."); return; }
    if (tab === "browse" && !selectedNcert) { setError("Please select a chapter from the list."); return; }

    setLoading(true);
    setLoadingStage(0);

    try {
      let uploadedData: any;

      if (tab === "upload" && file) {
        setLoadingStage(0);
        uploadedData = await uploadPDF(file, subject, classNum, nameToUse);
      } else if (tab === "browse" && selectedNcert) {
        setLoadingStage(0);
        const res = await fetch(`/api/upload/url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: selectedNcert.url, subject, classNum, chapterName: selectedNcert.name }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to fetch NCERT chapter. Please try uploading the PDF manually.");
        }
        uploadedData = await res.json();
      }

      setLoadingStage(2);
      const [notesRes, questionsRes] = await Promise.all([
        generateNotes(uploadedData.text, subject, classNum, nameToUse, uploadedData.language),
        (setLoadingStage(3), generateQuestions(uploadedData.text, subject, classNum, nameToUse, uploadedData.language)),
      ]);

      setLoadingStage(5);
      const chapterId = await saveChapter(user.uid, {
        chapterName: nameToUse,
        subject,
        classNum,
        language: uploadedData.language,
        text: uploadedData.text,
        notes: notesRes.notes,
        questions: questionsRes.questions,
      });

      navigate(`/chapter/${chapterId}`);
    } catch (e: any) {
      if (e.message?.includes("MAX_CHAPTERS_REACHED")) {
        setError("You've reached the 5-chapter limit. Please delete a chapter first.");
      } else {
        setError(e.message || "Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen stage={loadingStage} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-14 max-w-2xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 mb-6 flex items-center gap-1">
            ← Back to Library
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Add a New Chapter</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Upload your PDF or pick from the official NCERT library</p>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex border-b border-gray-100 dark:border-gray-800">
              {(["upload", "browse"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-b-2 border-green-600" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  {t === "upload" ? "Upload PDF" : "Browse NCERT"}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Subject</label>
                  <select value={subject} onChange={e => { setSubject(e.target.value); setNcertChapters([]); setSelectedNcert(null); }}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Class</label>
                  <select value={classNum} onChange={e => { setClassNum(e.target.value); setNcertChapters([]); setSelectedNcert(null); }}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>

              {tab === "upload" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Chapter Name</label>
                    <input value={chapterName} onChange={e => setChapterName(e.target.value)} placeholder="e.g. Laws of Motion"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"}`}>
                    <input {...getInputProps()} />
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{file.name}</p>
                          <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setFile(null); }} className="ml-auto text-gray-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop your PDF here or click to browse</p>
                        <p className="text-xs text-gray-400 mt-1">Max 20MB • PDF only</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button onClick={loadNcertChapters} disabled={loadingChapters}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                    <BookOpen className="w-4 h-4" />
                    {loadingChapters ? "Loading chapters..." : `Load ${subject} Class ${classNum} Chapters`}
                  </button>

                  {ncertChapters.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {ncertChapters.map((ch, i) => (
                        <button key={i} onClick={() => { setSelectedNcert(ch); setChapterName(ch.name); }}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${selectedNcert?.name === ch.name ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-green-300"}`}>
                          {ch.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button onClick={handleGenerate}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                Generate Notes & Questions
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
