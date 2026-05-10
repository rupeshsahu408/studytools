import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import {
  getUserData, saveUserData, updateStreakIfNeeded,
  trackQuestionAnswerInDB, markChapterActivityInDB,
  addBadgeToUser, getUserChapters,
  type UserData, type Chapter,
} from "../lib/firestore";

// ─── Badge Definitions ────────────────────────────────────────────────────────

export const ALL_BADGES = [
  { id: "first_chapter",  icon: "📚", title: "First Chapter",    desc: "Uploaded your first chapter" },
  { id: "first_notes",    icon: "📖", title: "Notes Reader",     desc: "Read your first chapter notes" },
  { id: "q_10",           icon: "⚡", title: "Quick Start",      desc: "Answered 10 questions" },
  { id: "q_50",           icon: "🏆", title: "Champion",         desc: "Answered 50 questions" },
  { id: "q_100",          icon: "💯", title: "Century Club",     desc: "Answered 100 questions" },
  { id: "q_250",          icon: "🔱", title: "Question Master",  desc: "Answered 250 questions" },
  { id: "streak_3",       icon: "🔥", title: "On Fire",          desc: "3-day study streak" },
  { id: "streak_7",       icon: "⚔️", title: "Weekly Warrior",   desc: "7-day study streak" },
  { id: "streak_30",      icon: "👑", title: "Monthly Master",   desc: "30-day study streak" },
  { id: "flashcard_pro",  icon: "🃏", title: "Flashcard Pro",    desc: "Completed flashcards on a chapter" },
  { id: "sim_explorer",   icon: "🔬", title: "Sim Explorer",     desc: "Launched an interactive simulation" },
  { id: "all_sections",   icon: "⭐", title: "Complete Scholar",  desc: "Used all study features on a chapter" },
] as const;

export type BadgeId = typeof ALL_BADGES[number]["id"];

// ─── Context Type ─────────────────────────────────────────────────────────────

interface ProgressContextType {
  userData: UserData | null;
  loadingUser: boolean;
  chapters: Chapter[];
  refreshUserData: () => Promise<void>;
  updateProfile: (profile: Partial<UserData["profile"]>) => Promise<void>;
  setExamDate: (date: string | null) => Promise<void>;
  setDailyGoal: (target: number) => Promise<void>;
  markNotesRead: (chapterId: string) => Promise<void>;
  trackQuestionAnswer: (
    chapterId: string,
    isWrong: boolean,
    question: { id: string; question: string; type: string }
  ) => Promise<void>;
  markFlashcardsDone: (chapterId: string) => Promise<void>;
  markSimulationSeen: (chapterId: string) => Promise<void>;
  refreshChapters: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const streakUpdatedRef = useRef(false);

  const loadAll = useCallback(async () => {
    if (!user) { setUserData(null); setLoadingUser(false); return; }
    setLoadingUser(true);
    try {
      const [ud, ch] = await Promise.all([
        getUserData(user.uid),
        getUserChapters(user.uid),
      ]);
      setUserData(ud);
      setChapters(ch);

      // Update streak once per session
      if (!streakUpdatedRef.current) {
        streakUpdatedRef.current = true;
        const newStreak = await updateStreakIfNeeded(user.uid);
        if (newStreak) {
          setUserData(prev => prev ? { ...prev, streak: newStreak } : prev);
          // Check streak badges after update
          await checkAndAwardBadges(user.uid, { ...ud, streak: newStreak }, ch);
        } else {
          await checkAndAwardBadges(user.uid, ud, ch);
        }
      }
    } catch (e) {
      console.error("ProgressContext load error:", e);
    } finally {
      setLoadingUser(false);
    }
  }, [user]);

  useEffect(() => {
    streakUpdatedRef.current = false;
    loadAll();
  }, [loadAll]);

  const checkAndAwardBadges = async (userId: string, ud: UserData, ch: Chapter[]) => {
    const earned = new Set(ud.badges || []);
    const toAward: BadgeId[] = [];

    if (ch.length >= 1 && !earned.has("first_chapter")) toAward.push("first_chapter");
    if (ch.some(c => c.notesRead) && !earned.has("first_notes")) toAward.push("first_notes");
    if ((ud.totalQuestionsAnswered || 0) >= 10 && !earned.has("q_10")) toAward.push("q_10");
    if ((ud.totalQuestionsAnswered || 0) >= 50 && !earned.has("q_50")) toAward.push("q_50");
    if ((ud.totalQuestionsAnswered || 0) >= 100 && !earned.has("q_100")) toAward.push("q_100");
    if ((ud.totalQuestionsAnswered || 0) >= 250 && !earned.has("q_250")) toAward.push("q_250");
    if ((ud.streak?.current || 0) >= 3 && !earned.has("streak_3")) toAward.push("streak_3");
    if ((ud.streak?.current || 0) >= 7 && !earned.has("streak_7")) toAward.push("streak_7");
    if ((ud.streak?.current || 0) >= 30 && !earned.has("streak_30")) toAward.push("streak_30");
    if (ch.some(c => c.flashcardsDone) && !earned.has("flashcard_pro")) toAward.push("flashcard_pro");
    if (ch.some(c => c.simulationsSeen) && !earned.has("sim_explorer")) toAward.push("sim_explorer");
    if (ch.some(c => c.notesRead && (c.questionsAttempted || 0) > 0 && c.flashcardsDone) && !earned.has("all_sections")) toAward.push("all_sections");

    for (const badge of toAward) {
      await addBadgeToUser(userId, badge);
    }
    if (toAward.length > 0) {
      setUserData(prev => prev ? { ...prev, badges: [...(prev.badges || []), ...toAward] } : prev);
    }
  };

