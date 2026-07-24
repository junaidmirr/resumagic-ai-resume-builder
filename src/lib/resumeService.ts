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
const LOCAL_STORAGE_KEY = "guest_resumes";

// Helper for local guest storage
const getLocalResumes = (): Resume[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalResumes = (resumes: Resume[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resumes));
  } catch (e) {
    console.warn("[ResumeService] Local storage save error:", e);
  }
};

// Helper for cloud resumes cache to eliminate redundant Firebase reads
const getCloudResumesCache = (userId: string): Resume[] => {
  try {
    const raw = localStorage.getItem(`cloud_resumes_cache_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveCloudResumesCache = (userId: string, resumes: Resume[]) => {
  try {
    localStorage.setItem(`cloud_resumes_cache_${userId}`, JSON.stringify(resumes));
  } catch (e) {
    console.warn("[ResumeService] Cache save warning:", e);
  }
};

function cleanUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  } else if (obj !== null && typeof obj === "object") {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        res[key] = cleanUndefined(obj[key]);
      }
    }
    return res;
  }
  return obj;
}

export const resumeService = {
  async createResume(userId: string | undefined | null, title: string = "Untitled Resume", elements: EditorElement[] = [], thumbnail?: string) {
    const sanitizedElements = cleanUndefined(elements);
    if (!userId || userId === "guest") {
      const id = "local_" + Math.random().toString(36).substr(2, 9);
      const newResume: Resume = {
        id,
        userId: "guest",
        title,
        elements: sanitizedElements,
        thumbnail,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        updatedAt: { seconds: Math.floor(Date.now() / 1000) },
      };
      const resumes = getLocalResumes();
      resumes.push(newResume);
      saveLocalResumes(resumes);
      return id;
    }

    const docData: any = {
      userId,
      title,
      elements: sanitizedElements,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (thumbnail) docData.thumbnail = thumbnail;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

    const newResume: Resume = {
      id: docRef.id,
      userId,
      title,
      elements: sanitizedElements,
      thumbnail,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      updatedAt: { seconds: Math.floor(Date.now() / 1000) },
    };
    const cached = getCloudResumesCache(userId);
    cached.unshift(newResume);
    saveCloudResumesCache(userId, cached);

    return docRef.id;
  },

  async updateResume(id: string, elements: EditorElement[], title?: string, thumbnail?: string, userId?: string) {
    const sanitizedElements = cleanUndefined(elements);
    if (id.startsWith("local_")) {
      const resumes = getLocalResumes();
      const index = resumes.findIndex((r) => r.id === id);
      if (index !== -1) {
        resumes[index].elements = sanitizedElements;
        resumes[index].updatedAt = { seconds: Math.floor(Date.now() / 1000) };
        if (title) resumes[index].title = title;
        if (thumbnail) resumes[index].thumbnail = thumbnail;
        saveLocalResumes(resumes);
      }
      return;
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    const updates: any = {
      elements: sanitizedElements,
      updatedAt: serverTimestamp(),
    };
    if (title) updates.title = title;
    if (thumbnail) updates.thumbnail = thumbnail;
    await updateDoc(docRef, updates);

    // Update local cache
    if (userId) {
      const cached = getCloudResumesCache(userId);
      const index = cached.findIndex((r) => r.id === id);
      if (index !== -1) {
        cached[index].elements = sanitizedElements;
        if (title) cached[index].title = title;
        if (thumbnail) cached[index].thumbnail = thumbnail;
        cached[index].updatedAt = { seconds: Math.floor(Date.now() / 1000) };
        saveCloudResumesCache(userId, cached);
      }
    }
  },

  async getResume(id: string, userId?: string): Promise<Resume | null> {
    if (id.startsWith("local_")) {
      const resumes = getLocalResumes();
      return resumes.find((r) => r.id === id) || null;
    }

    // Check local cache first for 0ms instant loading
    if (userId) {
      const cached = getCloudResumesCache(userId);
      const found = cached.find((r) => r.id === id);
      if (found) return found;
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const resData = { id: docSnap.id, ...docSnap.data() } as Resume;
      if (resData.userId) {
        const cached = getCloudResumesCache(resData.userId);
        const idx = cached.findIndex((r) => r.id === id);
        if (idx !== -1) cached[idx] = resData;
        else cached.push(resData);
        saveCloudResumesCache(resData.userId, cached);
      }
      return resData;
    }
    return null;
  },

  async getUserResumes(userId: string | undefined | null, forceRefresh: boolean = false): Promise<Resume[]> {
    const localResumes = getLocalResumes();
    
    if (!userId || userId === "guest") {
      return localResumes.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    }

    // Check cached cloud resumes first for instant UI response
    const cachedCloud = getCloudResumesCache(userId);
    if (cachedCloud.length > 0 && !forceRefresh) {
      // Non-blocking background sync from Firestore
      setTimeout(() => {
        const q = query(
          collection(db, COLLECTION_NAME),
          where("userId", "==", userId)
        );
        getDocs(q).then((querySnapshot) => {
          const freshCloud = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resume));
          saveCloudResumesCache(userId, freshCloud);
        }).catch(console.error);
      }, 100);

      const allResumes = [...cachedCloud, ...localResumes];
      return allResumes.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const cloudResumes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resume));
    saveCloudResumesCache(userId, cloudResumes);
    
    const allResumes = [...cloudResumes, ...localResumes];
    return allResumes.sort((a, b) => {
      const dateA = a.updatedAt?.seconds || 0;
      const dateB = b.updatedAt?.seconds || 0;
      return dateB - dateA;
    });
  },

  async deleteResume(id: string, userId?: string) {
    if (id.startsWith("local_")) {
      const resumes = getLocalResumes();
      saveLocalResumes(resumes.filter((r) => r.id !== id));
      return;
    }

    if (userId) {
      const cached = getCloudResumesCache(userId);
      saveCloudResumesCache(userId, cached.filter((r) => r.id !== id));
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
