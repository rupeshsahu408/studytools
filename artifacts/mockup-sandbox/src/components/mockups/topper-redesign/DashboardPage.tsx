import React from 'react';
import { 
  Home, 
  BarChart2, 
  Users, 
  User, 
  Moon, 
  Flame, 
  Target, 
  Percent, 
  Globe, 
  Plus, 
  Atom, 
  ArrowRight,
  Calculator,
  Leaf
} from 'lucide-react';
import './_group.css';

export default function DashboardPage() {
  return (
    <div className="w-[390px] h-[844px] bg-[#121a12] text-white flex flex-col relative overflow-hidden font-sans border border-[#253D2C]">
      {/* Top Header */}
      <header className="h-[56px] flex-none bg-[#121a12] border-b border-[#253D2C] flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2E6F40] rounded-lg flex items-center justify-center font-bold text-white">
            T2
          </div>
          <span className="font-semibold text-white">Topper 2.0</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-[#9ca3af] hover:text-white rounded-full">
          <Moon size={20} />
        </button>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto pb-[80px] no-scrollbar">
        {/* Greeting Section */}
        <section className="px-4 pt-5 pb-6">
          <h1 className="text-2xl font-bold mb-1">Namaste, Ravi! 👋</h1>
          <p className="text-[#9ca3af] text-sm mb-4">Class 12 · Bihar Board · Science</p>
          <div className="inline-block border border-[#2E6F40] text-[#4CBB17] text-xs font-medium px-3 py-1 rounded-full">
            1/5 chapters used
          </div>
        </section>

        {/* Stats Strip */}
        <section className="px-4 mb-8">
          <div className="flex gap-3 h-[90px]">
            {/* Streak */}
            <div className="flex-1 bg-[#1a2619] rounded-2xl border border-[#253D2C] p-3 flex flex-col justify-between">
              <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame size={16} className="text-orange-500" />
              </div>
              <div>
                <div className="text-white font-bold">7 days</div>
                <div className="text-[#6b7280] text-xs">Streak</div>
              </div>
            </div>
            
            {/* Target */}
            <div className="flex-1 bg-[#1a2619] rounded-2xl border border-[#253D2C] p-3 flex flex-col justify-between relative overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#2E6F40]/20 flex items-center justify-center">
                <Target size={16} className="text-[#4CBB17]" />
              </div>
              <div>
                <div className="text-white font-bold">3/10 Q</div>
                <div className="text-[#6b7280] text-xs">Aaj Ka Target</div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-[#2E6F40] w-[30%]" />
            </div>

            {/* Accuracy */}
            <div className="flex-1 bg-[#1a2619] rounded-2xl border border-[#253D2C] p-3 flex flex-col justify-between relative overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Percent size={16} className="text-blue-400" />
              </div>
              <div>
                <div className="text-white font-bold">72%</div>
                <div className="text-[#6b7280] text-xs">Accuracy</div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-blue-500 w-[72%]" />
            </div>
          </div>
        </section>

        {/* Chapter Library */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#9ca3af] text-xs font-bold tracking-wider">CHAPTER LIBRARY</h2>
            <button className="flex items-center gap-1.5 text-[#2E6F40] hover:text-[#4CBB17] transition-colors">
              <Globe size={14} />
              <span className="text-sm font-medium">Community Notes</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Add Chapter Button */}
            <button className="w-full h-14 rounded-2xl border-2 border-dashed border-[#2E6F40]/50 bg-[#2E6F40]/10 flex items-center justify-center gap-2 text-[#4CBB17] hover:bg-[#2E6F40]/20 transition-colors">
              <Plus size={20} />
              <span className="font-medium">Nayi Chapter Add Karo</span>
            </button>

            {/* Chapter Card 1 */}
            <div className="bg-[#1a2619] rounded-2xl border border-[#253D2C] p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Atom size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white truncate max-w-[180px]">Electric Charges & Fields</h3>
                      <span className="bg-[#2E6F40]/20 text-[#4CBB17] text-[10px] px-2 py-0.5 rounded-full font-medium">Class 12</span>
                    </div>
                    <p className="text-[#6b7280] text-xs">Physics • Last studied 2d ago</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-1 h-1.5 w-full">
                  <div className="flex-1 bg-[#4CBB17] rounded-l-full"></div>
                  <div className="flex-1 bg-[#4CBB17]"></div>
                  <div className="flex-1 bg-[#253D2C]"></div>
                  <div className="flex-1 bg-[#253D2C]"></div>
                  <div className="flex-1 bg-[#253D2C] rounded-r-full"></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#6b7280]">
                  <span>Notes</span>
                  <span>Qns</span>
                  <span>Cards</span>
                  <span>Sims</span>
                  <span>Chat</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button className="text-[#4CBB17] text-sm font-medium flex items-center gap-1 hover:text-[#2E6F40]">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Chapter Card 2 */}
            <div className="bg-[#1a2619] rounded-2xl border border-[#253D2C] p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Calculator size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white truncate max-w-[180px]">Calculus Integration</h3>
                      <span className="bg-[#2E6F40]/20 text-[#4CBB17] text-[10px] px-2 py-0.5 rounded-full font-medium">Class 12</span>
                    </div>
                    <p className="text-[#6b7280] text-xs">Mathematics • Just added</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-1 h-1.5 w-full">
                  <div className="flex-1 bg-[#4CBB17] rounded-l-full"></div>
                  <div className="flex-1 bg-[#253D2C]"></div>
                  <div className="flex-1 bg-[#253D2C]"></div>
                  <div className="flex-1 bg-[#253D2C]"></div>
                  <div className="flex-1 bg-[#253D2C] rounded-r-full"></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#6b7280]">
                  <span>Notes</span>
                  <span>Qns</span>
                  <span>Cards</span>
                  <span>Sims</span>
                  <span>Chat</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button className="text-[#4CBB17] text-sm font-medium flex items-center gap-1 hover:text-[#2E6F40]">
                  Start <ArrowRight size={16} />
                </button>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="h-[64px] flex-none bg-[#1a2619] border-t border-[#253D2C] flex items-center justify-between px-6 absolute bottom-0 w-full z-10 pb-safe">
        <button className="flex flex-col items-center justify-center gap-1 w-12 h-full relative">
          <div className="absolute top-1 w-1 h-1 bg-[#4CBB17] rounded-full"></div>
          <Home size={24} className="text-[#4CBB17] mt-1" />
          <span className="text-[10px] font-medium text-[#4CBB17]">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 w-12 h-full">
          <BarChart2 size={24} className="text-[#6b7280]" />
          <span className="text-[10px] font-medium text-[#6b7280]">Progress</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 w-12 h-full">
          <Users size={24} className="text-[#6b7280]" />
          <span className="text-[10px] font-medium text-[#6b7280]">Community</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 w-12 h-full">
          <User size={24} className="text-[#6b7280]" />
          <span className="text-[10px] font-medium text-[#6b7280]">Profile</span>
        </button>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}} />
    </div>
  );
}
