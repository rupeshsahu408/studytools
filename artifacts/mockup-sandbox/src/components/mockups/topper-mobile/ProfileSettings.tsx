import React, { useState } from 'react';
import { 
  Home, 
  Upload, 
  Users, 
  TrendingUp, 
  User, 
  Pencil,
  ChevronRight,
  Moon,
  Bell,
  Share,
  Info,
  LogOut
} from 'lucide-react';

export function ProfileSettings() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF6F1] font-sans text-gray-900 overflow-hidden">
      {/* TOP BAR */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white shadow-sm flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#2E6F40] text-white flex items-center justify-center font-bold text-sm">T2</div>
          <span className="font-bold text-[#2E6F40] text-lg tracking-tight">Topper 2.0</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-end text-gray-600">
          <Pencil size={20} />
        </button>
      </header>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto pt-14 pb-20">
        {/* Profile Hero */}
        <section className="px-4 pt-6 pb-4 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[#2E6F40] text-white flex items-center justify-center text-3xl font-bold mb-3 shadow-md">
            RS
          </div>
          <h1 className="text-xl font-bold">Ravi Sharma</h1>
          <p className="text-gray-500 text-sm mb-1">@ravi_topper</p>
          <p className="text-gray-600 text-sm mb-4 text-center">Class 12 · D.A.V School, Patna, Bihar</p>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm text-sm font-medium border border-gray-100 flex items-center gap-1">
              <span>7🔥</span> Streak
            </div>
            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm text-sm font-medium border border-gray-100">
              127 Qs
            </div>
            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm text-sm font-medium border border-gray-100">
              78% Acc
            </div>
          </div>
          
          <div className="bg-[#FFF8E7] text-[#D4AF37] border border-[#FBEBBE] px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-sm">
            <span>🪙</span> 550 coins
          </div>
        </section>

        {/* Exam Countdown */}
        <section className="px-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-gray-800">Bihar Board Exam</h2>
              <span className="text-sm font-semibold text-[#2E6F40]">247 days bache hain</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2E6F40] rounded-full w-[32%]"></div>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className="px-4 mb-6">
          <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider">Achievements (7/12)</h2>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {/* Unlocked */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-xl border border-green-200">📚</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-xl border border-green-200">📝</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-xl border border-green-200">✅</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-xl border border-green-200">🔥</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-xl border border-green-200">🔥</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-xl border border-green-200">⚡</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-xl border border-green-200">🔬</div>
              </div>
              
              {/* Locked */}
              <div className="flex flex-col items-center gap-1 opacity-40 grayscale">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl border border-gray-200">🏆</div>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-40 grayscale">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl border border-gray-200">🌟</div>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-40 grayscale">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl border border-gray-200">🎯</div>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-40 grayscale">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl border border-gray-200">🏅</div>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-40 grayscale">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl border border-gray-200">👑</div>
              </div>
            </div>
          </div>
        </section>

        {/* Settings Section */}
        <section className="px-4 mb-8">
          <h2 className="text-sm font-bold text-gray-500 mb-3 px-1 uppercase tracking-wider">Settings</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button 
              className="w-full h-[52px] px-4 flex items-center justify-between border-b border-gray-100 active:bg-gray-50" 
              onClick={() => setDarkMode(!darkMode)}
            >
              <div className="flex items-center gap-3 text-gray-700">
                <Moon size={20} className="text-gray-400" />
                <span className="font-medium">Dark Mode</span>
              </div>
              <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${darkMode ? 'bg-[#2E6F40]' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>
            <button className="w-full h-[52px] px-4 flex items-center justify-between border-b border-gray-100 active:bg-gray-50">
              <div className="flex items-center gap-3 text-gray-700">
                <Bell size={20} className="text-gray-400" />
                <span className="font-medium">Notifications</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full h-[52px] px-4 flex items-center justify-between border-b border-gray-100 active:bg-gray-50">
              <div className="flex items-center gap-3 text-gray-700">
                <Share size={20} className="text-gray-400" />
                <span className="font-medium">Share Profile</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full h-[52px] px-4 flex items-center justify-between border-b border-gray-100 active:bg-gray-50">
              <div className="flex items-center gap-3 text-gray-700">
                <Info size={20} className="text-gray-400" />
                <span className="font-medium">About</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full h-[52px] px-4 flex items-center justify-between active:bg-red-50">
              <div className="flex items-center gap-3 text-red-500">
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </div>
            </button>
          </div>
        </section>
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50">
        <button className="flex flex-col items-center justify-center w-16 h-full text-gray-400 gap-1">
          <Home size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-full text-gray-400 gap-1">
          <Upload size={20} />
          <span className="text-[10px] font-medium">Upload</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-full text-gray-400 gap-1">
          <Users size={20} />
          <span className="text-[10px] font-medium">Community</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-full text-gray-400 gap-1">
          <TrendingUp size={20} />
          <span className="text-[10px] font-medium">Progress</span>
        </button>
        <button className="flex flex-col items-center justify-center w-16 h-full text-[#2E6F40] gap-1">
          <User size={20} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default ProfileSettings;
