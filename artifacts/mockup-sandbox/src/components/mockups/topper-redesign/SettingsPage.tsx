import React, { useState } from 'react';
import { 
  ArrowLeft, UserCircle, Key, AtSign, ChevronRight, Moon, 
  Languages, Bell, Target, EyeOff, Shield, Info, Star, LogOut, Trash2
} from 'lucide-react';
import './_group.css';

const ToggleSwitch = ({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${isOn ? 'bg-[#4CBB17]' : 'bg-[#253D2C]'}`}
  >
    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="text-[#6b7280] text-xs font-semibold tracking-wider px-4 mb-2 mt-6">
    {title}
  </div>
);

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(true);
  const [anonymous, setAnonymous] = useState(false);

  return (
    <div className="w-[390px] h-[844px] bg-[#121a12] text-white font-sans overflow-hidden flex flex-col relative shrink-0">
      {/* Top Header */}
      <div className="h-[56px] shrink-0 border-b border-[#253D2C] flex items-center px-4 bg-[#121a12] z-10">
        <button className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full active:bg-[#1a2619]">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-lg font-semibold ml-2">Settings</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-10">
        
        {/* Account Section */}
        <SectionHeader title="ACCOUNT" />
        <div className="bg-[#1a2619] rounded-2xl mx-4 overflow-hidden border border-[#253D2C]">
          <button className="w-full flex items-center justify-between p-4 border-b border-[#253D2C] active:bg-[#121a12]">
            <div className="flex items-center gap-3">
              <UserCircle className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">Edit Profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6b7280]" />
          </button>
          
          <button className="w-full flex items-center justify-between p-4 border-b border-[#253D2C] active:bg-[#121a12]">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">Change Password</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6b7280]" />
          </button>

          <button className="w-full flex items-center justify-between p-4 opacity-70">
            <div className="flex items-center gap-3">
              <AtSign className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">Username: @ravi_topper</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase bg-[#253D2C] text-[#9ca3af] px-2 py-0.5 rounded-sm">Permanent</span>
              <ChevronRight className="w-5 h-5 text-[#253D2C]" />
            </div>
          </button>
        </div>

        {/* Appearance Section */}
        <SectionHeader title="APPEARANCE" />
        <div className="bg-[#1a2619] rounded-2xl mx-4 overflow-hidden border border-[#253D2C]">
          <div className="w-full flex items-center justify-between p-4 border-b border-[#253D2C]">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">Dark Mode</span>
            </div>
            <ToggleSwitch isOn={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </div>

          <button className="w-full flex items-center justify-between p-4 active:bg-[#121a12]">
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">Language</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#9ca3af]">Hindi + English</span>
              <ChevronRight className="w-5 h-5 text-[#6b7280]" />
            </div>
          </button>
        </div>

        {/* Notifications Section */}
        <SectionHeader title="NOTIFICATIONS" />
        <div className="bg-[#1a2619] rounded-2xl mx-4 overflow-hidden border border-[#253D2C]">
          <div className="w-full flex items-center justify-between p-4 border-b border-[#253D2C]">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">Push Notifications</span>
            </div>
            <ToggleSwitch isOn={pushNotifs} onToggle={() => setPushNotifs(!pushNotifs)} />
          </div>

          <div className="w-full flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">Daily Goal Reminder</span>
            </div>
            <ToggleSwitch isOn={dailyGoal} onToggle={() => setDailyGoal(!dailyGoal)} />
          </div>
        </div>

        {/* Privacy Section */}
        <SectionHeader title="PRIVACY" />
        <div className="bg-[#1a2619] rounded-2xl mx-4 overflow-hidden border border-[#253D2C]">
          <div className="w-full flex items-center justify-between p-4 border-b border-[#253D2C]">
            <div className="flex items-center gap-3">
              <EyeOff className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">Anonymous Mode</span>
            </div>
            <ToggleSwitch isOn={anonymous} onToggle={() => setAnonymous(!anonymous)} />
          </div>

          <button className="w-full flex items-center justify-between p-4 active:bg-[#121a12]">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">Blocked Users</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#253D2C] flex items-center justify-center text-[12px] font-medium text-white">2</span>
              <ChevronRight className="w-5 h-5 text-[#6b7280]" />
            </div>
          </button>
        </div>

        {/* About Section */}
        <SectionHeader title="ABOUT" />
        <div className="bg-[#1a2619] rounded-2xl mx-4 overflow-hidden border border-[#253D2C]">
          <button className="w-full flex items-center justify-between p-4 border-b border-[#253D2C] active:bg-[#121a12]">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">App Version</span>
            </div>
            <span className="text-[13px] text-[#9ca3af]">v2.1.0</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 active:bg-[#121a12]">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-[#9ca3af]" />
              <span className="text-[15px]">Rate Topper 2.0</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6b7280]" />
          </button>
        </div>

        {/* Danger Zone */}
        <SectionHeader title="ACCOUNT" />
        <div className="bg-[#1a2619] rounded-2xl mx-4 mb-8 overflow-hidden border border-[#253D2C]">
          <button className="w-full flex items-center gap-3 p-4 border-b border-[#253D2C] active:bg-[#121a12]">
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="text-[15px] text-red-500">Logout</span>
          </button>

          <button className="w-full flex items-center gap-3 p-4 active:bg-[#121a12]">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span className="text-[15px] text-red-500">Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
