import { db } from "./firebase";
import {
  collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, query, where, serverTimestamp, updateDoc, arrayUnion, arrayRemove,
  onSnapshot, writeBatch, runTransaction,
} from "firebase/firestore";

// ─── Existing Types ──────────────────────────────────────────────────────────

export interface SimulationEntry {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Chapter {
  id: string;
  userId: string;
  chapterName: string;
  subject: string;
  classNum: string;
  language: string;
  text: string;
  notes: any;
  questions: any;
  createdAt: any;
  formulas?: any[];
  mindmap?: any;
  mistakes?: any[];
  flashcards?: any[];
  simulations?: SimulationEntry[];
  summary?: any;
  examPaper?: { mcq: any[]; twoMarks: any[]; fiveMarks: any[] } | null;
  notesRead?: boolean;
  questionsAttempted?: number;
  questionsWrong?: number;
  wrongQuestions?: Array<{ id: string; question: string; type: string }>;
  flashcardsDone?: boolean;
  simulationsSeen?: boolean;
  lastStudied?: any;
  shareToken?: string | null;
}

// ─── Phase 4 — User Data Types ───────────────────────────────────────────────

export interface UserProfile {
  name: string;
  class: string;
  school: string;
  district: string;
}

export interface UserData {
  profile: UserProfile;
  examDate: string | null;
  streak: {
    current: number;
    longest: number;
    lastStudyDate: string | null;
  };
  totalQuestionsAnswered: number;
  totalQuestionsWrong: number;
  badges: string[];
  dailyGoalTarget: number;
  dailyProgress: {
    date: string;
    questionsAnswered: number;
  } | null;
  // Phase 5 — Community
  role?: "student" | "teacher";
  classId?: string | null;
}

const DEFAULT_USER_DATA: UserData = {
  profile: { name: "", class: "11", school: "", district: "" },
  examDate: null,
  streak: { current: 0, longest: 0, lastStudyDate: null },
  totalQuestionsAnswered: 0,
  totalQuestionsWrong: 0,
  badges: [],
  dailyGoalTarget: 10,
  dailyProgress: null,
  role: "student",
  classId: null,
};

// ─── Existing Chapter Functions ───────────────────────────────────────────────

const CHAPTERS_COLLECTION = "chapters";
const MAX_CHAPTERS = 5;

export async function getUserChapters(userId: string): Promise<Chapter[]> {
  const q = query(
    collection(db, CHAPTERS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  const chapters = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));
  return chapters.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

// Firestore documents have a 1MB hard limit.
// Hindi Unicode text uses 3 bytes/char in UTF-8. A 300K-char Hindi chapter = 900KB alone.
// We cap stored text at 80K chars — enough for all AI features (max prompt slice is 150K,
// but the most important sections are well under 80K). Doubt Chat will use this capped text.
const FIRESTORE_TEXT_CAP = 80000;

export async function saveChapter(userId: string, chapterData: Omit<Chapter, "id" | "userId" | "createdAt">): Promise<string> {
  const existing = await getUserChapters(userId);
  if (existing.length >= MAX_CHAPTERS) {
    throw new Error(`MAX_CHAPTERS_REACHED:${MAX_CHAPTERS}`);
  }
  const ref = doc(collection(db, CHAPTERS_COLLECTION));
  await setDoc(ref, {
    ...chapterData,
    // Cap text to prevent Firestore 1MB document limit errors on large Hindi PDFs
    text: (chapterData.text || "").slice(0, FIRESTORE_TEXT_CAP),
    userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getChapter(chapterId: string): Promise<Chapter | null> {
  const ref = doc(db, CHAPTERS_COLLECTION, chapterId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Chapter;
}

export async function deleteChapter(chapterId: string): Promise<void> {
  await deleteDoc(doc(db, CHAPTERS_COLLECTION, chapterId));
}

export async function updateChapterContent(chapterId: string, notes: any, questions: any): Promise<void> {
  const ref = doc(db, CHAPTERS_COLLECTION, chapterId);
  await setDoc(ref, { notes, questions }, { merge: true });
}

export async function updateChapterSection(chapterId: string, sectionKey: string, data: any): Promise<void> {
  const ref = doc(db, CHAPTERS_COLLECTION, chapterId);
  await setDoc(ref, { [sectionKey]: data }, { merge: true });
}

// ─── Phase 4 — User Data Functions ───────────────────────────────────────────

export async function getUserData(userId: string): Promise<UserData> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ...DEFAULT_USER_DATA };
  const data = snap.data();
  return {
    ...DEFAULT_USER_DATA,
    ...data,
    profile: { ...DEFAULT_USER_DATA.profile, ...(data.profile || {}) },
    streak: { ...DEFAULT_USER_DATA.streak, ...(data.streak || {}) },
  } as UserData;
}

export async function saveUserData(userId: string, data: Partial<UserData>): Promise<void> {
  const ref = doc(db, "users", userId);
  await setDoc(ref, data, { merge: true });
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data().profile || {}) : {};
  await setDoc(ref, { profile: { ...existing, ...profile } }, { merge: true });
}

export async function updateStreakIfNeeded(userId: string): Promise<UserData["streak"] | null> {
  const today = new Date().toISOString().split("T")[0];
  const userData = await getUserData(userId);
  const { lastStudyDate, current, longest } = userData.streak;

  if (lastStudyDate === today) return null;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newCurrent = lastStudyDate === yesterdayStr ? current + 1 : 1;
  const newLongest = Math.max(longest, newCurrent);
  const newStreak = { current: newCurrent, longest: newLongest, lastStudyDate: today };

  await saveUserData(userId, { streak: newStreak });
  return newStreak;
}

export async function trackQuestionAnswerInDB(
  userId: string,
  chapterId: string,
  isWrong: boolean,
  questionData: { id: string; question: string; type: string }
): Promise<{ totalQuestionsAnswered: number; totalQuestionsWrong: number; dailyCount: number }> {
  const today = new Date().toISOString().split("T")[0];

  const chapterRef = doc(db, CHAPTERS_COLLECTION, chapterId);
  const chapterSnap = await getDoc(chapterRef);
  if (chapterSnap.exists()) {
    const d = chapterSnap.data();
    const wrongQuestions = isWrong
      ? [...(d.wrongQuestions || []).slice(-49), questionData]
      : (d.wrongQuestions || []);
    await setDoc(chapterRef, {
      questionsAttempted: (d.questionsAttempted || 0) + 1,
      questionsWrong: (d.questionsWrong || 0) + (isWrong ? 1 : 0),
      wrongQuestions,
      lastStudied: serverTimestamp(),
    }, { merge: true });
  }

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const ud = userSnap.exists() ? userSnap.data() : {};

  const totalAnswered = (ud.totalQuestionsAnswered || 0) + 1;
  const totalWrong = (ud.totalQuestionsWrong || 0) + (isWrong ? 1 : 0);
  const prevDaily = ud.dailyProgress;
  const todayCount = (prevDaily?.date === today ? prevDaily.questionsAnswered : 0) + 1;

  await setDoc(userRef, {
    totalQuestionsAnswered: totalAnswered,
    totalQuestionsWrong: totalWrong,
    dailyProgress: { date: today, questionsAnswered: todayCount },
  }, { merge: true });

  return { totalQuestionsAnswered: totalAnswered, totalQuestionsWrong: totalWrong, dailyCount: todayCount };
}

export async function markChapterActivityInDB(
  chapterId: string,
  activity: "notesRead" | "flashcardsDone" | "simulationsSeen"
): Promise<void> {
  const ref = doc(db, CHAPTERS_COLLECTION, chapterId);
  await setDoc(ref, { [activity]: true, lastStudied: serverTimestamp() }, { merge: true });
}

export async function addBadgeToUser(userId: string, badgeId: string): Promise<void> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...DEFAULT_USER_DATA, badges: [badgeId] });
  } else {
    await updateDoc(ref, { badges: arrayUnion(badgeId) });
  }
}

