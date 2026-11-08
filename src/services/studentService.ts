import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Student, KTMStatus } from '../types';
import rawSeedData from '../data/students-data.json';
import { calculateStudentStatistics } from '../utils/studentLogic';

const STUDENTS_COLLECTION = 'students';
const LOCAL_STORAGE_KEY = 'ktm_upnvj_students_cache';

// Initialize in-memory cache with fallback to seed data
let inMemoryStudents: Student[] = (() => {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read students from localStorage:', e);
  }
  return rawSeedData as Student[];
})();

function saveToLocalStorage(students: Student[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export const studentService = {
  /**
   * Get all students. Returns memory cache immediately, background syncs with Firestore if online.
   */
  async getAllStudents(): Promise<Student[]> {
    try {
      const colRef = collection(db, STUDENTS_COLLECTION);
      const snapshotPromise = getDocs(colRef);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1000));
      const snapshot: any = await Promise.race([snapshotPromise, timeoutPromise]);
      
      if (snapshot && !snapshot.empty) {
        const firestoreStudents: Student[] = [];
        snapshot.forEach((docSnap: any) => {
          firestoreStudents.push(docSnap.data() as Student);
        });
        firestoreStudents.sort((a: Student, b: Student) => a.no - b.no);
        inMemoryStudents = firestoreStudents;
        saveToLocalStorage(firestoreStudents);
        return firestoreStudents;
      }
    } catch {
      // Graceful fallback to verified local dataset
    }
    return inMemoryStudents;
  },

  /**
   * Get student by NIM. Instant memory return with background sync.
   */
  async getStudentByNim(nim: string): Promise<Student | null> {
    const cleanNim = nim.trim();
    const found = inMemoryStudents.find(s => s.nim === cleanNim);

    try {
      const docRef = doc(db, STUDENTS_COLLECTION, cleanNim);
      const getDocPromise = getDoc(docRef);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 800));
      const docSnap: any = await Promise.race([getDocPromise, timeoutPromise]);
      if (docSnap && docSnap.exists()) {
        return docSnap.data() as Student;
      }
    } catch {
      // Use verified local store
    }

    return found || null;
  },

  /**
   * Update student status and schedule
   */
  async updateStudent(nim: string, updates: Partial<Student>): Promise<boolean> {
    const cleanNim = nim.trim();
    const now = new Date().toISOString();
    const updatedPayload = { ...updates, updatedAt: now };

    // Update in Firestore
    try {
      const docRef = doc(db, STUDENTS_COLLECTION, cleanNim);
      await setDoc(docRef, updatedPayload, { merge: true });
    } catch (err) {
      console.warn('Could not update student in Firestore, updating local cache only:', err);
    }

    // Update in-memory & local storage
    const idx = inMemoryStudents.findIndex(s => s.nim === cleanNim);
    if (idx !== -1) {
      inMemoryStudents[idx] = { ...inMemoryStudents[idx], ...updatedPayload };
      saveToLocalStorage(inMemoryStudents);
      return true;
    }
    return false;
  },

  /**
   * Batch seed all 1,089 students to Firestore in chunks of 450 (Firestore limit is 500 per batch)
   */
  async seedAllToFirestore(onProgress?: (synced: number, total: number) => void): Promise<{ success: boolean; total: number }> {
    const total = inMemoryStudents.length;
    const CHUNK_SIZE = 400;
    let synced = 0;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = inMemoryStudents.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const student of chunk) {
        const docRef = doc(db, STUDENTS_COLLECTION, student.nim);
        batch.set(docRef, student, { merge: true });
      }

      await batch.commit();
      synced += chunk.length;
      if (onProgress) {
        onProgress(synced, total);
      }
    }

    return { success: true, total: synced };
  },

  /**
   * Import students from parsed Excel file
   */
  async importStudents(
    incomingStudents: Student[], 
    mode: 'add' | 'update' | 'sync',
    onProgress?: (current: number, total: number) => void
  ): Promise<{ inserted: number; updated: number; duplicates: number; total: number }> {
    let inserted = 0;
    let updated = 0;
    let duplicates = 0;

    const studentMap = new Map<string, Student>();
    for (const s of inMemoryStudents) {
      studentMap.set(s.nim, s);
    }

    const studentsToCommit: Student[] = [];

    for (const incoming of incomingStudents) {
      const existing = studentMap.get(incoming.nim);
      if (existing) {
        if (mode === 'sync' || mode === 'update') {
          const merged: Student = {
            ...existing,
            ...incoming,
            no: existing.no,
            updatedAt: new Date().toISOString()
          };
          studentMap.set(incoming.nim, merged);
          studentsToCommit.push(merged);
          updated++;
        } else {
          duplicates++;
        }
      } else {
        const newNo = studentMap.size + 1;
        const newStudent: Student = {
          ...incoming,
          no: newNo,
          updatedAt: new Date().toISOString()
        };
        studentMap.set(incoming.nim, newStudent);
        studentsToCommit.push(newStudent);
        inserted++;
      }
    }

    const updatedList = Array.from(studentMap.values()).sort((a, b) => a.no - b.no);
    inMemoryStudents = updatedList;
    saveToLocalStorage(updatedList);

    // Save to Firestore in background
    try {
      const CHUNK_SIZE = 400;
      for (let i = 0; i < studentsToCommit.length; i += CHUNK_SIZE) {
        const chunk = studentsToCommit.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        for (const s of chunk) {
          batch.set(doc(db, STUDENTS_COLLECTION, s.nim), s, { merge: true });
        }
        await batch.commit();
        if (onProgress) {
          onProgress(Math.min(i + CHUNK_SIZE, studentsToCommit.length), studentsToCommit.length);
        }
      }
    } catch (e) {
      console.warn('Firestore import write failed (local state updated):', e);
    }

    return { inserted, updated, duplicates, total: inMemoryStudents.length };
  },

  /**
   * Reset to original seed data
   */
  resetToDefault(): Student[] {
    inMemoryStudents = [...(rawSeedData as Student[])];
    saveToLocalStorage(inMemoryStudents);
    return inMemoryStudents;
  },

  /**
   * Get overall statistics
   */
  getStatistics() {
    return calculateStudentStatistics(inMemoryStudents);
  }
};
