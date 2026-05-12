import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Home, 
  Upload, 
  Users, 
  TrendingUp, 
  User,
  Heart,
  Coins,
  ChevronRight,
  MoreVertical,
  BookOpen
} from 'lucide-react';

export function CommunityHub() {
  const [activeTab, setActiveTab] = useState('Public Notes');
  const [activeClass, setActiveClass] = useState('Class 12');
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [liked1, setLiked1] = useState(false);
  const [liked2, setLiked2] = useState(true);

  const tabs = ['Public Notes', 'Discover', 'Friends', 'Leaderboard'];
  const classes = ['Class 11', 'Class 12'];
  const subjects = ['Physics', 'Chemistry', 'Math', 'Biology', 'English'];

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-[#FAF6F1] font-sans overflow-hidden border-x border-gray-200 shadow-xl relative">
      
      {/* TOP BAR */}
      <div className="fixed top-0 w-full max-w-md h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2E6F40] rounded flex items-center justify-center text-white font-bold text-sm">
            T2
          </div>
          <span className="font-bold text-gray-900 text-lg">Topper 2.0</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-[#2E6F40] transition-colors h-10 w-10 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </button>
          <button className="relative text-gray-600 hover:text-[#2E6F40] transition-colors h-10 w-10 flex items-center justify-center">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
              3
            </span>
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto mt-14 mb-16 pb-6">
        
        {/* SUB-TABS */}
        <div className="w-full overflow-x-auto no-scrollbar border-b border-gray-200 bg-white sticky top-0 z-40">
          <div className="flex px-4 py-3 gap-2 min-w-max">
            {tabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT based on active tab */}
        {activeTab === 'Public Notes' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* FILTER BAR */}
            <div className="py-4 px-4 bg-[#FAF6F1] space-y-3">
              {/* Class row */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {classes.map(cls => (
                  <button 
                    key={cls}
                    onClick={() => setActiveClass(cls)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                      activeClass === cls 
                        ? 'bg-[#2E6F40] text-white border-[#2E6F40]' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#2E6F40]/30'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
              
              {/* Subject row */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {subjects.map(sub => (
                  <button 
                    key={sub}
                    onClick={() => setActiveSubject(sub)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                      activeSubject === sub 
                        ? 'bg-[#2E6F40] text-white border-[#2E6F40]' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#2E6F40]/30'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* FEED CARDS */}
            <div className="px-4 py-2 space-y-4">
              
              {/* CARD 1 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                      R
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 text-sm">@ravi_topper</span>
                        <span className="text-gray-400 text-xs">• 2h ago</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">12 — Moving Charges</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium uppercase tracking-wide border border-blue-100">
                      Physics
                    </span>
                    <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium flex items-center gap-1 border border-gray-100">
                      AI Notes · 8 sections
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-1">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setLiked1(!liked1)}
                      className="flex items-center gap-1.5 group"
                    >
                      <div className={`p-1.5 rounded-full transition-colors ${liked1 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                        <Heart className={`w-4 h-4 ${liked1 ? 'fill-current' : ''}`} />
                      </div>
                      <span className={`text-xs font-medium ${liked1 ? 'text-red-500' : 'text-gray-500'}`}>
                        {liked1 ? '25 likes' : '24 likes'}
                      </span>
                    </button>
                    
                    <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#FFF9E5] text-[#B8860B] border border-[#FBEBBE] transition-colors hover:bg-[#FBEBBE]">
                      <Coins className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold tracking-wide">Coins Bhejo</span>
                    </button>
                  </div>
                  
                  <button className="flex items-center gap-1 text-[#2E6F40] font-bold text-sm hover:underline">
                    Padhna Shuru Karo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CARD 2 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                      P
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 text-sm">@priya302</span>
                        <span className="text-gray-400 text-xs">• 5h ago</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">11 — Chemical Equilibrium</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium uppercase tracking-wide border border-purple-100">
                      Chemistry
                    </span>
                    <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium flex items-center gap-1 border border-gray-100">
                      Quick Revise
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-1">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setLiked2(!liked2)}
                      className="flex items-center gap-1.5 group"
                    >
                      <div className={`p-1.5 rounded-full transition-colors ${liked2 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                        <Heart className={`w-4 h-4 ${liked2 ? 'fill-current' : ''}`} />
                      </div>
                      <span className={`text-xs font-medium ${liked2 ? 'text-red-500' : 'text-gray-500'}`}>
                        {liked2 ? '13 likes' : '12 likes'}
                      </span>
                    </button>
                    
                    <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#FFF9E5] text-[#B8860B] border border-[#FBEBBE] transition-colors hover:bg-[#FBEBBE]">
                      <Coins className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold tracking-wide">Coins Bhejo</span>
                    </button>
                  </div>
                  
                  <button className="flex items-center gap-1 text-[#2E6F40] font-bold text-sm hover:underline">
                    Padhna Shuru Karo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
        
        {/* Placeholder for other tabs */}
        {activeTab !== 'Public Notes' && (
          <div className="p-8 text-center text-gray-500 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900 mb-1">{activeTab} section coming soon</p>
            <p className="text-sm">We're working on bringing you the best community experience.</p>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 w-full max-w-md h-16 bg-white border-t border-gray-200 flex justify-around items-center px-2 z-50 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <NavButton icon={<Home className="w-6 h-6" />} label="Home" />
        <NavButton icon={<Upload className="w-6 h-6" />} label="Upload" />
        <NavButton icon={<Users className="w-6 h-6" />} label="Community" active />
        <NavButton icon={<TrendingUp className="w-6 h-6" />} label="Progress" />
        <NavButton icon={<User className="w-6 h-6" />} label="Profile" />
      </div>

    </div>
  );
}

function NavButton({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${active ? 'text-[#2E6F40]' : 'text-gray-400 hover:text-gray-600'}`}>
      <div className={`${active ? 'scale-110 transition-transform' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
    </button>
  );
}
