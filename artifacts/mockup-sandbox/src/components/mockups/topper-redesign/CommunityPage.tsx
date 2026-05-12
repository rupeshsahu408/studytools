import './_group.css';
import React, { useState } from 'react';
import { 
  Bell, 
  Home, 
  BarChart2, 
  Users, 
  User,
  Search,
  Check,
  X,
  UserPlus
} from 'lucide-react';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('friends');
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-black/80 p-4 font-sans">
      <div 
        className="relative overflow-hidden shadow-2xl"
        style={{ 
          width: '390px', 
          height: '844px', 
          backgroundColor: '#121a12',
          borderRadius: '40px',
          border: '8px solid #000'
        }}
      >
        {/* Top Header */}
        <header className="absolute top-0 left-0 right-0 h-[56px] bg-[#121a12] border-b border-[#253D2C] flex items-center justify-between px-4 z-20">
          <h1 className="text-white text-lg font-semibold">Community</h1>
          <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#1a2619] transition-colors">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-[#121a12]">
              3
            </span>
          </button>
        </header>

        {/* Sub-tabs */}
        <div className="absolute top-[56px] left-0 right-0 bg-[#121a12] z-10 border-b border-[#253D2C]">
          <div className="flex px-4">
            {['friends', 'public notes', 'discussions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-medium capitalize transition-colors relative ${
                  activeTab === tab ? 'text-white' : 'text-[#9ca3af]'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2E6F40] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <main className="absolute top-[114px] bottom-[64px] left-0 right-0 overflow-y-auto no-scrollbar pb-20">
          {activeTab === 'friends' && (
            <div className="p-4 space-y-6">
              {/* Requests Section */}
              <section className="space-y-3">
                <h2 className="text-[#9ca3af] text-sm font-medium px-1">Requests (2)</h2>
                
                <div className="bg-[#1a2619] rounded-2xl border border-[#253D2C] p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2E6F40] to-[#4CBB17] flex items-center justify-center text-white font-bold">
                        P
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Priya Sharma</p>
                        <p className="text-[#9ca3af] text-xs">@priya_sci</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-[#2E6F40] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#2E6F40]/90 transition-colors">
                      Accept
                    </button>
                    <button className="flex-1 bg-transparent border border-[#253D2C] text-[#9ca3af] py-2 rounded-xl text-sm font-medium hover:bg-[#253D2C]/50 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>

                <div className="bg-[#1a2619] rounded-2xl border border-[#253D2C] p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                        R
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Rahul Kumar</p>
                        <p className="text-[#9ca3af] text-xs">@rahul_phy</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-[#2E6F40] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#2E6F40]/90 transition-colors">
                      Accept
                    </button>
                    <button className="flex-1 bg-transparent border border-[#253D2C] text-[#9ca3af] py-2 rounded-xl text-sm font-medium hover:bg-[#253D2C]/50 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              </section>

              {/* Friends List */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[#9ca3af] text-sm font-medium">My Friends</h2>
                  <span className="text-[#6b7280] text-xs">45 friends</span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                  <input 
                    type="text" 
                    placeholder="Search friends..." 
                    className="w-full bg-[#1a2619] border border-[#253D2C] text-white rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-[#6b7280] focus:outline-none focus:border-[#2E6F40] transition-colors"
                  />
                </div>

                {/* Friend List Items */}
                <div className="space-y-2">
                  {[
                    { name: 'Amit Singh', handle: '@amit_topper', class: 'Class 12', city: 'Patna', coins: 1250, initial: 'A', color: 'from-orange-500 to-red-500' },
                    { name: 'Neha Kumari', handle: '@neha_maths', class: 'Class 11', city: 'Gaya', coins: 850, initial: 'N', color: 'from-purple-500 to-pink-500' },
                    { name: 'Vikash Raj', handle: '@vikash_12', class: 'Class 12', city: 'Muzaffarpur', coins: 420, initial: 'V', color: 'from-cyan-500 to-blue-500' },
                    { name: 'Anjali Verma', handle: '@anjali_v', class: 'Class 10', city: 'Bhagalpur', coins: 2100, initial: 'A', color: 'from-yellow-500 to-orange-500' }
                  ].map((friend, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#1a2619] border border-[#253D2C] rounded-2xl hover:border-[#2E6F40] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${friend.color} flex items-center justify-center text-white font-bold text-lg shadow-inner`}>
                          {friend.initial}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm group-hover:text-[#4CBB17] transition-colors">{friend.name}</p>
                          <p className="text-[#6b7280] text-xs mt-0.5">{friend.class} • {friend.city}</p>
                          <button className="text-[#2E6F40] text-xs font-medium mt-1 hover:text-[#4CBB17] transition-colors">
                            View Profile
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 bg-[#121a12] px-2 py-1 rounded-lg border border-[#253D2C]">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="text-[#9ca3af] text-xs font-medium">{friend.coins}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'public notes' && (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-[#1a2619] rounded-2xl flex items-center justify-center border border-[#253D2C]">
                <Search className="w-8 h-8 text-[#6b7280]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Public Notes</h3>
                <p className="text-[#9ca3af] text-sm">Discover and share notes with the community.</p>
              </div>
            </div>
          )}

          {activeTab === 'discussions' && (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-[#1a2619] rounded-2xl flex items-center justify-center border border-[#253D2C]">
                <Users className="w-8 h-8 text-[#6b7280]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Discussions</h3>
                <p className="text-[#9ca3af] text-sm">Join the conversation and solve doubts.</p>
              </div>
            </div>
          )}
        </main>

        {/* FAB Button */}
        {activeTab === 'friends' && (
          <button className="absolute bottom-[80px] right-4 w-14 h-14 bg-[#2E6F40] rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(46,111,64,0.4)] hover:bg-[#4CBB17] transition-colors z-20">
            <UserPlus className="w-6 h-6" />
          </button>
        )}

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 h-[64px] bg-[#1a2619] border-t border-[#253D2C] flex items-center justify-around px-2 z-30 pb-safe">
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#6b7280] hover:text-[#9ca3af] transition-colors">
            <Home className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#6b7280] hover:text-[#9ca3af] transition-colors">
            <BarChart2 className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Progress</span>
          </button>
          
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#2E6F40] relative">
            <div className="absolute top-1.5 w-1 h-1 bg-[#2E6F40] rounded-full" />
            <Users className="w-6 h-6 mb-1 mt-1" />
            <span className="text-[10px] font-medium">Community</span>
          </button>
          
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#6b7280] hover:text-[#9ca3af] transition-colors">
            <User className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
