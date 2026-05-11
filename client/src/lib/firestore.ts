import { db } from "./firebase";
import {
  collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, query, where, serverTimestamp, updateDoc, arrayUnion, arrayRemove,
  onSnapshot, writeBatch,
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
  // Phase 4 — Progress tracking
  notesRead?: boolean;
  questionsAttempted?: number;
  questionsWrong?: number;
  wrongQuestions?: Array<{ id: string; question: string; type: string }>;
  flashcardsDone?: boolean;
  simulationsSeen?: boolean;
  lastStudied?: any;
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

export async function saveChapter(userId: string, chapterData: Omit<Chapter, "id" | "userId" | "createdAt">): Promise<string> {
  const existing = await getUserChapters(userId);
  if (existing.length >= MAX_CHAPTERS) {
    throw new Error(`MAX_CHAPTERS_REACHED:${MAX_CHAPTERS}`);
  }
  const ref = doc(collection(db, CHAPTERS_COLLECTION));
  await setDoc(ref, {
    ...chapterData,
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

// ─── Phase 5 — Discussions ───────────────────────────────────────────────────

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
  replyText: string
): Promise<void> {
  const ref = doc(collection(db, "users", postAuthorUid, "notifications"));
  await setDoc(ref, {
    type: "reply",
    chapterId,
    postId,
    fromUserName: fromUserName || "Someone",
    preview: replyText.slice(0, 80),
    read: false,
    createdAt: serverTimestamp(),
  });
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
