import React, { useState } from 'react';
import { ArrowLeft, Search, EyeOff, UserPlus, X, Clock, SearchX } from 'lucide-react';
import './_group.css';

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showAnonymousBanner, setShowAnonymousBanner] = useState(true);

  const suggestedPeople = [
    {
      id: 1,
      name: 'Ravi Kumar',
      username: 'ravi_k',
      location: 'Class 12 · Ara, Bihar',
      stats: '47 notes · 3 friends',
      initials: 'RK',
      color: 'bg-blue-600',
      isBlocked: false,
      isFollowing: false,
    },
    {
      id: 2,
      name: 'Priya Singh',
      username: 'priya_99',
      location: 'Class 11 · Patna, Bihar',
      stats: '12 notes · 15 friends',
      initials: 'PS',
      color: 'bg-purple-600',
      isBlocked: false,
      isFollowing: true,
    },
    {
      id: 3,
      name: 'Amit Sharma',
      username: 'amit_topper',
      location: 'Class 12 · Gaya, Bihar',
      stats: '89 notes · 42 friends',
      initials: 'AS',
      color: 'bg-green-600',
      isBlocked: true,
      isFollowing: false,
    },
    {
      id: 4,
      name: 'Neha Gupta',
      username: 'neha_g',
      location: 'Class 10 · Muzaffarpur, Bihar',
      stats: '2 notes · 1 friend',
      initials: 'NG',
      color: 'bg-yellow-600',
      isBlocked: false,
      isFollowing: false,
    }
  ];

  const recentSearches = ['rahul_raj', 'science_topper', 'vikash', 'physics_lover'];

  const filteredPeople = searchQuery 
    ? suggestedPeople.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : suggestedPeople;

  return (
    <div className="w-[390px] h-[844px] bg-[#121a12] text-white overflow-hidden flex flex-col font-sans relative shadow-2xl rounded-[40px] border-[8px] border-black">
      {/* Top Header */}
      <div className="h-[56px] flex items-center px-4 border-b border-[#253D2C] shrink-0 bg-[#121a12] z-10 sticky top-0">
        <button className="p-2 -ml-2 mr-2 rounded-full hover:bg-[#1a2619] transition-colors">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold flex-1">Discover People</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        {/* Anonymous Mode Banner */}
        {showAnonymousBanner && (
          <div className="m-4 p-4 rounded-2xl bg-[#2E6F40]/20 border border-[#2E6F40]/30 relative flex gap-3 items-start">
            <button 
              onClick={() => setShowAnonymousBanner(false)}
              className="absolute top-2 right-2 p-1 text-[#9ca3af] hover:text-white rounded-full"
            >
              <X size={16} />
            </button>
            <div className="p-2 bg-[#2E6F40]/30 rounded-full shrink-0 mt-0.5">
              <EyeOff size={18} className="text-[#4CBB17]" />
            </div>
            <div className="flex-1 pr-6">
              <p className="text-sm font-medium text-white mb-1">Anonymous Mode is ON</p>
              <p className="text-xs text-[#9ca3af] mb-3">People can't see your profile when you view their notes.</p>
              <button 
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${isAnonymous ? 'bg-[#4CBB17]' : 'bg-[#253D2C]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-4 py-2 mt-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-[#9ca3af]" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-3 bg-[#1a2619] border border-[#253D2C] rounded-xl text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2E6F40] focus:ring-1 focus:ring-[#2E6F40] text-base"
              placeholder="Username ya name khojo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X size={18} className="text-[#9ca3af]" />
              </button>
            )}
          </div>
        </div>

        {/* Recent Searches (only show when no query) */}
        {!searchQuery && (
          <div className="px-4 py-4 mt-2">
            <h2 className="text-sm font-medium text-[#9ca3af] mb-3 flex items-center gap-2">
              <Clock size={16} /> Recent Searches
            </h2>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSearchQuery(search)}
                  className="px-3 py-1.5 bg-[#1a2619] border border-[#253D2C] rounded-full text-sm text-[#9ca3af] hover:text-white hover:border-[#2E6F40] transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results / Suggested */}
        <div className="px-4 pt-6 pb-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            {searchQuery ? 'Search Results' : 'Suggested for You'}
          </h2>
          
          {filteredPeople.length > 0 ? (
            <div className="space-y-3">
              {filteredPeople.map((person) => (
                <div key={person.id} className="bg-[#1a2619] border border-[#253D2C] p-3 rounded-2xl flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${person.color} flex items-center justify-center text-white font-bold shrink-0`}>
                    {person.initials}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 truncate">
                      <span className="font-bold text-white truncate">{person.name}</span>
                      <span className="text-xs text-[#9ca3af] truncate">@{person.username}</span>
                    </div>
                    <p className="text-xs text-[#9ca3af] mt-0.5 truncate">{person.location}</p>
                    <p className="text-[10px] text-[#6b7280] mt-1 truncate">{person.stats}</p>
                  </div>
                  
                  <div className="shrink-0 pl-2">
                    {person.isBlocked ? (
                      <span className="px-3 py-1.5 bg-red-900/20 text-red-500 text-xs font-medium rounded-lg border border-red-900/50">
                        Blocked
                      </span>
                    ) : person.isFollowing ? (
                      <button className="px-3 py-1.5 bg-[#253D2C] text-white text-sm font-medium rounded-xl min-w-[70px]">
                        Following
                      </button>
                    ) : (
                      <button className="px-3 py-1.5 border border-[#2E6F40] text-[#4CBB17] text-sm font-medium rounded-xl hover:bg-[#2E6F40]/10 min-w-[70px]">
                        Follow
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 bg-[#1a2619] rounded-full flex items-center justify-center mb-4 border border-[#253D2C]">
                <SearchX size={32} className="text-[#6b7280]" />
              </div>
              <p className="text-white font-medium mb-1">No results found</p>
              <p className="text-[#9ca3af] text-sm">Kisi ko dhundho, maybe try a different name?</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
