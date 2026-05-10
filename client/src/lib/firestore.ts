import { db } from "./firebase";
import {
  collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";

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
  // Phase 2 enrichment (generated lazily on first access)
  formulas?: any[];
  mindmap?: any;
  mistakes?: any[];
  flashcards?: any[];
}

const CHAPTERS_COLLECTION = "chapters";
const MAX_CHAPTERS = 5;

export async function getUserChapters(userId: string): Promise<Chapter[]> {
  const q = query(
    collection(db, CHAPTERS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));
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

// Phase 2: save a single enrichment section lazily
export async function updateChapterSection(chapterId: string, sectionKey: string, data: any): Promise<void> {
  const ref = doc(db, CHAPTERS_COLLECTION, chapterId);
  await setDoc(ref, { [sectionKey]: data }, { merge: true });
}
