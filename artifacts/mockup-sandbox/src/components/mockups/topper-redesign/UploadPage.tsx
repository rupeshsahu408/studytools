import React from "react";
import { ArrowLeft, BookOpen, UploadCloud, Link, Book, FileText, ChevronRight } from "lucide-react";
import "./_group.css";

export default function UploadPage() {
  return (
    <div className="w-[390px] h-[844px] bg-[#121a12] text-white flex flex-col font-sans overflow-hidden relative">
      {/* Top Header */}
      <div className="h-[56px] flex-shrink-0 flex items-center px-4 border-b border-[#253D2C] bg-[#121a12] z-10 sticky top-0">
        <button className="w-10 h-10 flex items-center justify-center -ml-2 text-white/80 hover:text-white rounded-full">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-semibold ml-2 text-white">Nayi Chapter Add Karo</h1>
      </div>

      {/* Step Indicator */}
      <div className="h-1 w-full bg-[#1a2619]">
        <div className="h-full bg-[#4CBB17] w-1/2"></div>
      </div>
      <div className="px-4 py-2 flex justify-end">
        <span className="text-xs text-[#9ca3af] font-medium">Step 1 of 2</span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-2 space-y-5">
        
        {/* Intro Card */}
        <div className="bg-[#2E6F40]/10 border border-[#2E6F40]/30 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2E6F40]/20 flex items-center justify-center flex-shrink-0">
            <Book className="text-[#4CBB17]" size={20} />
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-white mb-1">Chapter ka content choose karo</h2>
            <p className="text-[13px] text-[#9ca3af]">PDF, URL, ya NCERT directly browse kar sakte ho</p>
          </div>
        </div>

        {/* Option 1 — Upload PDF */}
        <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl p-5 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-[#2E6F40]/20 flex items-center justify-center mb-3">
            <UploadCloud className="text-[#4CBB17]" size={28} />
          </div>
          <h3 className="text-[17px] font-semibold text-white mb-1">PDF Upload Karo</h3>
          <p className="text-[13px] text-[#9ca3af] mb-4">Max 50MB · Hindi/English PDF support</p>
          <button className="w-full py-3 px-4 border border-[#4CBB17]/50 text-[#4CBB17] font-medium rounded-xl hover:bg-[#4CBB17]/10 transition-colors flex items-center justify-center gap-2">
            <FileText size={18} />
            Choose File
          </button>
        </div>

        {/* Option 2 — URL se */}
        <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Link className="text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-white">PDF URL Dalo</h3>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="url" 
              placeholder="https://example.com/chapter.pdf" 
              className="flex-1 bg-[#121a12] border border-[#253D2C] rounded-xl px-3 py-3 text-[14px] text-white focus:outline-none focus:border-[#4CBB17] placeholder:text-[#6b7280]"
            />
            <button className="bg-[#2E6F40] text-white px-4 py-3 rounded-xl font-medium">
              Continue
            </button>
          </div>
        </div>

        {/* Option 3 — NCERT Browse */}
        <div className="bg-[#1a2619] border border-[#4CBB17]/50 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-[#4CBB17]/20 text-[#4CBB17] text-[10px] font-bold rounded-bl-xl uppercase tracking-wider">
            Recommended
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <BookOpen className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-white mb-0.5">NCERT se Select Karo</h3>
              <p className="text-[12px] text-[#9ca3af]">Direct NCERT chapters — no upload needed</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <select className="bg-[#121a12] border border-[#253D2C] rounded-xl px-3 py-3 text-[14px] text-white focus:outline-none focus:border-[#4CBB17] appearance-none">
              <option value="" disabled selected>Class Select</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
            
            <select className="bg-[#121a12] border border-[#253D2C] rounded-xl px-3 py-3 text-[14px] text-white focus:outline-none focus:border-[#4CBB17] appearance-none">
              <option value="" disabled selected>Subject</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="math">Mathematics</option>
              <option value="biology">Biology</option>
            </select>
          </div>
          
          <button className="w-full bg-[#4CBB17] text-[#121a12] font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4CBB17]/90 transition-colors">
            Browse NCERT
            <ChevronRight size={18} />
          </button>
        </div>

      </div>

      {/* Footer Note */}
      <div className="px-6 py-4 bg-[#121a12] border-t border-[#253D2C] mt-auto">
        <p className="text-[12px] text-[#9ca3af] text-center flex items-center justify-center gap-1.5">
          <span>📌</span> Sirf 5 chapters save kar sakte ho (1 used)
        </p>
      </div>
    </div>
  );
}
