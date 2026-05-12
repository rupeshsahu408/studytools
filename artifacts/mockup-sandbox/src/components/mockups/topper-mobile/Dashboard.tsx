import React, { useState } from 'react';
import { Home, Upload, Users, TrendingUp, User, Moon, Sun, Flame, Target, Percent, Atom, FlaskConical, Plus } from 'lucide-react';

export default function Dashboard() {
  const [isDark, setIsDark] = useState(false);

  // Theme classes
  const bgMain = isDark ? 'bg-[#121a12]' : 'bg-[#FAF6F1]';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const bgCard = isDark ? 'bg-[#1a2619]' : 'bg-white';
  const borderCard = isDark ? 'border-[#2a3629]' : 'border-gray-100';

  return (
    <div className={`w-[390px] h-[844px] relative mx-auto overflow-hidden font-sans flex flex-col ${bgMain} ${textMain} border border-gray-300 shadow-xl rounded-3xl`}>
      {/* Top Bar */}
      <div className={`h-14 flex items-center justify-between px-4 shrink-0 border-b ${borderCard} ${bgMain} z-10`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2E6F40] text-white flex items-center justify-center font-bold text-sm">
            T2
          </div>
          <span className="font-bold text-lg">Topper 2.0</span>
        </div>
        <button onClick={() => setIsDark(!isDark)} className={`w-10 h-10 flex items-center justify-center rounded-full ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {/* Hero Section */}
        <div className="px-4 pt-6 pb-8">
          <h1 className="text-3xl font-extrabold mb-1">Namaste, Ravi! 👋</h1>
          <p className={`${textMuted} text-sm mb-4`}>Class 12 · Bihar Board · Science</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2E6F40]/10 text-[#2E6F40] text-xs font-semibold">
            <span>1/5 chapters used</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-4 flex gap-3 mb-8">
          {/* Streak */}
          <div className={`flex-1 rounded-2xl p-3 shadow-sm border ${borderCard} ${bgCard} flex flex-col items-center justify-center gap-1`}>
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-1">
              <Flame size={16} />
            </div>
            <span className="font-bold text-sm">7 days</span>
            <span className={`text-[10px] uppercase tracking-wider ${textMuted} font-semibold`}>Streak</span>
          </div>

          {/* Goal */}
          <div className={`flex-1 rounded-2xl p-3 shadow-sm border ${borderCard} ${bgCard} flex flex-col items-center justify-center gap-1`}>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-1">
              <Target size={16} />
            </div>
            <span className="font-bold text-sm">0/10</span>
            <span className={`text-[10px] uppercase tracking-wider ${textMuted} font-semibold`}>Questions</span>
          </div>

          {/* Accuracy */}
          <div className={`flex-1 rounded-2xl p-3 shadow-sm border ${borderCard} ${bgCard} flex flex-col items-center justify-center gap-1`}>
            <div className="w-8 h-8 rounded-full bg-green-100 text-[#2E6F40] flex items-center justify-center mb-1">
              <Percent size={16} />
            </div>
            <span className="font-bold text-sm">78%</span>
            <span className={`text-[10px] uppercase tracking-wider ${textMuted} font-semibold`}>Accuracy</span>
          </div>
        </div>

        {/* Chapter Library */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-widest text-gray-400">CHAPTER LIBRARY</h2>
            <button className="flex items-center gap-1 text-[#2E6F40] bg-[#2E6F40]/10 px-2 py-1 rounded text-xs font-semibold">
              <Plus size={12} />
              Naya Chapter
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Physics Chapter */}
            <div className={`rounded-2xl p-4 shadow-sm border ${borderCard} ${bgCard}`}>
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Atom size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight mb-1">12 — Physics Chapter 4: Moving Charges</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">Physics</span>
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[45%] rounded-full"></div>
              </div>
            </div>

            {/* Chemistry Chapter */}
            <div className={`rounded-2xl p-4 shadow-sm border ${borderCard} ${bgCard}`}>
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <FlaskConical size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight mb-1">11 — Chemistry Chapter 1: Basic Concepts</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-wider">Chemistry</span>
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[12%] rounded-full"></div>
              </div>
            </div>
          </div>

          <button className="w-full text-center mt-5 text-[#2E6F40] text-sm font-semibold">
            Community Notes dekhein →
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className={`absolute bottom-0 w-full h-16 flex items-center justify-around border-t ${borderCard} ${bgCard} z-20 pb-safe`}>
        <button className="flex flex-col items-center gap-1 text-[#2E6F40]">
          <Home size={22} className="fill-current" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>
        <button className={`flex flex-col items-center gap-1 ${textMuted} hover:text-gray-900`}>
          <Upload size={22} />
          <span className="text-[10px] font-semibold">Upload</span>
        </button>
        <button className={`flex flex-col items-center gap-1 ${textMuted} hover:text-gray-900`}>
          <Users size={22} />
          <span className="text-[10px] font-semibold">Community</span>
        </button>
        <button className={`flex flex-col items-center gap-1 ${textMuted} hover:text-gray-900`}>
          <TrendingUp size={22} />
          <span className="text-[10px] font-semibold">Progress</span>
        </button>
        <button className={`flex flex-col items-center gap-1 ${textMuted} hover:text-gray-900`}>
          <User size={22} />
          <span className="text-[10px] font-semibold">Profile</span>
        </button>
      </div>
    </div>
  );
}
