import React, { useState } from 'react';
import './_group.css';
import {
  Home,
  BarChart2,
  Users,
  User,
  ArrowLeft,
  SlidersHorizontal,
  Atom,
  TestTube,
  Calculator,
  Dna,
  Heart,
  Globe,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const BOTTOM_NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'progress', icon: BarChart2, label: 'Progress' },
  { id: 'community', icon: Users, label: 'Community', active: true },
  { id: 'profile', icon: User, label: 'Profile' },
];

const FILTER_CHIPS = [
  'All', 'Physics', 'Chemistry', 'Math', 'Biology', 'Class 11', 'Class 12'
];

const NOTES = [
  {
    id: 1,
    subject: 'Physics',
    subjectColor: 'text-blue-400',
    subjectBg: 'bg-blue-400/10',
    icon: Atom,
    classLevel: 'Class 12',
    timeAgo: '2h ago',
    title: 'Electric Charges and Fields - Complete Chapter Summary (BSEB)',
    preview: 'Coulomb\'s law, electric field lines, aur Gauss\'s law ke detailed notes Hindi aur English mein. Saare important derivations include kiye gaye hain...',
    author: '@rahul_kumar',
    likes: 124,
  },
  {
    id: 2,
    subject: 'Chemistry',
    subjectColor: 'text-emerald-400',
    subjectBg: 'bg-emerald-400/10',
    icon: TestTube,
    classLevel: 'Class 12',
    timeAgo: '5h ago',
    title: 'Electrochemistry Important Formulas & Short Tricks',
    preview: 'Nernst equation aur Kohlrausch\'s law ke numericals solve karne ki short tricks. Board exams ke previous year questions ke solutions ke saath.',
    author: '@priya_singh',
    likes: 89,
  },
  {
    id: 3,
    subject: 'Math',
    subjectColor: 'text-rose-400',
    subjectBg: 'bg-rose-400/10',
    icon: Calculator,
    classLevel: 'Class 11',
    timeAgo: '1d ago',
    title: 'Trigonometric Functions - Quick Revision Sheet',
    preview: 'Sabhi important trigonometric identities aur formulas ek jagah par. Graph transformations aur principal values ke examples.',
    author: '@amit_maths',
    likes: 256,
  },
  {
    id: 4,
    subject: 'Biology',
    subjectColor: 'text-amber-400',
    subjectBg: 'bg-amber-400/10',
    icon: Dna,
    classLevel: 'Class 12',
    timeAgo: '2d ago',
    title: 'Molecular Basis of Inheritance - NCERT Highlights',
    preview: 'DNA structure, replication, aur transcription process ke easy-to-understand diagrams aur points. Neet level concepts bhi covered hain.',
    author: '@neha_bio',
    likes: 312,
  }
];

export default function PublicNotesPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="w-[390px] h-[844px] bg-[#121a12] text-white flex flex-col relative overflow-hidden font-sans border border-[#253D2C]">
      
      {/* Top Header */}
      <header className="h-[56px] flex items-center justify-between px-4 bg-[#121a12] border-b border-[#253D2C] shrink-0 z-10 relative">
        <button className="p-2 -ml-2 text-[#9ca3af] hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-semibold text-lg absolute left-1/2 -translate-x-1/2">Community Notes</h1>
        <button className="p-2 -mr-2 text-[#9ca3af] hover:text-white transition-colors">
          <SlidersHorizontal size={22} />
        </button>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-[80px]"> {/* Extra padding for bottom nav */}
        
        {/* Filter Chips */}
        <div className="px-4 py-3 overflow-x-auto hide-scrollbar flex items-center gap-2 shrink-0">
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                activeFilter === chip
                  ? 'bg-[#2E6F40] border-[#2E6F40] text-white'
                  : 'bg-transparent border-[#253D2C] text-[#9ca3af] hover:bg-[#1a2619]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="px-4 space-y-4 pb-6">
          {/* Your Shared Notes Banner */}
          <div className="bg-[#2E6F40]/10 border border-[#2E6F40]/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2E6F40]/20 flex items-center justify-center text-[#4CBB17]">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Tumhare 2 notes public hain</p>
                <p className="text-xs text-[#9ca3af] mt-0.5">Helping the community!</p>
              </div>
            </div>
            <button className="text-sm font-medium text-[#4CBB17] hover:text-white transition-colors">
              Manage
            </button>
          </div>

          {/* Notes Feed */}
          <div className="space-y-4">
            {NOTES.map((note) => {
              const Icon = note.icon;
              return (
                <div key={note.id} className="bg-[#1a2619] border border-[#253D2C] rounded-2xl p-4 flex flex-col gap-3">
                  
                  {/* Top Row: Subject, Badges, Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md ${note.subjectBg} flex items-center justify-center`}>
                        <Icon size={14} className={note.subjectColor} />
                      </div>
                      <span className="text-xs font-medium text-[#9ca3af]">
                        {note.subject} <span className="text-[#6b7280]">·</span> {note.classLevel}
                      </span>
                    </div>
                    <span className="text-xs text-[#6b7280]">{note.timeAgo}</span>
                  </div>

                  {/* Title & Preview */}
                  <div>
                    <h3 className="font-semibold text-white leading-snug line-clamp-2 mb-1.5">
                      {note.title}
                    </h3>
                    <p className="text-sm text-[#9ca3af] line-clamp-2 leading-relaxed">
                      {note.preview}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-[#253D2C]/50 my-1"></div>

                  {/* Bottom Row: Author, Likes, Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Author */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#253D2C] flex items-center justify-center text-[10px] font-bold text-white">
                          {note.author.charAt(1).toUpperCase()}
                        </div>
                        <span className="text-xs text-[#9ca3af] font-medium">{note.author}</span>
                      </div>
                      
                      {/* Likes */}
                      <div className="flex items-center gap-1.5 text-[#6b7280]">
                        <Heart size={14} />
                        <span className="text-xs">{note.likes}</span>
                      </div>
                    </div>

                    {/* View Link */}
                    <button className="flex items-center gap-1 text-xs font-semibold text-[#4CBB17] hover:text-[#5ce01c] transition-colors">
                      View Notes <ChevronRight size={14} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Loading Indicator / End of feed */}
          <div className="py-6 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[#2E6F40] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-[#6b7280]">Loading more notes...</p>
          </div>

        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 h-[64px] bg-[#1a2619] border-t border-[#253D2C] px-6 flex items-center justify-between pb-safe z-20">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          return (
            <button
              key={item.id}
              className="flex flex-col items-center justify-center gap-1 w-16 relative h-full"
            >
              {isActive && (
                <div className="absolute top-1 w-1 h-1 rounded-full bg-[#4CBB17]" />
              )}
              <Icon 
                size={22} 
                className={`mt-1 ${isActive ? 'text-[#4CBB17]' : 'text-[#6b7280]'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-[#4CBB17]' : 'text-[#6b7280]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Global hide scrollbar styles if not in _group.css */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
