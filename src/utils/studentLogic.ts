import { Student, KTMStatus } from '../types';

export interface FilterOptions {
  search?: string;
  prodi?: string;
  status?: string;
  jadwal?: string;
  sortField?: 'no' | 'nim' | 'nama' | 'programStudi' | 'statusKTM' | 'jadwal';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface StudentStatistics {
  totalStudents: number;
  totalSudahJadi: number;
  totalProses: number;
  totalBelumDijadwalkan: number;
  percentageSudahJadi: number;
  prodiBreakdown: Record<string, { total: number; sudahJadi: number; proses: number }>;
  jadwalBreakdown: Record<string, number>;
}

/**
 * Validates NIM format (UPNVJ 10-digit standard starting with 26)
 */
export function validateNIM(nim: string): { isValid: boolean; message?: string } {
  const cleanNim = nim.trim();
  if (!cleanNim) {
    return { isValid: false, message: 'NIM wajib diisi.' };
  }
  if (!/^\d+$/.test(cleanNim)) {
    return { isValid: false, message: 'NIM harus berupa angka.' };
  }
  if (cleanNim.length !== 10) {
    return { isValid: false, message: 'NIM mahasiswa UPNVJ harus 10 digit.' };
  }
  return { isValid: true };
}

/**
 * Pure function to calculate comprehensive statistics over any student array
 */
export function calculateStudentStatistics(students: Student[]): StudentStatistics {
  const total = students.length;
  let sudahJadi = 0;
  let proses = 0;
  let belumDijadwalkan = 0;
  const prodiBreakdown: Record<string, { total: number; sudahJadi: number; proses: number }> = {};
  const jadwalBreakdown: Record<string, number> = {};

  for (const s of students) {
    const status = s.statusKTM;
    if (status === 'Sudah jadi') {
      sudahJadi++;
    } else if (status === 'Proses pembuatan') {
      proses++;
    } else {
      belumDijadwalkan++;
    }

    if (s.jadwal === 'Dijadwalkan kemudian') {
      belumDijadwalkan++;
    }

    // Prodi
    const prodi = s.programStudi || 'Lainnya';
    if (!prodiBreakdown[prodi]) {
      prodiBreakdown[prodi] = { total: 0, sudahJadi: 0, proses: 0 };
    }
    prodiBreakdown[prodi].total++;
    if (status === 'Sudah jadi') prodiBreakdown[prodi].sudahJadi++;
    if (status === 'Proses pembuatan') prodiBreakdown[prodi].proses++;

    // Jadwal
    const j = s.jadwal || 'Belum Ditentukan';
    jadwalBreakdown[j] = (jadwalBreakdown[j] || 0) + 1;
  }

  const percentageSudahJadi = total > 0 ? Math.round((sudahJadi / total) * 100) : 0;

  return {
    totalStudents: total,
    totalSudahJadi: sudahJadi,
    totalProses: proses,
    totalBelumDijadwalkan: belumDijadwalkan,
    percentageSudahJadi,
    prodiBreakdown,
    jadwalBreakdown
  };
}

/**
 * Pure function for client-side / service-side searching, filtering, sorting and pagination
 */
export function filterAndSearchStudents(students: Student[], options: FilterOptions) {
  const {
    search = '',
    prodi = 'ALL',
    status = 'ALL',
    jadwal = 'ALL',
    sortField = 'no',
    sortOrder = 'asc',
    page = 1,
    pageSize = 20
  } = options;

  let filtered = students;

  // Search keyword (case-insensitive, trims spaces, checks NIM, name, or program study)
  const q = search.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(s => {
      const matchNim = s.nim.toLowerCase().includes(q);
      const matchName = s.nama.toLowerCase().includes(q);
      const matchProdi = s.programStudi.toLowerCase().includes(q);
      return matchNim || matchName || matchProdi;
    });
  }

  // Filter Prodi
  if (prodi && prodi !== 'ALL') {
    filtered = filtered.filter(s => s.programStudi === prodi);
  }

  // Filter Status
  if (status && status !== 'ALL') {
    filtered = filtered.filter(s => s.statusKTM === status);
  }

  // Filter Jadwal
  if (jadwal && jadwal !== 'ALL') {
    filtered = filtered.filter(s => s.jadwal === jadwal);
  }

  // Sorting
  filtered = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      const cmp = (aVal as string).localeCompare(bVal as string);
      return sortOrder === 'asc' ? cmp : -cmp;
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (safePage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return {
    data: paginated,
    total: totalFiltered,
    page: safePage,
    pageSize,
    totalPages
  };
}
