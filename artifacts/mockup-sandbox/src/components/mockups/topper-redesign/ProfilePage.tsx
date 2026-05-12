import React, { useState } from 'react';
import { 
  User, Settings, Pencil, Home, BarChart2, Users, 
  Flame, Calendar, Brain, Award, CalendarDays, CheckCircle2,
  ChevronRight
} from 'lucide-react';
import './_group.css';

export default function ProfilePage() {
  const [anonymousMode, setAnonymousMode] = useState(false);

  return (
    <div className="w-[390px] h-[844px] bg-[#121a12] text-white relative overflow-hidden flex flex-col font-sans">
      {/* Top Header */}
      <div className="h-[56px] w-full bg-[#121a12] border-b border-[#253D2C] flex items-center justify-between px-4 shrink-0 relative z-10">
        <div className="flex-1"></div>
        <h1 className="text-lg font-semibold flex-1 text-center">Profile</h1>
        <div className="flex-1 flex justify-end items-center gap-4 text-[#9ca3af]">
          <Pencil size={20} />
          <Settings size={20} />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-[80px] scrollbar-hide">
        <div className="p-4 flex flex-col gap-4">
          
          {/* Profile Card */}
          <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#2E6F40] flex items-center justify-center text-lg font-bold text-white border-2 border-[#4CBB17]">
                  RK
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
                  <CheckCircle2 size={16} className="text-[#4CBB17] fill-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Ravi Kumar</h2>
                <p className="text-[#9ca3af] text-sm">@ravi_topper</p>
              </div>
            </div>
            
            <div className="text-[#9ca3af] text-sm">
              <p>Class 12 • ABC School • Patna, Bihar</p>
            </div>

            <div className="h-[1px] w-full bg-[#253D2C] my-1"></div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Anonymous Mode</span>
              <button 
                onClick={() => setAnonymousMode(!anonymousMode)}
                className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${anonymousMode ? 'bg-[#4CBB17]' : 'bg-[#253D2C]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${anonymousMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Streak & Exam Countdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-orange-500" />
                <span className="font-semibold">7 Days</span>
              </div>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <div key={day} className={`w-3 h-3 rounded-sm ${day <= 7 ? 'bg-orange-500' : 'bg-[#253D2C]'}`} />
                ))}
              </div>
              <span className="text-xs text-[#9ca3af] mt-1">Current Streak</span>
            </div>

            <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl p-4 flex flex-col justify-center items-center gap-2 text-center">
              <Calendar size={20} className="text-[#4CBB17]" />
              <div className="bg-[#2E6F40] bg-opacity-30 text-[#4CBB17] text-xs font-bold px-2 py-1 rounded">
                62 days to
              </div>
              <span className="text-sm font-semibold">Bihar Board</span>
            </div>
          </div>

          {/* Daily Goal */}
          <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm">Aaj Ka Target</h3>
              <span className="text-xs text-[#9ca3af] font-medium">3/10 questions</span>
            </div>
            <div className="w-full bg-[#121a12] rounded-full h-2">
              <div className="bg-[#4CBB17] h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>

          {/* AI Weak Areas Button */}
          <button className="w-full min-h-[44px] bg-transparent border border-[#2E6F40] text-[#4CBB17] rounded-xl flex items-center justify-center gap-2 py-3 font-semibold">
            <Brain size={18} />
            AI se Weak Areas Analyze Karo
          </button>

          {/* Badges Section */}
          <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Achievements</h3>
              <div className="text-xs text-[#4CBB17] flex items-center gap-1">
                View All <ChevronRight size={14} />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {[
                { label: "1st Chap", unlocked: true },
                { label: "1st Note", unlocked: true },
                { label: "10 Q", unlocked: true },
                { label: "50 Q", unlocked: false },
                { label: "100 Q", unlocked: false },
                { label: "250 Q", unlocked: false },
                { label: "3 Day", unlocked: true },
                { label: "7 Day", unlocked: true },
                { label: "30 Day", unlocked: false },
                { label: "Flash Pro", unlocked: false },
                { label: "Sim Expl", unlocked: false },
                { label: "All Sec", unlocked: false },
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${badge.unlocked ? 'bg-[#2E6F40] bg-opacity-20 border-[#4CBB17] text-[#4CBB17]' : 'bg-[#121a12] border-[#253D2C] text-[#6b7280]'}`}>
                    <Award size={20} />
                  </div>
                  <span className={`text-[10px] text-center leading-tight ${badge.unlocked ? 'text-white' : 'text-[#6b7280]'}`}>
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Revision Planner */}
          <div className="bg-[#1a2619] border border-[#2E6F40] rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2E6F40] rounded-full filter blur-[50px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#2E6F40] bg-opacity-30 flex items-center justify-center text-[#4CBB17]">
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-white">Auto Revision Plan</h3>
                <p className="text-xs text-[#9ca3af]">Your personalized study schedule</p>
              </div>
            </div>

            <div className="bg-[#121a12] rounded-xl p-3 flex flex-col gap-2 relative z-10 border border-[#253D2C]">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#4CBB17] font-medium w-12">Week 1</span>
                <span className="text-[#9ca3af]">Electrostatics & Ray Optics</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#6b7280] font-medium w-12">Week 2</span>
                <span className="text-[#6b7280]">Current Electricity & Magnetism</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="h-[64px] w-full bg-[#1a2619] border-t border-[#253D2C] flex items-center justify-around px-2 shrink-0 absolute bottom-0 left-0 z-20">
        <div className="flex flex-col items-center justify-center gap-1 w-16 h-full text-[#6b7280]">
          <Home size={24} />
          <span className="text-[10px] font-medium">Home</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 w-16 h-full text-[#6b7280]">
          <BarChart2 size={24} />
          <span className="text-[10px] font-medium">Progress</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 w-16 h-full text-[#6b7280]">
          <Users size={24} />
          <span className="text-[10px] font-medium">Community</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 w-16 h-full text-[#4CBB17] relative">
          <div className="absolute top-1 w-1 h-1 bg-[#4CBB17] rounded-full"></div>
          <User size={24} className="mt-1" />
          <span className="text-[10px] font-medium">Profile</span>
        </div>
      </div>
    </div>
  );
}
