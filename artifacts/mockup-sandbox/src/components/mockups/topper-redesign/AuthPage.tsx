import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import './_group.css';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-[390px] h-[844px] bg-[#121a12] text-white overflow-y-auto font-sans relative flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[#253D2C] shrink-0 sticky top-0 bg-[#121a12] z-10">
        <button className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-[#1a2619] transition-colors">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2">Topper 2.0</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col">
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#2E6F40] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#2E6F40]/20">
            <span className="text-3xl font-bold text-white tracking-tighter">T2</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">Topper 2.0</h2>
          <p className="text-[#9ca3af] text-sm">Bihar Board ka AI tutor</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#1a2619] p-1 rounded-xl flex mb-8 border border-[#253D2C]">
          <button 
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'login' ? 'bg-[#2E6F40] text-white shadow-sm' : 'text-[#9ca3af]'}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'signup' ? 'bg-[#2E6F40] text-white shadow-sm' : 'text-[#9ca3af]'}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#9ca3af]">Email ya Phone Number</label>
            <input 
              type="text" 
              placeholder="tumhara@email.com"
              className="bg-[#1a2619] border border-[#253D2C] text-white h-[52px] px-4 rounded-xl focus:outline-none focus:border-[#4CBB17] transition-colors placeholder:text-[#6b7280]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#9ca3af]">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                className="bg-[#1a2619] border border-[#253D2C] text-white h-[52px] pl-4 pr-12 rounded-xl w-full focus:outline-none focus:border-[#4CBB17] transition-colors placeholder:text-[#6b7280]"
              />
              <button 
                className="absolute right-0 top-0 h-[52px] w-12 flex items-center justify-center text-[#9ca3af] hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="text-[#4CBB17] text-sm font-medium hover:underline">
              Forgot Password?
            </button>
          </div>

          <button className="w-full bg-[#2E6F40] text-white font-medium h-[52px] rounded-xl mt-2 active:scale-[0.98] transition-transform">
            {activeTab === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[#253D2C]"></div>
          <span className="text-[#6b7280] text-sm font-medium">ya</span>
          <div className="flex-1 h-px bg-[#253D2C]"></div>
        </div>

        {/* Google Button */}
        <button className="w-full bg-transparent border border-[#253D2C] hover:bg-[#1a2619] text-white font-medium h-[52px] rounded-xl flex items-center justify-center gap-3 transition-colors active:scale-[0.98]">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google se {activeTab === 'login' ? 'Login' : 'Sign Up'} karo
        </button>

        <div className="mt-auto pt-8 flex justify-center pb-8">
          <p className="text-[#9ca3af] text-sm">
            {activeTab === 'login' ? 'Account nahi hai? ' : 'Pehle se account hai? '}
            <button 
              className="text-[#4CBB17] font-medium hover:underline"
              onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
            >
              {activeTab === 'login' ? 'Sign Up karo' : 'Login karo'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
