export type KTMStatus = 'Sudah jadi' | 'Proses pembuatan' | 'Belum dijadwalkan';

export type UserRole = 'student' | 'admin' | 'staff';

export interface Student {
  no: number;
  nim: string;
  nama: string;
  programStudi: string;
  keterangan: KTMStatus;
  statusKTM: KTMStatus;
  jadwal: string;
  hariDistribusi: string;
  tanggalDistribusi: string;
  waktuDistribusi: string;
  lokasiDistribusi: string;
  angkatan: string;
  syaratPengambilan: string[];
  catatanKhusus?: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  nama: string;
  nim?: string;
  role: UserRole;
  programStudi?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'jadwal' | 'syarat' | 'lokasi' | 'penting';
  date: string;
  isActive: boolean;
  priority?: 'normal' | 'high';
  author?: string;
}

export interface SiteSettings {
  namaWebsite: string;
  namaUniversitas: string;
  tahunDistribusi: string;
  lokasiUtama: string;
  kontakBantuan: string;
  emailBantuan: string;
  jamOperasional: string;
  catatanPenting: string;
}
