export type KTMStatus = 
  | 'Sudah jadi' 
  | 'Proses pembuatan' 
  | 'Belum dijadwalkan' 
  | 'Siap Diambil' 
  | 'Sudah Didistribusikan';

export type UserRole = 'super_admin' | 'admin' | 'petugas' | 'staff' | 'student';

export interface Student {
  no: number;
  nim: string;
  nama: string;
  programStudi: string;
  jenjang?: 'S1' | 'D3';
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
  petugasDistribusi?: string;
  waktuPenerimaan?: string;
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
  isActive?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'informasi' | 'jadwal' | 'perubahan' | 'penting' | 'administrasi' | 'syarat' | 'lokasi';
  targetAudience?: 'all' | 'S1' | 'D3' | string;
  date: string;
  isActive: boolean;
  priority?: 'normal' | 'high';
  author?: string;
  createdAt?: string;
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

export interface ScheduleItem {
  id: string;
  namaJadwal: string;
  tanggal: string;
  hari: string;
  waktuMulai: string;
  waktuSelesai: string;
  lokasi: string;
  programStudi: string[];
  kelompok: string;
  keterangan: string;
  status: 'Draft' | 'Aktif' | 'Selesai' | 'Dibatalkan';
  totalMahasiswa?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole | string;
  action: string;
  entityType: 'student' | 'schedule' | 'status' | 'announcement' | 'import' | 'user' | 'settings' | 'auth';
  entityId: string;
  beforeData?: any;
  afterData?: any;
  timestamp: string;
  description: string;
}

export interface ImportHistoryItem {
  id: string;
  fileName: string;
  timestamp: string;
  actorName: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  duplicateCount?: number;
  skippedCount: number;
  mode: 'add' | 'update' | 'sync';
  details?: string;
}
