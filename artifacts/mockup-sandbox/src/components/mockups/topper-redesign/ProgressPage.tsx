import React from 'react';
import './_group.css';
import { 
  Home, 
  BarChart2, 
  Users, 
  User, 
  Book, 
  CheckCircle, 
  Target, 
  Flame,
  Activity,
  Atom,
  Calculator,
  Dna,
  BookOpen,
  HelpCircle,
  Layers,
  TestTube
} from 'lucide-react';

export default function ProgressPage() {
  return (
    <div className="w-[390px] h-[844px] bg-[#121a12] text-white relative overflow-hidden flex flex-col font-sans">
      {/* Top Header */}
      <div className="h-[56px] flex-shrink-0 border-b border-[#253D2C] bg-[#121a12] flex items-center justify-between px-4 z-10">
        <h1 className="text-lg font-semibold text-white">My Progress</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-[80px] no-scrollbar">
        <div className="p-4 space-y-6">
          
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1a2619] border border-[#253D2C] p-4 rounded-2xl flex flex-col items-start">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                <Book className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-white mb-1">1</span>
              <span className="text-xs text-[#9ca3af]">Total Chapters</span>
            </div>
            
            <div className="bg-[#1a2619] border border-[#253D2C] p-4 rounded-2xl flex flex-col items-start">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white mb-1">47</span>
              <span className="text-xs text-[#9ca3af]">Questions Done</span>
            </div>
            
            <div className="bg-[#1a2619] border border-[#253D2C] p-4 rounded-2xl flex flex-col items-start">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
                <Target className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-white mb-1">72%</span>
              <span className="text-xs text-[#9ca3af]">Overall Accuracy</span>
            </div>
            
            <div className="bg-[#1a2619] border border-[#253D2C] p-4 rounded-2xl flex flex-col items-start">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                <Flame className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-2xl font-bold text-white mb-1">7 <span className="text-sm font-normal text-[#9ca3af]">days</span></span>
              <span className="text-xs text-[#9ca3af]">Study Streak</span>
            </div>
          </div>

          {/* Subject-wise Performance */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Subject-wise Performance</h2>
            <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl p-4 space-y-4">
              {/* Physics */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white">भौतिकी (Physics)</span>
                  </div>
                  <span className="text-sm font-bold text-white">65%</span>
                </div>
                <div className="h-2 w-full bg-[#121a12] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              
              {/* Chemistry */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Atom className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white">रसायन विज्ञान (Chemistry)</span>
                  </div>
                  <span className="text-sm font-bold text-white">78%</span>
                </div>
                <div className="h-2 w-full bg-[#121a12] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              
              {/* Mathematics */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-white">गणित (Mathematics)</span>
                  </div>
                  <span className="text-sm font-bold text-white">55%</span>
                </div>
                <div className="h-2 w-full bg-[#121a12] rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '55%' }}></div>
                </div>
              </div>
              
              {/* Biology */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Dna className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-white">जीव विज्ञान (Biology)</span>
                  </div>
                  <span className="text-sm font-bold text-white">82%</span>
                </div>
                <div className="h-2 w-full bg-[#121a12] rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter-wise Breakdown */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Chapter-wise Breakdown</h2>
            <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl p-4 flex gap-4 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold rounded">Physics</span>
                </div>
                <h3 className="text-sm font-medium text-white mb-3 line-clamp-1">Electric Charges and Fields</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#9ca3af]" />
                    <span className="text-xs text-[#9ca3af] w-16">Notes read</span>
                    <div className="flex-1 h-1.5 bg-[#121a12] rounded-full overflow-hidden">
                      <div className="h-full bg-[#2E6F40] rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <span className="text-[10px] text-white w-6 text-right">100%</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-[#9ca3af]" />
                    <span className="text-xs text-[#9ca3af] w-16">Questions</span>
                    <div className="flex-1 h-1.5 bg-[#121a12] rounded-full overflow-hidden">
                      <div className="h-full bg-[#2E6F40] rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-[10px] text-white w-6 text-right">45%</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#9ca3af]" />
                    <span className="text-xs text-[#9ca3af] w-16">Flashcards</span>
                    <div className="flex-1 h-1.5 bg-[#121a12] rounded-full overflow-hidden">
                      <div className="h-full bg-[#2E6F40] rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <span className="text-[10px] text-white w-6 text-right">20%</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TestTube className="w-3.5 h-3.5 text-[#9ca3af]" />
                    <span className="text-xs text-[#9ca3af] w-16">Simulations</span>
                    <div className="flex-1 h-1.5 bg-[#121a12] rounded-full overflow-hidden">
                      <div className="h-full bg-[#2E6F40] rounded-full" style={{ width: '0%' }}></div>
                    </div>
                    <span className="text-[10px] text-white w-6 text-right">0%</span>
                  </div>
                </div>
              </div>
              
              <div className="w-[60px] flex flex-col items-center justify-center border-l border-[#253D2C] pl-4">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="#121a12" strokeWidth="4" fill="none" />
                    <circle cx="24" cy="24" r="20" stroke="#4CBB17" strokeWidth="4" fill="none" strokeDasharray="125.6" strokeDashoffset="72.8" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-[10px] font-bold text-white">42%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="h-[64px] bg-[#1a2619] border-t border-[#253D2C] absolute bottom-0 left-0 right-0 flex items-center justify-around px-2 z-20 pb-safe">
        {/* Home - Inactive */}
        <button className="flex flex-col items-center justify-center w-16 h-12 gap-1.5">
          <Home className="w-5 h-5 text-[#6b7280]" />
          <span className="text-[10px] font-medium text-[#6b7280]">Home</span>
        </button>

        {/* Progress - Active */}
        <button className="flex flex-col items-center justify-center w-16 h-12 gap-1.5 relative">
          <div className="w-1 h-1 bg-[#2E6F40] rounded-full absolute -top-1" />
          <BarChart2 className="w-5 h-5 text-[#2E6F40]" />
          <span className="text-[10px] font-medium text-[#2E6F40]">Progress</span>
        </button>

        {/* Community - Inactive */}
        <button className="flex flex-col items-center justify-center w-16 h-12 gap-1.5">
          <Users className="w-5 h-5 text-[#6b7280]" />
          <span className="text-[10px] font-medium text-[#6b7280]">Community</span>
        </button>

        {/* Profile - Inactive */}
        <button className="flex flex-col items-center justify-center w-16 h-12 gap-1.5">
          <User className="w-5 h-5 text-[#6b7280]" />
          <span className="text-[10px] font-medium text-[#6b7280]">Profile</span>
        </button>
      </div>
    </div>
  );
}
