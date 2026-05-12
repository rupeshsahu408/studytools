import React, { useState } from 'react';
import { 
  ArrowLeft, Share2, Home, Upload, Users, TrendingUp, User, 
  BookOpen, HelpCircle, FileText, Layers, Sigma, GitMerge, 
  PlaySquare, AlertCircle, MessageCircle, CheckCircle2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ChapterPage() {
  const [activeTab, setActiveTab] = useState('Notes');

  const tabs = [
    { name: 'Notes', icon: BookOpen },
    { name: 'Questions', icon: HelpCircle },
    { name: 'Summary', icon: FileText },
    { name: 'Flashcards', icon: Layers },
    { name: 'Formula Sheet', icon: Sigma },
    { name: 'Mind Map', icon: GitMerge },
    { name: 'Simulations', icon: PlaySquare },
    { name: 'Mistakes', icon: AlertCircle },
    { name: 'Doubt Chat', icon: MessageCircle },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-[#FAF6F1] font-sans overflow-hidden">
      {/* Top Bar */}
      <header className="flex-none h-14 bg-white border-b flex items-center justify-between px-4 z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900 text-base truncate max-w-[200px]">
            Ch. 4 — Moving Charges
          </h1>
        </div>
        <button className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-700">
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        
        {/* Chapter Header Card */}
        <div className="bg-white border-b px-5 py-6 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              Physics · Class 12
            </span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
            Moving Charges and Magnetism
          </h2>
          
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-200" strokeWidth="4" />
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-500" strokeWidth="4" strokeDasharray="100" strokeDashoffset="40" strokeLinecap="round" />
              </svg>
              <span className="absolute text-xs font-bold text-gray-700">60%</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Progress</p>
              <p className="text-gray-500 text-xs mt-0.5">3/5 sections completed</p>
            </div>
          </div>
        </div>

        {/* Study Tools Tabs */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex overflow-x-auto hide-scrollbar px-4 py-3 gap-2 snap-x">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors snap-start border",
                    isActive 
                      ? "bg-[#2E6F40]/10 text-[#2E6F40] border-[#2E6F40]/20" 
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-[#2E6F40]" : "text-gray-400")} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area - Notes Preview */}
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-[#2E6F40]">
              <BookOpen className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Introduction to Magnetic Field</h3>
            </div>
            
            <div className="space-y-4 text-gray-700 text-base leading-relaxed">
              <p>
                Jab koi electric charge motion mein hota hai, toh woh apne aas-paas ek magnetic field create karta hai. 
                Oersted's experiment proved that electricity and magnetism are intimately related.
              </p>
              
              <div className="relative bg-amber-50 rounded-xl p-4 border border-amber-100/50 my-5">
                <div className="absolute -top-3 left-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Marks Important
                </div>
                <p className="pt-2 font-medium text-gray-800">
                  Lorentz Force: <span className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">F = q(v × B)</span>
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Yeh force hamesha velocity vector aur magnetic field vector dono ke perpendicular hoti hai. 
                  Exam mein iski direction nikalne par direct question aata hai (Right Hand Rule).
                </p>
              </div>
              
              <p>
                Biot-Savart Law ek fundamental law hai jo current carrying conductor ke karan produce hui 
                magnetic field ko calculate karne ke kaam aata hai.
              </p>
            </div>
          </div>
          
          <Button className="w-full bg-[#2E6F40] hover:bg-[#235631] text-white h-12 rounded-xl text-base font-semibold shadow-md">
            Notes Padhna Shuru Karo
          </Button>
        </div>

      </main>

      {/* Bottom Nav */}
      <nav className="flex-none h-16 bg-white border-t flex justify-around items-center px-2 pb-safe z-20">
        {[
          { icon: Home, label: 'Home', isActive: false },
          { icon: Upload, label: 'Upload', isActive: false },
          { icon: Users, label: 'Community', isActive: false },
          { icon: TrendingUp, label: 'Progress', isActive: false },
          { icon: User, label: 'Profile', isActive: false },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-lg",
                item.isActive ? "text-[#2E6F40]" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-6 h-6", item.isActive && "fill-current")} strokeWidth={item.isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
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

export default ChapterPage;
