import { db } from "./firebase";
import {
  collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, query, where, serverTimestamp, updateDoc, arrayUnion,
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
};

// ─── Existing Chapter Functions ───────────────────────────────────────────────

const CHAPTERS_COLLECTION = "chapters";
const MAX_CHAPTERS = 5;

export async function getUserChapters(userId: string): Promise<Chapter[]> {
  // Only filter by userId — no orderBy — to avoid requiring a composite Firestore index.
  // With a max of 5 chapters per user, client-side sorting is perfectly fine.
  const q = query(
    collection(db, CHAPTERS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  const chapters = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));
  // Sort newest-first client-side (mirrors the previous orderBy("createdAt", "desc"))
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

// Returns the updated streak if changed, null if already updated today
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

// Track a question being answered (right or wrong)
export async function trackQuestionAnswerInDB(
  userId: string,
  chapterId: string,
  isWrong: boolean,
  questionData: { id: string; question: string; type: string }
): Promise<{ totalQuestionsAnswered: number; totalQuestionsWrong: number; dailyCount: number }> {
  const today = new Date().toISOString().split("T")[0];

  // Update chapter
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

  // Update user stats
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

// Mark a chapter section as completed
export async function markChapterActivityInDB(
  chapterId: string,
  activity: "notesRead" | "flashcardsDone" | "simulationsSeen"
): Promise<void> {
  const ref = doc(db, CHAPTERS_COLLECTION, chapterId);
  await setDoc(ref, { [activity]: true, lastStudied: serverTimestamp() }, { merge: true });
}

// Add a badge to user (idempotent — arrayUnion won't duplicate)
export async function addBadgeToUser(userId: string, badgeId: string): Promise<void> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...DEFAULT_USER_DATA, badges: [badgeId] });
  } else {
    await updateDoc(ref, { badges: arrayUnion(badgeId) });
  }
}
