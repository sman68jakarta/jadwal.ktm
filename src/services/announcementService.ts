import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { Announcement } from '../types';

const ANNOUNCEMENTS_COLLECTION = 'announcements';
const LOCAL_STORAGE_KEY = 'ktm_upnvj_announcements_cache';

const defaultAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Jadwal Distribusi KTM Mahasiswa Baru FEB UPNVJ 2026',
    content: 'Distribusi Kartu Tanda Mahasiswa (KTM) Baru Angkatan 2026 Fakultas Ekonomi dan Bisnis dilaksanakan mulai Senin, 9 November 2026 sampai dengan Kamis, 12 November 2026 bertempat di Gedung FEB Lt. 1 Kampus Pondok Labu. Pastikan Anda datang sesuai hari dan sesi waktu yang tertera pada akun Anda.',
    category: 'jadwal',
    date: '2026-11-05',
    isActive: true,
    priority: 'high',
    author: 'Bagian Akademik & Kemahasiswaan FEB UPNVJ'
  },
  {
    id: 'ann-2',
    title: 'Persyaratan Wajib Saat Pengambilan KTM Fisik',
    content: 'Mahasiswa wajib membawa: (1) Bukti Tanda Terima Registrasi Mahasiswa Baru 2026 (cetak/digital); (2) Kartu Identitas Asli (KTP/KK/SIM/Paspor); (3) Lembar Bukti Jadwal Distribusi yang diunduh dari sistem ini. Pengambilan TIDAK DAPAT diwakilkan kecuali dengan Surat Kuasa bermaterai Rp10.000.',
    category: 'syarat',
    date: '2026-11-04',
    isActive: true,
    priority: 'high',
    author: 'Tim Distribusi KTM UPNVJ'
  },
  {
    id: 'ann-3',
    title: 'Informasi Mahasiswa dengan Status "Proses Pembuatan"',
    content: 'Bagi mahasiswa dengan status "Proses pembuatan" dan jadwal "Dijadwalkan kemudian", pencetakan kartu sedang difinalisasi oleh pihak bank mitra. Jadwal pengambilan susulan akan diumumkan secara berkala melalui portal ini.',
    category: 'penting',
    date: '2026-11-03',
    isActive: true,
    priority: 'normal',
    author: 'Biro Administrasi Akademik UPNVJ'
  },
  {
    id: 'ann-4',
    title: 'Titik Lokasi & Alur Pengambilan di Kampus Pondok Labu',
    content: 'Pengambilan KTM berlokasi di Lobby Gedung Fakultas Ekonomi dan Bisnis (FEB) Lantai 1, Jl. RS. Fatmawati No. 1 Pondok Labu, Jakarta Selatan. Mahasiswa diharapkan hadir 15 menit sebelum sesi berakhir dan mematuhi tata tertib kampus.',
    category: 'lokasi',
    date: '2026-11-02',
    isActive: true,
    priority: 'normal',
    author: 'Humas UPNVJ'
  }
];

let inMemoryAnnouncements: Announcement[] = (() => {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading announcements cache:', e);
  }
  return defaultAnnouncements;
})();

function saveToLocalStorage(data: Announcement[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed writing announcements to localStorage:', e);
  }
}

export const announcementService = {
  async getAll(): Promise<Announcement[]> {
    try {
      const colRef = collection(db, ANNOUNCEMENTS_COLLECTION);
      const getDocsPromise = getDocs(colRef);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 800));
      const snapshot: any = await Promise.race([getDocsPromise, timeoutPromise]);
      if (snapshot && !snapshot.empty) {
        const firestoreAnn: Announcement[] = [];
        snapshot.forEach((docSnap: any) => firestoreAnn.push(docSnap.data() as Announcement));
        firestoreAnn.sort((a: Announcement, b: Announcement) => new Date(b.date).getTime() - new Date(a.date).getTime());
        inMemoryAnnouncements = firestoreAnn;
        saveToLocalStorage(firestoreAnn);
        return firestoreAnn;
      }
    } catch {
      // Graceful fallback to verified announcement data
    }
    return inMemoryAnnouncements;
  },

  async saveAnnouncement(ann: Omit<Announcement, 'id'> & { id?: string }): Promise<Announcement> {
    const id = ann.id || `ann-${Date.now()}`;
    const fullAnn: Announcement = { ...ann, id };

    try {
      await setDoc(doc(db, ANNOUNCEMENTS_COLLECTION, id), fullAnn, { merge: true });
    } catch (err) {
      console.warn('Failed to save announcement to Firestore:', err);
    }

    const idx = inMemoryAnnouncements.findIndex(a => a.id === id);
    if (idx !== -1) {
      inMemoryAnnouncements[idx] = fullAnn;
    } else {
      inMemoryAnnouncements.unshift(fullAnn);
    }
    saveToLocalStorage(inMemoryAnnouncements);
    return fullAnn;
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, ANNOUNCEMENTS_COLLECTION, id));
    } catch (err) {
      console.warn('Failed to delete announcement from Firestore:', err);
    }

    inMemoryAnnouncements = inMemoryAnnouncements.filter(a => a.id !== id);
    saveToLocalStorage(inMemoryAnnouncements);
    return true;
  }
};
