import React from 'react';
import { BookOpen, HelpCircle, FlaskConical, BarChart2, ChevronRight } from 'lucide-react';
import './_group.css';

export default function LandingPage() {
  return (
    <div className="w-[390px] h-[844px] bg-[#121a12] text-white flex flex-col overflow-hidden font-sans relative">
      {/* Top Header */}
      <header className="h-[56px] flex items-center justify-between px-4 bg-[#121a12] border-b border-[#253D2C] flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2E6F40] rounded flex items-center justify-center font-bold text-lg">
            T2
          </div>
          <span className="font-bold text-lg">Topper 2.0</span>
        </div>
        <button className="px-4 py-1.5 rounded-xl border border-[#2E6F40] text-[#4CBB17] text-sm font-medium hover:bg-[#2E6F40] hover:text-white transition-colors">
          Login
        </button>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col scrollbar-hide">
        {/* Hero Section */}
        <section className="px-6 py-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a2619] border border-[#253D2C] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#4CBB17] animate-pulse"></span>
            <span className="text-xs text-[#9ca3af] font-medium tracking-wide uppercase">New Version Live</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
            Bihar Board ki sabse <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4CBB17] to-[#2E6F40]">smart</span> study partner 🎯
          </h1>
          <p className="text-[#9ca3af] text-lg mb-8 max-w-[300px] leading-relaxed">
            Class 11 & 12 Science — AI-powered notes, questions, and interactive simulations.
          </p>
          <button className="w-full bg-[#2E6F40] text-white px-4 py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(46,111,64,0.3)] flex items-center justify-center gap-2 hover:bg-[#235330] active:scale-[0.98] transition-all">
            Shuru Karo — Free mein
            <ChevronRight className="w-5 h-5" />
          </button>
        </section>

        {/* Features Grid */}
        <section className="px-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a2619] border border-[#253D2C] p-4 rounded-2xl flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3 text-blue-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-1">AI Notes</h3>
              <p className="text-xs text-[#9ca3af] leading-snug">Smart summaries in Hindi & English</p>
            </div>
            
            <div className="bg-[#1a2619] border border-[#253D2C] p-4 rounded-2xl flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-3 text-green-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-1">100+ Questions</h3>
              <p className="text-xs text-[#9ca3af] leading-snug">Chapter-wise practice tests</p>
            </div>

            <div className="bg-[#1a2619] border border-[#253D2C] p-4 rounded-2xl flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3 text-purple-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-1">Simulations</h3>
              <p className="text-xs text-[#9ca3af] leading-snug">Interactive 3D science labs</p>
            </div>

            <div className="bg-[#1a2619] border border-[#253D2C] p-4 rounded-2xl flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mb-3 text-orange-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-1">Progress Tracking</h3>
              <p className="text-xs text-[#9ca3af] leading-snug">Know your weak spots instantly</p>
            </div>
          </div>
        </section>

        {/* Social Proof Strip */}
        <section className="py-6 px-4 mt-4">
          <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl py-4 px-6 text-center">
            <div className="flex justify-center -space-x-2 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#1a2619] bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center`}>
                  <div className="w-full h-full rounded-full bg-white/10"></div>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#9ca3af] font-medium">
              <span className="text-white font-bold">50,000+</span> Bihar Board students using Topper 2.0
            </p>
          </div>
        </section>

        {/* Spacer for bottom CTA */}
        <div className="h-32"></div>
      </main>

      {/* Bottom CTA Fixed */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#121a12] via-[#121a12] to-transparent pb-8">
        <button className="w-full bg-[#2E6F40] text-white px-4 py-4 rounded-xl font-bold text-lg mb-4 flex items-center justify-center shadow-lg active:scale-[0.98] transition-transform">
          Abhi Sign Up Karo
        </button>
        <div className="text-center">
          <button className="text-[#9ca3af] text-sm font-medium hover:text-white transition-colors">
            Already have account? <span className="text-[#4CBB17]">Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
