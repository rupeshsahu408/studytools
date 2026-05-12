import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Book, 
  HelpCircle, 
  FileText, 
  Layers, 
  Sigma, 
  GitMerge, 
  FlaskConical, 
  AlertTriangle, 
  MessageCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import './_group.css';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ChapterPage() {
  const [activeTab, setActiveTab] = useState('Notes');
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>(['sec1', 'sec2']);

  const tabs = [
    { id: 'Notes', icon: Book, label: 'Notes' },
    { id: 'Questions', icon: HelpCircle, label: 'Questions' },
    { id: 'Summary', icon: FileText, label: 'Summary' },
    { id: 'Flashcards', icon: Layers, label: 'Flashcards' },
    { id: 'Formulas', icon: Sigma, label: 'Formulas' },
    { id: 'Mind Map', icon: GitMerge, label: 'Mind Map' },
    { id: 'Simulations', icon: FlaskConical, label: 'Simulations' },
    { id: 'Mistakes', icon: AlertTriangle, label: 'Mistakes' },
    { id: 'Doubt Chat', icon: MessageCircle, label: 'Doubt Chat' },
  ];

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-[390px] h-[844px] bg-[#121a12] text-white flex flex-col font-sans overflow-hidden mx-auto relative shadow-2xl rounded-3xl border border-[#253D2C]">
      {/* Top Header */}
      <header className="flex-none h-[56px] px-4 flex items-center justify-between bg-[#121a12] border-b border-[#253D2C] z-10">
        <button className="p-2 -ml-2 text-white hover:bg-[#1a2619] rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-semibold truncate px-2">Ch.4 — Moving Charges</h1>
        <button className="p-2 -mr-2 text-white hover:bg-[#1a2619] rounded-full transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto flex flex-col pb-8 custom-scrollbar">
        {/* Chapter Info Bar */}
        <div className="px-4 py-4 border-b border-[#253D2C] bg-[#1a2619]">
          <div className="flex justify-between items-start mb-3">
            <span className="bg-blue-900/40 text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-800/50">
              Physics · Class 12
            </span>
            <button 
              onClick={() => setInfoExpanded(!infoExpanded)}
              className="text-[#9ca3af] hover:text-white transition-colors p-1"
            >
              {infoExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
          
          {infoExpanded && (
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[#253D2C]" />
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="125.6" strokeDashoffset="43.96" className="text-[#4CBB17]" strokeLinecap="round" />
                </svg>
                <span className="absolute text-[10px] font-bold text-white">65%</span>
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-white">Moving Charges and Magnetism</h2>
                <p className="text-xs text-[#9ca3af] mt-0.5">65% Complete · 2/5 sections done</p>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Tab Bar */}
        <div className="w-full overflow-x-auto no-scrollbar border-b border-[#253D2C] bg-[#1a2619] flex-none">
          <div className="flex px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-none flex items-center gap-2 px-4 py-3 border-b-2 transition-colors min-w-max ${
                  activeTab === tab.id
                    ? 'border-[#4CBB17] text-[#4CBB17]'
                    : 'border-transparent text-[#9ca3af]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-white">Chapter Notes</h2>
              <span className="text-xs font-medium text-[#9ca3af] bg-[#1a2619] px-2 py-0.5 rounded mt-1 w-fit border border-[#253D2C]">
                4,594 words · Detailed
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1a2619] border border-[#253D2C] text-[#9ca3af] hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#1a2619] border-[#253D2C] text-white">
                <DropdownMenuItem className="focus:bg-[#253D2C] focus:text-white cursor-pointer">
                  <Download className="w-4 h-4 mr-2" /> Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-[#253D2C] focus:text-white cursor-pointer">
                  <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-[#253D2C] focus:text-white cursor-pointer" onClick={() => setExpandedSections(['sec1', 'sec2', 'sec3'])}>
                  <Maximize2 className="w-4 h-4 mr-2" /> Expand All
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-[#253D2C] focus:text-white cursor-pointer" onClick={() => setExpandedSections([])}>
                  <Minimize2 className="w-4 h-4 mr-2" /> Collapse All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-4">
            {/* Section 1 */}
            <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl overflow-hidden">
              <button 
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
                onClick={() => toggleSection('sec1')}
              >
                <h3 className="font-semibold text-[15px] pr-4">1. Magnetic Force (चुंबकीय बल)</h3>
                {expandedSections.includes('sec1') ? 
                  <ChevronUp className="w-5 h-5 text-[#9ca3af] flex-shrink-0" /> : 
                  <ChevronDown className="w-5 h-5 text-[#9ca3af] flex-shrink-0" />
                }
              </button>
              
              {expandedSections.includes('sec1') && (
                <div className="px-4 pb-4 pt-1 border-t border-[#253D2C]/50">
                  <p className="text-sm text-[#9ca3af] mb-3 leading-relaxed">
                    When a charge <span className="text-white">q</span> moves with velocity <span className="text-white">v</span> in a magnetic field <span className="text-white">B</span>, it experiences a force known as the Lorentz force.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex gap-2 text-sm text-[#9ca3af]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4CBB17] mt-1.5 flex-shrink-0" />
                      <span>Formula: <span className="text-white font-mono">F = q(v × B)</span></span>
                    </li>
                    <li className="flex gap-2 text-sm text-[#9ca3af]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4CBB17] mt-1.5 flex-shrink-0" />
                      <span>Direction is given by Fleming's Left Hand Rule (फ्लेमिंग का वामहस्त नियम).</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Section 2 */}
            <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl overflow-hidden">
              <button 
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
                onClick={() => toggleSection('sec2')}
              >
                <h3 className="font-semibold text-[15px] pr-4">2. Motion in a Magnetic Field</h3>
                {expandedSections.includes('sec2') ? 
                  <ChevronUp className="w-5 h-5 text-[#9ca3af] flex-shrink-0" /> : 
                  <ChevronDown className="w-5 h-5 text-[#9ca3af] flex-shrink-0" />
                }
              </button>
              
              {expandedSections.includes('sec2') && (
                <div className="px-4 pb-4 pt-1 border-t border-[#253D2C]/50">
                  <p className="text-sm text-[#9ca3af] mb-3 leading-relaxed">
                    A charged particle moving perpendicular to a uniform magnetic field traces a circular path. The magnetic force provides the necessary centripetal force.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex gap-2 text-sm text-[#9ca3af]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4CBB17] mt-1.5 flex-shrink-0" />
                      <span>Radius of path: <span className="text-white font-mono">r = mv/qB</span></span>
                    </li>
                    <li className="flex gap-2 text-sm text-[#9ca3af]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4CBB17] mt-1.5 flex-shrink-0" />
                      <span>Time period (T) is independent of velocity and radius.</span>
                    </li>
                  </ul>
                  <div className="mt-4 bg-[#121a12] p-3 rounded-xl border border-[#253D2C]">
                    <div className="text-xs text-[#6b7280] mb-1 uppercase font-semibold tracking-wider">Bihar Board PYQ 2022</div>
                    <p className="text-sm text-[#e5e7eb]">What is the trajectory of an electron projected parallel to a magnetic field?</p>
                    <p className="text-sm text-[#4CBB17] mt-1 font-medium">Ans: Straight line (सीधी रेखा)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3 */}
            <div className="bg-[#1a2619] border border-[#253D2C] rounded-2xl overflow-hidden">
              <button 
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
                onClick={() => toggleSection('sec3')}
              >
                <h3 className="font-semibold text-[15px] pr-4">3. Biot-Savart Law (बायो-सावर्ट नियम)</h3>
                {expandedSections.includes('sec3') ? 
                  <ChevronUp className="w-5 h-5 text-[#9ca3af] flex-shrink-0" /> : 
                  <ChevronDown className="w-5 h-5 text-[#9ca3af] flex-shrink-0" />
                }
              </button>
              
              {expandedSections.includes('sec3') && (
                <div className="px-4 pb-4 pt-1 border-t border-[#253D2C]/50">
                  <p className="text-sm text-[#9ca3af] mb-3 leading-relaxed">
                    Gives the magnetic field produced by a small current element <span className="text-white">dl</span> carrying current <span className="text-white">I</span>.
                  </p>
                </div>
              )}
            </div>
            
            <div className="h-6"></div> {/* Bottom spacing */}
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #253D2C;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