// ─── Phase 5 — Community Types ────────────────────────────────────────────────

export interface ClassRoom {
  id: string;
  teacherId: string;
  teacherName: string;
  className: string;
  school: string;
  inviteCode: string;
  createdAt: any;
}

export interface ClassMember {
  uid: string;
  displayName: string;
  school: string;
  district: string;
  class: string;
  questionsAnswered: number;
  streak: number;
  accuracy: number;
  joinedAt: any;
}

export interface SharedChapter {
  id: string;
  chapterId: string;
  sharedBy: string;
  sharedByName: string;
  chapterName: string;
  subject: string;
  classNum: string;
  language: string;
  sharedAt: any;
}

export interface DiscussionPost {
  id: string;
  uid: string;
  userName: string;
  text: string;
  upvotes: string[];
  replyCount: number;
  createdAt: any;
}

export interface DiscussionReply {
  id: string;
  uid: string;
  userName: string;
  text: string;
  isAI: boolean;
  upvotes: string[];
  createdAt: any;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  school: string;
  district: string;
  class: string;
  questionsThisWeek: number;
  streak: number;
  accuracy: number;
  updatedAt: any;
}

// ─── Phase 5 — Helpers ───────────────────────────────────────────────────────

export function getWeekKey(offsetWeeks = 0): string {
  const now = new Date();
  now.setDate(now.getDate() - offsetWeeks * 7);
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Phase 5 — Class Functions ───────────────────────────────────────────────

export async function createClass(
  teacherId: string, teacherName: string, className: string, school: string
): Promise<{ classId: string; inviteCode: string }> {
  const inviteCode = generateInviteCode();
  const ref = doc(collection(db, "classes"));
  await setDoc(ref, {
    teacherId,
    teacherName,
    className,
    school,
    inviteCode,
    createdAt: serverTimestamp(),
  });
  // Auto-add teacher as member
  await setDoc(doc(db, "classes", ref.id, "members", teacherId), {
    uid: teacherId,
    displayName: teacherName || "Teacher",
    school: school || "",
    district: "",
    class: "teacher",
    questionsAnswered: 0,
    streak: 0,
    accuracy: 0,
    joinedAt: serverTimestamp(),
  });
  await saveUserData(teacherId, { role: "teacher", classId: ref.id });
  return { classId: ref.id, inviteCode };
}

export async function getClassByInviteCode(inviteCode: string): Promise<ClassRoom | null> {
  const q = query(collection(db, "classes"), where("inviteCode", "==", inviteCode.toUpperCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as ClassRoom;
}

export async function getClassById(classId: string): Promise<ClassRoom | null> {
  const snap = await getDoc(doc(db, "classes", classId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ClassRoom;
}

export async function joinClass(
  classId: string, uid: string, displayName: string,
  school: string, district: string, classNum: string
): Promise<void> {
  await setDoc(doc(db, "classes", classId, "members", uid), {
    uid,
    displayName: displayName || "Student",
    school: school || "",
    district: district || "",
    class: classNum || "11",
    questionsAnswered: 0,
    streak: 0,
    accuracy: 0,
    joinedAt: serverTimestamp(),
  });
  await saveUserData(uid, { classId });
}

export async function leaveClass(classId: string, uid: string): Promise<void> {
  await deleteDoc(doc(db, "classes", classId, "members", uid));
  const ref = doc(db, "users", uid);
  await setDoc(ref, { classId: null }, { merge: true });
}

export async function getClassMembers(classId: string): Promise<ClassMember[]> {
  const snap = await getDocs(collection(db, "classes", classId, "members"));
  const members = snap.docs.map(d => d.data() as ClassMember);
  return members
    .filter(m => m.class !== "teacher")
    .sort((a, b) => (b.questionsAnswered || 0) - (a.questionsAnswered || 0));
}

export async function updateClassMemberStats(
  classId: string, uid: string,
  stats: { displayName: string; questionsAnswered: number; streak: number; accuracy: number }
): Promise<void> {
  const ref = doc(db, "classes", classId, "members", uid);
  await setDoc(ref, stats, { merge: true });
}

// ─── Phase 5 — Shared Chapters ───────────────────────────────────────────────

export async function shareChapterToClass(
  classId: string, chapterId: string, sharedBy: string, sharedByName: string,
  chapterName: string, subject: string, classNum: string, language: string
): Promise<void> {
  await setDoc(doc(db, "classes", classId, "shared", chapterId), {
    chapterId,
    sharedBy,
    sharedByName: sharedByName || "Student",
    chapterName,
    subject,
    classNum,
    language,
    sharedAt: serverTimestamp(),
  });
}

export async function removeSharedChapter(classId: string, chapterId: string): Promise<void> {
  await deleteDoc(doc(db, "classes", classId, "shared", chapterId));
}

export async function getSharedChapters(classId: string): Promise<SharedChapter[]> {
  const snap = await getDocs(collection(db, "classes", classId, "shared"));
  const chapters = snap.docs.map(d => ({ id: d.id, ...d.data() } as SharedChapter));
  return chapters.sort((a, b) => {
    const aTime = a.sharedAt?.toMillis?.() ?? 0;
    const bTime = b.sharedAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

// ─── Phase 5 — Leaderboard ───────────────────────────────────────────────────

export async function updateLeaderboardEntry(
  uid: string, displayName: string, school: string, district: string,
  classNum: string, totalAnswered: number, totalWrong: number, streak: number
): Promise<void> {
  const weekKey = getWeekKey();
  const ref = doc(db, "leaderboard", weekKey, "entries", uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : {};
  const questionsThisWeek = (existing.questionsThisWeek || 0) + 1;
  const accuracy = totalAnswered > 0
    ? Math.round(((totalAnswered - totalWrong) / totalAnswered) * 100)
    : 0;
  await setDoc(ref, {
    uid,
    displayName: displayName || "Student",
    school: school || "",
    district: district || "",
    class: classNum || "11",
    questionsThisWeek,
    streak,
    accuracy,
    updatedAt: serverTimestamp(),
  });
}

export async function getLeaderboard(weekKey?: string): Promise<LeaderboardEntry[]> {
  const wk = weekKey || getWeekKey();
  const snap = await getDocs(collection(db, "leaderboard", wk, "entries"));
  const entries = snap.docs.map(d => d.data() as LeaderboardEntry);
  return entries.sort((a, b) => {
    if (b.questionsThisWeek !== a.questionsThisWeek) return b.questionsThisWeek - a.questionsThisWeek;
    return b.streak - a.streak;
  });
}

// ─── Push Subscriptions ───────────────────────────────────────────────────────

export async function savePushSubscription(
  uid: string,
  subscription: PushSubscriptionJSON
): Promise<void> {
  const ref = doc(db, "pushSubscriptions", uid);
  await setDoc(ref, { subscription, updatedAt: serverTimestamp() });
}

export async function getPushSubscription(
  uid: string
): Promise<PushSubscriptionJSON | null> {
  const ref = doc(db, "pushSubscriptions", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data().subscription as PushSubscriptionJSON;
}

// ─── Phase 5 — Discussions ───────────────────────────────────────────────────

export function subscribeDiscussionPosts(
  chapterId: string,
  callback: (posts: DiscussionPost[]) => void
): () => void {
  const q = collection(db, "discussions", chapterId, "posts");
  return onSnapshot(
    q,
    snap => {
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as DiscussionPost));
      callback(posts.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      }));
    },
    () => callback([])
  );
}

export async function addUpvotePost(chapterId: string, postId: string, uid: string): Promise<void> {
  const ref = doc(db, "discussions", chapterId, "posts", postId);
  await updateDoc(ref, { upvotes: arrayUnion(uid) });
}

export async function removeUpvotePost(chapterId: string, postId: string, uid: string): Promise<void> {
  const ref = doc(db, "discussions", chapterId, "posts", postId);
  await updateDoc(ref, { upvotes: arrayRemove(uid) });
}

export async function addUpvoteReply(
  chapterId: string, postId: string, replyId: string, uid: string
): Promise<void> {
  const ref = doc(db, "discussions", chapterId, "posts", postId, "replies", replyId);
  await updateDoc(ref, { upvotes: arrayUnion(uid) });
}

export async function removeUpvoteReply(
  chapterId: string, postId: string, replyId: string, uid: string
): Promise<void> {
  const ref = doc(db, "discussions", chapterId, "posts", postId, "replies", replyId);
  await updateDoc(ref, { upvotes: arrayRemove(uid) });
}

export async function createDiscussionPost(
  chapterId: string, uid: string, userName: string, text: string
): Promise<string> {
  const ref = doc(collection(db, "discussions", chapterId, "posts"));
  await setDoc(ref, {
    uid,
    userName: userName || "Student",
    text: text.trim(),
    upvotes: [],
    replyCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getDiscussionPosts(chapterId: string): Promise<DiscussionPost[]> {
  const snap = await getDocs(collection(db, "discussions", chapterId, "posts"));
  const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as DiscussionPost));
  return posts.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

export async function toggleUpvotePost(chapterId: string, postId: string, uid: string): Promise<boolean> {
  const ref = doc(db, "discussions", chapterId, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const upvotes: string[] = snap.data().upvotes || [];
  const alreadyUpvoted = upvotes.includes(uid);
  if (alreadyUpvoted) {
    await updateDoc(ref, { upvotes: arrayRemove(uid) });
  } else {
    await updateDoc(ref, { upvotes: arrayUnion(uid) });
  }
  return !alreadyUpvoted;
}

export async function deleteDiscussionPost(chapterId: string, postId: string): Promise<void> {
  await deleteDoc(doc(db, "discussions", chapterId, "posts", postId));
}

export async function addDiscussionReply(
  chapterId: string, postId: string,
  uid: string, userName: string, text: string, isAI: boolean
): Promise<string> {
  const replyRef = doc(collection(db, "discussions", chapterId, "posts", postId, "replies"));
  await setDoc(replyRef, {
    uid,
    userName: isAI ? "AI Tutor" : (userName || "Student"),
    text: text.trim(),
    isAI,
    upvotes: [],
    createdAt: serverTimestamp(),
  });
  // Increment reply count on parent post
  const postRef = doc(db, "discussions", chapterId, "posts", postId);
  const snap = await getDoc(postRef);
  if (snap.exists()) {
    await updateDoc(postRef, { replyCount: (snap.data().replyCount || 0) + 1 });
  }
  return replyRef.id;
}

export async function toggleUpvoteReply(
  chapterId: string, postId: string, replyId: string, uid: string
): Promise<boolean> {
  const ref = doc(db, "discussions", chapterId, "posts", postId, "replies", replyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const upvotes: string[] = snap.data().upvotes || [];
  const alreadyUpvoted = upvotes.includes(uid);
  if (alreadyUpvoted) {
    await updateDoc(ref, { upvotes: arrayRemove(uid) });
  } else {
    await updateDoc(ref, { upvotes: arrayUnion(uid) });
  }
  return !alreadyUpvoted;
}

export async function getDiscussionReplies(chapterId: string, postId: string): Promise<DiscussionReply[]> {
  const snap = await getDocs(collection(db, "discussions", chapterId, "posts", postId, "replies"));
  const replies = snap.docs.map(d => ({ id: d.id, ...d.data() } as DiscussionReply));
  return replies.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });
}

// ─── Phase 5 — Notifications ─────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: "reply";
  chapterId: string;
  postId: string;
  chapterName: string;
  fromUserName: string;
  preview: string;
  read: boolean;
  createdAt: any;
}

export async function createReplyNotification(
  postAuthorUid: string,
  chapterId: string,
  postId: string,
  fromUserName: string,
  replyText: string,
  chapterName: string
): Promise<void> {
  const ref = doc(collection(db, "users", postAuthorUid, "notifications"));
  await setDoc(ref, {
    type: "reply",
    chapterId,
    postId,
    chapterName: chapterName || "a chapter",
    fromUserName: fromUserName || "Someone",
    preview: replyText.slice(0, 100),
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function getNotifications(uid: string, maxCount = 30): Promise<NotificationItem[]> {
  const snap = await getDocs(collection(db, "users", uid, "notifications"));
  const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationItem));
  return notifs
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    })
    .slice(0, maxCount);
}

export async function markNotificationsRead(uid: string): Promise<void> {
  const q = query(
    collection(db, "users", uid, "notifications"),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export function onNotificationsSnapshot(
  uid: string,
  callback: (unreadCount: number) => void
): () => void {
  const q = query(
    collection(db, "users", uid, "notifications"),
    where("read", "==", false)
  );
  return onSnapshot(q, snap => callback(snap.docs.length), () => callback(0));
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export type FeedbackReason = "garbled_hindi" | "wrong_answer" | "incomplete" | "other";

export interface FeedbackEntry {
  userId: string;
  chapterId: string;
  chapterName: string;
  subject: string;
  type: "flashcard" | "question";
  itemId: string;
  itemFront: string;
  itemBack: string;
  reason: FeedbackReason;
  note: string;
  createdAt: any;
}

export async function submitFeedback(entry: Omit<FeedbackEntry, "createdAt">): Promise<void> {
  const ref = doc(collection(db, "feedback"));
  await setDoc(ref, { ...entry, createdAt: serverTimestamp() });
}

// ─── Chat Session Types ───────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  chapterId: string;
  chapterName: string;
  subject: string;
  title: string;
  isPinned: boolean;
  messages: ChatMessage[];
  createdAt: any;
  updatedAt: any;
}

const CHAT_SESSIONS = "chatSessions";
const MAX_MESSAGES = 100;

// Sort helper: pinned first, then by updatedAt desc
function sortSessions(sessions: ChatSession[]): ChatSession[] {
  return sessions.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const at = a.updatedAt?.toMillis?.() ?? 0;
    const bt = b.updatedAt?.toMillis?.() ?? 0;
    return bt - at;
  });
}

// Real-time subscription — returns unsubscribe function
export function subscribeChatSessions(
  userId: string,
  chapterId: string,
  callback: (sessions: ChatSession[]) => void
): () => void {
  const q = query(
    collection(db, CHAT_SESSIONS),
    where("userId", "==", userId),
    where("chapterId", "==", chapterId)
  );
  return onSnapshot(q, snap => {
    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
    callback(sortSessions(sessions));
  });
}

// Create a new session (lazy — only called when first message is sent)
export async function createChatSession(
  userId: string,
  chapterId: string,
  chapterName: string,
  subject: string,
  title: string
): Promise<string> {
  const ref = doc(collection(db, CHAT_SESSIONS));
  await setDoc(ref, {
    userId, chapterId, chapterName, subject,
    title, isPinned: false, messages: [],
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Save/update messages (and optionally title) for a session
export async function saveChatMessages(
  sessionId: string,
  messages: ChatMessage[],
  title?: string
): Promise<void> {
  const ref = doc(db, CHAT_SESSIONS, sessionId);
  const payload: any = {
    messages: messages.slice(-MAX_MESSAGES),
    updatedAt: serverTimestamp(),
  };
  if (title !== undefined) payload.title = title;
  await setDoc(ref, payload, { merge: true });
}

export async function renameChatSession(sessionId: string, title: string): Promise<void> {
  await setDoc(doc(db, CHAT_SESSIONS, sessionId), { title, updatedAt: serverTimestamp() }, { merge: true });
}

export async function toggleChatPin(sessionId: string, isPinned: boolean): Promise<void> {
  await setDoc(doc(db, CHAT_SESSIONS, sessionId), { isPinned }, { merge: true });
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, CHAT_SESSIONS, sessionId));
}

// ─── Share Links ──────────────────────────────────────────────────────────────

function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 20; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

export interface SharedChapterPublic {
  token: string;
  chapterId: string;
  userId: string;
  chapterName: string;
  subject: string;
  classNum: string;
  language: string;
  notes: any;
  sharedByName: string;
  sharedAt: any;
  views: number;
}

export async function createShareLink(
  chapterId: string,
  userId: string,
  chapter: {
    chapterName: string;
    subject: string;
    classNum: string;
    language: string;
    notes: any;
    sharedByName: string;
  }
): Promise<string> {
  const token = generateShareToken();
  await setDoc(doc(db, "shares", token), {
    token,
    chapterId,
    userId,
    chapterName: chapter.chapterName,
    subject: chapter.subject,
    classNum: chapter.classNum,
    language: chapter.language || "english",
    notes: chapter.notes,
    sharedByName: chapter.sharedByName || "A student",
    sharedAt: serverTimestamp(),
    views: 0,
  });
  await setDoc(doc(db, CHAPTERS_COLLECTION, chapterId), { shareToken: token }, { merge: true });
  return token;
}

export async function revokeShareLink(chapterId: string, token: string): Promise<void> {
  await deleteDoc(doc(db, "shares", token));
  await setDoc(doc(db, CHAPTERS_COLLECTION, chapterId), { shareToken: null }, { merge: true });
}

export async function getSharedChapter(token: string): Promise<SharedChapterPublic | null> {
  const snap = await getDoc(doc(db, "shares", token));
  if (!snap.exists()) return null;
  return { token, ...snap.data() } as SharedChapterPublic;
}

export async function incrementShareViews(token: string): Promise<void> {
  const ref = doc(db, "shares", token);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { views: (snap.data().views || 0) + 1 });
  }
}

// ─── Social Profile ───────────────────────────────────────────────────────────

export interface SocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  reddit?: string;
}

export interface SocialUser {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  photoURL: string | null;
  friends: string[];
  friendRequestsSent: string[];
  friendRequestsReceived: string[];
  streak?: number;
  badges?: string[];
  role?: string;
  class?: string;
  school?: string;
  district?: string;
  socialLinks?: SocialLinks;
  isAnonymous?: boolean;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const ref = doc(db, "usernames", username.toLowerCase());
  const snap = await getDoc(ref);
  return !snap.exists();
}

export async function setupUserProfile(
  uid: string,
  data: { username: string; bio?: string; photoURL?: string | null }
): Promise<void> {
  const username = data.username.toLowerCase().trim();
  const usernameRef = doc(db, "usernames", username);
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (transaction) => {
    const usernameSnap = await transaction.get(usernameRef);
    if (usernameSnap.exists()) {
      throw new Error("Username is already taken.");
    }
    transaction.set(usernameRef, { uid, createdAt: serverTimestamp() });
    transaction.set(userRef, {
      username,
      bio: data.bio?.trim() || "",
      photoURL: data.photoURL || null,
      friends: [],
      friendRequestsSent: [],
      friendRequestsReceived: [],
    }, { merge: true });
  });
}

export async function getUserById(uid: string): Promise<SocialUser | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    username: data.username || "",
    displayName: data.profile?.name || data.username || "Student",
    bio: data.bio || "",
    photoURL: data.photoURL || null,
    friends: data.friends || [],
    friendRequestsSent: data.friendRequestsSent || [],
    friendRequestsReceived: data.friendRequestsReceived || [],
    streak: data.streak?.current || 0,
    badges: data.badges || [],
    role: data.role || "student",
    class: data.profile?.class || "",
    school: data.profile?.school || "",
    district: data.profile?.district || "",
    socialLinks: data.socialLinks || {},
    isAnonymous: data.isAnonymous || false,
  };
}

export async function getUserByUsername(username: string): Promise<SocialUser | null> {
  const snap = await getDoc(doc(db, "usernames", username.toLowerCase()));
  if (!snap.exists()) return null;
  return getUserById(snap.data().uid);
}

export async function updateSocialProfile(
  uid: string,
  data: {
    bio?: string;
    photoURL?: string | null;
    socialLinks?: SocialLinks;
    isAnonymous?: boolean;
  }
): Promise<void> {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}

export function subscribeToSocialUser(
  uid: string,
  callback: (user: SocialUser | null) => void
): () => void {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (!snap.exists()) { callback(null); return; }
    const data = snap.data();
    callback({
      uid,
      username: data.username || "",
      displayName: data.profile?.name || data.username || "Student",
      bio: data.bio || "",
      photoURL: data.photoURL || null,
      friends: data.friends || [],
      friendRequestsSent: data.friendRequestsSent || [],
      friendRequestsReceived: data.friendRequestsReceived || [],
      streak: data.streak?.current || 0,
      badges: data.badges || [],
      role: data.role || "student",
      class: data.profile?.class || "",
      school: data.profile?.school || "",
      district: data.profile?.district || "",
      socialLinks: data.socialLinks || {},
      isAnonymous: data.isAnonymous || false,
    });
  });
}

