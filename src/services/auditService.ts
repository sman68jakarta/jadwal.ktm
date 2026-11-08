import { collection, doc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { AuditLog } from '../types';

const AUDIT_LOGS_COLLECTION = 'audit_logs';
const AUDIT_CACHE_KEY = 'ktm_upnvj_audit_logs_cache';

// Seed initial audit log activities
const initialLogs: AuditLog[] = [
  {
    id: 'log-seed-1',
    actorUid: 'admin-upnvj-root',
    actorName: 'Administrator FEB UPNVJ',
    actorRole: 'admin',
    action: 'Inisialisasi Sistem',
    entityType: 'settings',
    entityId: 'init-2026',
    timestamp: '2026-11-05T08:00:00.000Z',
    description: 'Inisialisasi database distribusi KTM 1.089 mahasiswa baru FEB 2026.'
  },
  {
    id: 'log-seed-2',
    actorUid: 'admin-upnvj-root',
    actorName: 'Administrator FEB UPNVJ',
    actorRole: 'admin',
    action: 'Impor Data Excel',
    entityType: 'import',
    entityId: 'import-init',
    timestamp: '2026-11-05T09:30:00.000Z',
    description: 'Berhasil mengimpor 1.089 data mahasiswa S1 dan D3 dari spreadsheet resmi.'
  },
  {
    id: 'log-seed-3',
    actorUid: 'superadmin-root',
    actorName: 'Super Admin Kemahasiswaan',
    actorRole: 'super_admin',
    action: 'Penetapan Jadwal',
    entityType: 'schedule',
    entityId: 'sch-nov-9',
    timestamp: '2026-11-06T10:15:00.000Z',
    description: 'Menetapkan jadwal distribusi Senin, 9 November 2026 untuk 303 mahasiswa.'
  }
];

let inMemoryLogs: AuditLog[] = (() => {
  try {
    const raw = localStorage.getItem(AUDIT_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Audit cache read failed:', e);
  }
  return initialLogs;
})();

function saveLogsCache(logs: AuditLog[]) {
  try {
    localStorage.setItem(AUDIT_CACHE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to save audit cache:', e);
  }
}

export const auditService = {
  /**
   * Log an activity to Firestore & cache
   */
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };

    inMemoryLogs.unshift(newLog);
    saveLogsCache(inMemoryLogs);

    // Save to Firestore non-blocking
    try {
      const docRef = doc(db, AUDIT_LOGS_COLLECTION, newLog.id);
      setDoc(docRef, newLog).catch(err => {
        console.warn('Firestore audit log save failed (falling back to cache):', err);
      });
    } catch (e) {
      console.warn('Audit log write error:', e);
    }

    return newLog;
  },

  /**
   * Get audit logs list
   */
  async getAuditLogs(maxCount = 50): Promise<AuditLog[]> {
    try {
      const colRef = collection(db, AUDIT_LOGS_COLLECTION);
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(maxCount));
      const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 800));
      const snap: any = await Promise.race([getDocs(q), timeout]);

      if (snap && !snap.empty) {
        const fetched: AuditLog[] = [];
        snap.forEach((d: any) => fetched.push(d.data() as AuditLog));
        inMemoryLogs = fetched;
        saveLogsCache(fetched);
        return fetched;
      }
    } catch {
      // Return memory logs
    }
    return inMemoryLogs.slice(0, maxCount);
  }
};
