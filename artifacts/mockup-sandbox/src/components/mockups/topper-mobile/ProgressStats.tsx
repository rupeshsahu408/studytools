import React from 'react';
import { 
  Calendar, 
  Home, 
  Upload, 
  Users, 
  BarChart2, 
  User, 
  Check, 
  ArrowRight,
  ChevronDown
} from 'lucide-react';

export function ProgressStats() {
  return (
    <div className="flex flex-col h-[100dvh] bg-[#FAF6F1] text-gray-900 font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#2E6F40] text-white flex items-center justify-center font-bold text-sm">
            T2
          </div>
          <span className="font-bold text-lg text-gray-900">Topper 2.0</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-gray-600 rounded-full hover:bg-gray-50">
          <Calendar size={22} strokeWidth={2} />
        </button>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto pt-14 pb-24 px-4">
        
        {/* Overview Header */}
        <section className="flex flex-col items-center justify-center py-8">
          <div className="relative w-32 h-32 flex items-center justify-center rounded-full mb-4 shadow-sm">
            {/* SVG Ring */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle 
                cx="64" cy="64" r="58" 
                fill="none" 
                stroke="#e5e7eb" 
                strokeWidth="12" 
              />
              <circle 
                cx="64" cy="64" r="58" 
                fill="none" 
                stroke="#2E6F40" 
                strokeWidth="12" 
                strokeDasharray="364.4" 
                strokeDashoffset={364.4 * (1 - 0.78)} 
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center">
              <span className="block text-3xl font-bold text-gray-900 leading-none">78%</span>
              <span className="block text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">Accuracy</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700">127 questions answered · 7 day streak 🔥</p>
        </section>

        {/* Subject Accuracy Bars */}
        <section className="space-y-3 mb-8">
          {/* Physics */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h3 className="font-bold text-gray-900">Physics</h3>
                <p className="text-xs text-gray-500 mt-0.5">54 Qs answered</p>
              </div>
              <span className="font-bold text-blue-600">82%</span>
            </div>
            <div className="w-full h-2.5 bg-blue-50 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '82%' }}></div>
            </div>
          </div>

          {/* Chemistry */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h3 className="font-bold text-gray-900">Chemistry</h3>
                <p className="text-xs text-gray-500 mt-0.5">41 Qs answered</p>
              </div>
              <span className="font-bold text-purple-600">71%</span>
            </div>
            <div className="w-full h-2.5 bg-purple-50 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '71%' }}></div>
            </div>
          </div>

          {/* Mathematics */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h3 className="font-bold text-gray-900">Mathematics</h3>
                <p className="text-xs text-gray-500 mt-0.5">32 Qs answered</p>
              </div>
              <span className="font-bold text-orange-600">76%</span>
            </div>
            <div className="w-full h-2.5 bg-orange-50 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: '76%' }}></div>
            </div>
          </div>
        </section>

        {/* Chapter Progress */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Chapter Progress</h2>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm">
              All <ChevronDown size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Card 1 */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-sm text-gray-900 leading-snug">
                  12 — Moving Charges<br/>and Magnetism
                </h3>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded">
                  Physics
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full py-1.5 bg-[#2E6F40] text-white rounded flex justify-center items-center">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">Notes</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full py-1.5 bg-[#2E6F40] text-white rounded flex justify-center items-center">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">Qs</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full py-1.5 bg-[#2E6F40] text-white rounded flex justify-center items-center">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">Cards</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full py-1.5 bg-gray-100 text-gray-400 rounded flex justify-center items-center">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300"></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">Sims</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-gray-500">Overall Progress</span>
                <span className="text-[#2E6F40]">3/4 sections done</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-sm text-gray-900 leading-snug">
                  11 — Chemical Equilibrium
                </h3>
                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded">
                  Chemistry
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full py-1.5 bg-[#2E6F40] text-white rounded flex justify-center items-center">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">Notes</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full py-1.5 bg-green-50 text-[#2E6F40] rounded flex justify-center items-center overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-green-200"></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-600">Qs</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full py-1.5 bg-gray-100 text-gray-400 rounded flex justify-center items-center">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300"></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">Cards</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full py-1.5 bg-gray-100 text-gray-400 rounded flex justify-center items-center">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300"></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">Sims</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-gray-500">Overall Progress</span>
                <span className="text-gray-900">1/4 sections done</span>
              </div>
            </div>
          </div>
        </section>

        {/* AI Weak Area CTA */}
        <button className="w-full mt-2 mb-6 py-4 px-6 border-2 border-[#2E6F40] text-[#2E6F40] bg-white rounded-xl font-bold flex items-center justify-between hover:bg-green-50 transition-colors shadow-sm">
          <span>AI Weak Area Analysis</span>
          <ArrowRight size={20} />
        </button>

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 pb-safe">
        <button className="flex flex-col items-center justify-center w-16 h-full gap-1 text-gray-400 hover:text-gray-900">
          <Home size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-full gap-1 text-gray-400 hover:text-gray-900">
          <Upload size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Upload</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-full gap-1 text-gray-400 hover:text-gray-900">
          <Users size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Community</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-full gap-1 text-[#2E6F40]">
          <BarChart2 size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Progress</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-full gap-1 text-gray-400 hover:text-gray-900">
          <User size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Profile</span>
        </button>
      </nav>
    </div>
  );
}