export async function sendFriendRequest(fromUid: string, toUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", fromUid), { friendRequestsSent: arrayUnion(toUid) }, { merge: true });
  batch.set(doc(db, "users", toUid), { friendRequestsReceived: arrayUnion(fromUid) }, { merge: true });
  await batch.commit();
}

export async function cancelFriendRequest(fromUid: string, toUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", fromUid), { friendRequestsSent: arrayRemove(toUid) }, { merge: true });
  batch.set(doc(db, "users", toUid), { friendRequestsReceived: arrayRemove(fromUid) }, { merge: true });
  await batch.commit();
}

export async function acceptFriendRequest(uid: string, fromUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), {
    friends: arrayUnion(fromUid),
    friendRequestsReceived: arrayRemove(fromUid),
  }, { merge: true });
  batch.set(doc(db, "users", fromUid), {
    friends: arrayUnion(uid),
    friendRequestsSent: arrayRemove(uid),
  }, { merge: true });
  await batch.commit();
}

export async function declineFriendRequest(uid: string, fromUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), { friendRequestsReceived: arrayRemove(fromUid) }, { merge: true });
  batch.set(doc(db, "users", fromUid), { friendRequestsSent: arrayRemove(uid) }, { merge: true });
  await batch.commit();
}

export async function removeFriend(uid: string, friendUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), { friends: arrayRemove(friendUid) }, { merge: true });
  batch.set(doc(db, "users", friendUid), { friends: arrayRemove(uid) }, { merge: true });
  await batch.commit();
}

