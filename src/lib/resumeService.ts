import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import type { EditorElement } from "../types/editor";

export interface Resume {
  id: string;
  userId: string;
  title: string;
  elements: EditorElement[];
  updatedAt: any;
  createdAt: any;
  thumbnail?: string;
}

const COLLECTION_NAME = "resumes";

export const resumeService = {
  async createResume(userId: string, title: string = "Untitled Resume", elements: EditorElement[] = []) {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      title,
      elements,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateResume(id: string, elements: EditorElement[], title?: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updates: any = {
      elements,
      updatedAt: serverTimestamp(),
    };
    if (title) updates.title = title;
    await updateDoc(docRef, updates);
  },

  async getResume(id: string): Promise<Resume | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Resume;
    }
    return null;
  },

  async getUserResumes(userId: string): Promise<Resume[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
      // Removal of orderBy to avoid mandatory composite index requirement
    );
    const querySnapshot = await getDocs(q);
    const resumes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resume));
    
    // Client-side sort as fallback
    return resumes.sort((a, b) => {
      const dateA = a.updatedAt?.seconds || 0;
      const dateB = b.updatedAt?.seconds || 0;
      return dateB - dateA;
    });
  },

  async deleteResume(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
