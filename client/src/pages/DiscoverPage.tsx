import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Compass, Search, Loader2, UserPlus, UserCheck, UserMinus,
  Users, AtSign, Clock, Bell, UserX,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import {
  subscribeToSocialUser,
  searchUsersByUsername,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  getSentRequests,
  type SocialUser,
} from "../lib/firestore";

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-teal-500 to-cyan-600",
  "from-green-500 to-emerald-600",
  "from-fuchsia-500 to-pink-600",
  "from-sky-500 to-blue-600",
];

function getGradient(uid: string) {
  const idx = Math.abs(uid.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function Avatar({ user, size = "md" }: { user: SocialUser; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "w-14 h-14" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (user.photoURL) {
    return <img src={user.photoURL} alt={user.displayName} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${getGradient(user.uid)} flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold text-xs">{getInitials(user.displayName)}</span>
    </div>
  );
}

type Tab = "search" | "requests" | "friends";

export default function DiscoverPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("search");

  const [myProfile, setMyProfile] = useState<SocialUser | null>(null);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [requests, setRequests] = useState<SocialUser[]>([]);
  const [sentRequests, setSentRequests] = useState<SocialUser[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SocialUser | null | "none">(null);

  const [actionUid, setActionUid] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToSocialUser(user.uid, (su) => {
      setMyProfile(su);
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    setLoadingLists(true);
    Promise.all([
      getFriends(user.uid),
      getFriendRequests(user.uid),
      getSentRequests(user.uid),
    ]).then(([f, r, s]) => {
      setFriends(f);
      setRequests(r);
      setSentRequests(s);
      setLoadingLists(false);
    }).catch(() => setLoadingLists(false));
  }, [
    user?.uid,
    myProfile?.friends?.length,
    myProfile?.friendRequestsReceived?.length,
    myProfile?.friendRequestsSent?.length,
  ]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    try {
      const results = await searchUsersByUsername(query.trim().toLowerCase().replace(/^@/, ""));
      setResult(results.length > 0 ? results[0] : "none");
    } catch {
      setResult("none");
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async (toUid: string) => {
    if (!user?.uid) return;
    setActionUid(toUid);
    try { await sendFriendRequest(user.uid, toUid); }
    catch (e) { console.error(e); }
    finally { setActionUid(null); }
  };

  const handleCancel = async (toUid: string) => {
    if (!user?.uid) return;
    setActionUid(toUid);
    try { await cancelFriendRequest(user.uid, toUid); setResult(null); }
    catch (e) { console.error(e); }
    finally { setActionUid(null); }
  };

  const handleAccept = async (fromUid: string) => {
    if (!user?.uid) return;
    setActionUid(fromUid);
    try { await acceptFriendRequest(user.uid, fromUid); }
    catch (e) { console.error(e); }
    finally { setActionUid(null); }
  };

  const handleDecline = async (fromUid: string) => {
    if (!user?.uid) return;
    setActionUid(fromUid);
    try { await declineFriendRequest(user.uid, fromUid); }
    catch (e) { console.error(e); }
    finally { setActionUid(null); }
  };

  const handleRemove = async (friendUid: string) => {
    if (!user?.uid) return;
    if (!confirm("Remove this friend?")) return;
    setActionUid(friendUid);
    try { await removeFriend(user.uid, friendUid); }
    catch (e) { console.error(e); }
    finally { setActionUid(null); }
  };

  const getRelation = (uid: string) => {
    if (uid === user?.uid) return "self";
    if (myProfile?.friends.includes(uid)) return "friends";
    if (myProfile?.friendRequestsSent.includes(uid)) return "sent";
    if (myProfile?.friendRequestsReceived.includes(uid)) return "received";
    return "none";
  };

  const totalRequests = requests.length + sentRequests.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-14">
        <div className="max-w-2xl mx-auto px-4 py-8">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Compass className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">Discover</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Find and connect with fellow students</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-1 mb-6 gap-1">
            {([
              { key: "search" as Tab, label: "Search", icon: <Search className="w-3.5 h-3.5" /> },
              { key: "requests" as Tab, label: "Requests", badge: totalRequests > 0 ? totalRequests : null, icon: <Bell className="w-3.5 h-3.5" /> },
              { key: "friends" as Tab, label: "Friends", badge: friends.length > 0 ? friends.length : null, icon: <Users className="w-3.5 h-3.5" /> },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  tab === t.key
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {t.icon}
                {t.label}
                {t.badge !== null && t.badge !== undefined && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    tab === t.key ? "bg-white/30 text-white" : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Search Tab ── */}
          {tab === "search" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Search by @username</p>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-green-400 dark:focus-within:border-green-600 transition-colors mb-4">
                <AtSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setResult(null); }}
                  onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                  placeholder="Enter username…"
                  autoFocus
                  className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={!query.trim() || searching}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Search
                </button>
              </div>

              {searching && (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Searching…</span>
                </div>
              )}

              {result === "none" && !searching && (
                <div className="text-center py-8">
                  <UserX className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No user found for "{query}"</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Check the spelling and try again.</p>
                </div>
              )}

              {result && result !== "none" && !searching && (() => {
                const relation = getRelation(result.uid);
                return (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <Link to={`/u/${result.username}`} className="flex-shrink-0">
                      <Avatar user={result} size="lg" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/u/${result.username}`} className="text-sm font-bold text-gray-900 dark:text-white hover:underline block truncate">
                        {result.displayName}
                      </Link>
                      <p className="text-xs text-green-600 dark:text-green-400">@{result.username}</p>
                      {result.bio && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{result.bio}</p>}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {(result.streak || 0) > 0 && <span>🔥 {result.streak}</span>}
                        {(result.badges?.length || 0) > 0 && <span>🏅 {result.badges!.length}</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {relation === "self" ? (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1.5 rounded-lg">You</span>
                      ) : relation === "friends" ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 rounded-lg">
                          <UserCheck className="w-3.5 h-3.5" /> Friends
                        </span>
                      ) : relation === "sent" ? (
                        <button
                          onClick={() => handleCancel(result.uid)}
                          disabled={actionUid === result.uid}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          {actionUid === result.uid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                          Sent
                        </button>
                      ) : relation === "received" ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleAccept(result.uid)} disabled={actionUid === result.uid}
                            className="text-xs font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                            {actionUid === result.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />} Accept
                          </button>
                          <button onClick={() => handleDecline(result.uid)} disabled={actionUid === result.uid}
                            className="text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 px-2.5 py-1.5 rounded-lg transition-colors">
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSend(result.uid)}
                          disabled={actionUid === result.uid}
                          className="flex items-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {actionUid === result.uid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                          Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {!result && !searching && (
                <div className="text-center py-8">
                  <Compass className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Search for a classmate by their @username.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Anonymous users won't appear in results.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Requests Tab ── */}
          {tab === "requests" && (
            <div className="space-y-5">
              {/* Incoming */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  Incoming Requests
                  {requests.length > 0 && (
                    <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
                      {requests.length}
                    </span>
                  )}
                </h3>
                {loadingLists ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-600">No incoming requests.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {requests.map(req => (
                      <div key={req.uid} className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl p-3">
                        <Link to={`/u/${req.username}`} className="flex-shrink-0">
                          <Avatar user={req} />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/u/${req.username}`} className="text-sm font-bold text-gray-900 dark:text-white hover:underline block truncate">
                            {req.displayName}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400">@{req.username}</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleAccept(req.uid)}
                            disabled={actionUid === req.uid}
                            className="flex items-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-xl transition-colors"
                          >
                            {actionUid === req.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(req.uid)}
                            disabled={actionUid === req.uid}
                            className="text-xs font-medium bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-xl transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Sent Requests
                  {sentRequests.length > 0 && (
                    <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold px-2 py-0.5 rounded-full">
                      {sentRequests.length}
                    </span>
                  )}
                </h3>
                {loadingLists ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
                  </div>
                ) : sentRequests.length === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-600">No pending sent requests.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sentRequests.map(req => (
                      <div key={req.uid} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                        <Link to={`/u/${req.username}`} className="flex-shrink-0">
                          <Avatar user={req} />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/u/${req.username}`} className="text-sm font-bold text-gray-900 dark:text-white hover:underline block truncate">
                            {req.displayName}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400">@{req.username}</p>
                        </div>
                        <button
                          onClick={() => handleCancel(req.uid)}
                          disabled={actionUid === req.uid}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 border border-gray-200 dark:border-gray-600 px-2.5 py-1.5 rounded-xl transition-colors"
                        >
                          {actionUid === req.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Friends Tab ── */}
          {tab === "friends" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Study Friends
                {friends.length > 0 && (
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                    {friends.length} friend{friends.length !== 1 ? "s" : ""}
                  </span>
                )}
              </h3>

              {loadingLists ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No study friends yet.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Search by username to add a classmate!</p>
                  <button
                    onClick={() => setTab("search")}
                    className="mt-4 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 px-4 py-2 rounded-xl transition-colors"
                  >
                    Find People
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {friends.map(friend => (
                    <div key={friend.uid} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                      <Link to={`/u/${friend.username}`} className="flex-shrink-0">
                        <Avatar user={friend} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/u/${friend.username}`} className="text-sm font-bold text-gray-900 dark:text-white hover:underline block truncate">
                          {friend.displayName}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{friend.username}{(friend.streak || 0) > 0 && <span className="ml-1.5">· 🔥 {friend.streak}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/u/${friend.username}`}
                          className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-lg transition-colors">
                          View
                        </Link>
                        <button
                          onClick={() => handleRemove(friend.uid)}
                          disabled={actionUid === friend.uid}
                          title="Remove friend"
                          className="p-1.5 rounded-lg text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          {actionUid === friend.uid
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                            : <UserMinus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