export async function getFriends(uid: string): Promise<SocialUser[]> {
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return [];
  const friendUids: string[] = userSnap.data().friends || [];
  if (friendUids.length === 0) return [];
  const results = await Promise.all(friendUids.map(fuid => getUserById(fuid)));
  return results.filter(Boolean) as SocialUser[];
}

export async function getFriendRequests(uid: string): Promise<SocialUser[]> {
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return [];
  const requestUids: string[] = userSnap.data().friendRequestsReceived || [];
  if (requestUids.length === 0) return [];
  const results = await Promise.all(requestUids.map(ruid => getUserById(ruid)));
  return results.filter(Boolean) as SocialUser[];
}

export async function getSentRequests(uid: string): Promise<SocialUser[]> {
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return [];
  const sentUids: string[] = userSnap.data().friendRequestsSent || [];
  if (sentUids.length === 0) return [];
  const results = await Promise.all(sentUids.map(suid => getUserById(suid)));
  return results.filter(Boolean) as SocialUser[];
}

export async function searchUsersByUsername(query: string): Promise<SocialUser[]> {
  if (!query || query.length < 2) return [];
  const snap = await getDoc(doc(db, "usernames", query.toLowerCase()));
  if (!snap.exists()) return [];
  const user = await getUserById(snap.data().uid);
  if (!user || user.isAnonymous) return [];
  return [user];
}
