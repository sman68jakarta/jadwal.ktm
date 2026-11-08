import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ScheduleItem } from '../types';

const SCHEDULES_COLLECTION = 'schedules';
const SCHEDULES_CACHE_KEY = 'ktm_upnvj_schedules_cache';

const defaultSchedules: ScheduleItem[] = [
  {
    id: 'sch-1',
    namaJadwal: 'Sesi 1: FEB S1 Manajemen & D3 Akuntansi',
    hari: 'Senin',
    tanggal: '2026-11-09',
    waktuMulai: '09:00',
    waktuSelesai: '16:00',
    lokasi: 'Gedung FEB Lantai 1, UPN Veteran Jakarta Kampus Pondok Labu',
    programStudi: ['S1 Manajemen', 'D3 Akuntansi'],
    kelompok: 'Kelompok A',
    keterangan: 'Distribusi perdana untuk S1 Manajemen dan D3 Akuntansi.',
    status: 'Aktif',
    totalMahasiswa: 303
  },
  {
    id: 'sch-2',
    namaJadwal: 'Sesi 2: FEB S1 Akuntansi & S1 Ekonomi Syariah',
    hari: 'Selasa',
    tanggal: '2026-11-10',
    waktuMulai: '09:00',
    waktuSelesai: '16:00',
    lokasi: 'Gedung FEB Lantai 1, UPN Veteran Jakarta Kampus Pondok Labu',
    programStudi: ['S1 Akuntansi', 'S1 Ekonomi Syariah'],
    kelompok: 'Kelompok B',
    keterangan: 'Distribusi hari kedua untuk S1 Akuntansi dan Ekonomi Syariah.',
    status: 'Aktif',
    totalMahasiswa: 190
  },
  {
    id: 'sch-3',
    namaJadwal: 'Sesi 3: FEB S1 Ekonomi Pembangunan & D3 Perbankan',
    hari: 'Rabu',
    tanggal: '2026-11-11',
    waktuMulai: '09:00',
    waktuSelesai: '16:00',
    lokasi: 'Gedung FEB Lantai 1, UPN Veteran Jakarta Kampus Pondok Labu',
    programStudi: ['S1 Ekonomi Pembangunan', 'D3 Perbankan dan Keuangan'],
    kelompok: 'Kelompok C',
    keterangan: 'Distribusi hari ketiga untuk Ekonomi Pembangunan dan D3 Perbankan.',
    status: 'Aktif',
    totalMahasiswa: 223
  },
  {
    id: 'sch-4',
    namaJadwal: 'Sesi 4: FEB Seluruh Program Studi Gabungan',
    hari: 'Kamis',
    tanggal: '2026-11-12',
    waktuMulai: '09:00',
    waktuSelesai: '16:00',
    lokasi: 'Gedung FEB Lantai 1, UPN Veteran Jakarta Kampus Pondok Labu',
    programStudi: ['S1 Manajemen', 'S1 Akuntansi', 'S1 Ekonomi Pembangunan'],
    kelompok: 'Kelompok D',
    keterangan: 'Distribusi reguler hari terakhir sebelum pembagian susulan.',
    status: 'Aktif',
    totalMahasiswa: 228
  },
  {
    id: 'sch-5',
    namaJadwal: 'Sesi Susulan: Mahasiswa Dalam Proses Cetak Bank',
    hari: 'Senin',
    tanggal: '2026-11-16',
    waktuMulai: '10:00',
    waktuSelesai: '15:00',
    lokasi: 'Gedung FEB Lantai 1, Ruang Kemahasiswaan',
    programStudi: ['Semua Program Studi'],
    kelompok: 'Susulan',
    keterangan: 'Jadwal susulan bagi mahasiswa yang KTM-nya masih dalam proses percetakan.',
    status: 'Draft',
    totalMahasiswa: 145
  }
];

let inMemorySchedules: ScheduleItem[] = (() => {
  try {
    const raw = localStorage.getItem(SCHEDULES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Schedule cache read error:', e);
  }
  return defaultSchedules;
})();

function saveSchedulesCache(schedules: ScheduleItem[]) {
  try {
    localStorage.setItem(SCHEDULES_CACHE_KEY, JSON.stringify(schedules));
  } catch (e) {
    console.warn('Failed to save schedules cache:', e);
  }
}

export const scheduleService = {
  async getSchedules(): Promise<ScheduleItem[]> {
    try {
      const colRef = collection(db, SCHEDULES_COLLECTION);
      const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 800));
      const snap: any = await Promise.race([getDocs(colRef), timeout]);

      if (snap && !snap.empty) {
        const list: ScheduleItem[] = [];
        snap.forEach((d: any) => list.push(d.data() as ScheduleItem));
        inMemorySchedules = list;
        saveSchedulesCache(list);
        return list;
      }
    } catch {
      // Fallback to cache
    }
    return inMemorySchedules;
  },

  async addSchedule(schedule: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleItem> {
    const now = new Date().toISOString();
    const newSchedule: ScheduleItem = {
      ...schedule,
      id: `sch-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };

    inMemorySchedules.push(newSchedule);
    saveSchedulesCache(inMemorySchedules);

    try {
      const docRef = doc(db, SCHEDULES_COLLECTION, newSchedule.id);
      await setDoc(docRef, newSchedule);
    } catch (e) {
      console.warn('Firestore add schedule warning:', e);
    }

    return newSchedule;
  },

  async updateSchedule(id: string, updates: Partial<ScheduleItem>): Promise<boolean> {
    const idx = inMemorySchedules.findIndex(s => s.id === id);
    if (idx === -1) return false;

    const updated = {
      ...inMemorySchedules[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    inMemorySchedules[idx] = updated;
    saveSchedulesCache(inMemorySchedules);

    try {
      const docRef = doc(db, SCHEDULES_COLLECTION, id);
      await setDoc(docRef, updated, { merge: true });
    } catch (e) {
      console.warn('Firestore update schedule warning:', e);
    }

    return true;
  },

  async deleteSchedule(id: string): Promise<boolean> {
    inMemorySchedules = inMemorySchedules.filter(s => s.id !== id);
    saveSchedulesCache(inMemorySchedules);

    try {
      const docRef = doc(db, SCHEDULES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore delete schedule warning:', e);
    }

    return true;
  }
};