  const refreshUserData = useCallback(async () => {
    if (!user) return;
    const ud = await getUserData(user.uid);
    setUserData(ud);
  }, [user]);

  const refreshChapters = useCallback(async () => {
    if (!user) return;
    const ch = await getUserChapters(user.uid);
    setChapters(ch);
  }, [user]);

  const updateProfile = useCallback(async (profile: Partial<UserData["profile"]>) => {
    if (!user) return;
    const merged = { ...(userData?.profile || {}), ...profile } as UserData["profile"];
    await saveUserData(user.uid, { profile: merged });
    setUserData(prev => prev ? { ...prev, profile: merged } : prev);
  }, [user, userData]);

  const setExamDate = useCallback(async (date: string | null) => {
    if (!user) return;
    await saveUserData(user.uid, { examDate: date });
    setUserData(prev => prev ? { ...prev, examDate: date } : prev);
  }, [user]);

  const setDailyGoal = useCallback(async (target: number) => {
    if (!user) return;
    await saveUserData(user.uid, { dailyGoalTarget: target });
    setUserData(prev => prev ? { ...prev, dailyGoalTarget: target } : prev);
  }, [user]);

  const markNotesRead = useCallback(async (chapterId: string) => {
    if (!user) return;
    await markChapterActivityInDB(chapterId, "notesRead");
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, notesRead: true } : c));
    const updatedChapters = chapters.map(c => c.id === chapterId ? { ...c, notesRead: true } : c);
    const ud = userData;
    if (ud) await checkAndAwardBadges(user.uid, ud, updatedChapters);
  }, [user, userData, chapters]);

  const trackQuestionAnswer = useCallback(async (
    chapterId: string,
    isWrong: boolean,
    question: { id: string; question: string; type: string }
  ) => {
    if (!user) return;
    const result = await trackQuestionAnswerInDB(user.uid, chapterId, isWrong, question);
    setUserData(prev => {
      if (!prev) return prev;
      const today = new Date().toISOString().split("T")[0];
      return {
        ...prev,
        totalQuestionsAnswered: result.totalQuestionsAnswered,
        totalQuestionsWrong: result.totalQuestionsWrong,
        dailyProgress: { date: today, questionsAnswered: result.dailyCount },
      };
    });
    setChapters(prev => prev.map(c => {
      if (c.id !== chapterId) return c;
      return {
        ...c,
        questionsAttempted: (c.questionsAttempted || 0) + 1,
        questionsWrong: (c.questionsWrong || 0) + (isWrong ? 1 : 0),
      };
    }));
    if (userData) {
      const updatedUd = {
        ...userData,
        totalQuestionsAnswered: result.totalQuestionsAnswered,
        totalQuestionsWrong: result.totalQuestionsWrong,
      };
      await checkAndAwardBadges(user.uid, updatedUd, chapters);
    }
  }, [user, userData, chapters]);

  const markFlashcardsDone = useCallback(async (chapterId: string) => {
    if (!user) return;
    await markChapterActivityInDB(chapterId, "flashcardsDone");
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, flashcardsDone: true } : c));
    const updatedChapters = chapters.map(c => c.id === chapterId ? { ...c, flashcardsDone: true } : c);
    if (userData) await checkAndAwardBadges(user.uid, userData, updatedChapters);
  }, [user, userData, chapters]);

  const markSimulationSeen = useCallback(async (chapterId: string) => {
    if (!user) return;
    await markChapterActivityInDB(chapterId, "simulationsSeen");
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, simulationsSeen: true } : c));
    const updatedChapters = chapters.map(c => c.id === chapterId ? { ...c, simulationsSeen: true } : c);
    if (userData) await checkAndAwardBadges(user.uid, userData, updatedChapters);
  }, [user, userData, chapters]);

  return (
    <ProgressContext.Provider value={{
      userData, loadingUser, chapters,
      refreshUserData, updateProfile, setExamDate, setDailyGoal,
      markNotesRead, trackQuestionAnswer, markFlashcardsDone, markSimulationSeen,
      refreshChapters,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
