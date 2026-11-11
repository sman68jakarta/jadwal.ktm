import * as XLSX from 'xlsx';
import { Student, KTMStatus, UserProfile } from '../types';
import { studentService } from './studentService';
import { auditService } from './auditService';

export interface StudentChangeDiff {
  nim: string;
  nama: string;
  oldStatus: string;
  newStatus: string;
  field: string;
  oldVal?: string;
  newVal?: string;
  timestamp: string;
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  totalRows: number;
  updatedCount: number;
  insertedCount: number;
  statusChangesCount: number;
  status: 'success' | 'error';
  message: string;
  diffs: StudentChangeDiff[];
}

export interface GoogleSheetsConfig {
  spreadsheetUrl: string;
  sheetGid: string;
  autoSyncEnabled: boolean;
  syncIntervalSeconds: number; // e.g. 60, 300, 900
  lastSyncTime: string | null;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncMessage: string | null;
  lastSyncStats: {
    totalRows: number;
    updatedCount: number;
    insertedCount: number;
    unchangedCount: number;
    statusChangesCount: number;
  } | null;
  lastChanges: StudentChangeDiff[];
  syncHistory: SyncHistoryEntry[];
}

const STORAGE_KEY = 'ktm_upnvj_google_sheets_config';

const DEFAULT_CONFIG: GoogleSheetsConfig = {
  spreadsheetUrl: '',
  sheetGid: '0',
  autoSyncEnabled: true,
  syncIntervalSeconds: 60, // 1 menit default
  lastSyncTime: null,
  lastSyncStatus: 'idle',
  lastSyncMessage: 'Belum ada sinkronisasi yang dijalankan. Masukkan link Google Spreadsheet untuk memulai.',
  lastSyncStats: null,
  lastChanges: [],
  syncHistory: []
};

type Listener = (config: GoogleSheetsConfig) => void;

class GoogleSheetsSyncService {
  private config: GoogleSheetsConfig;
  private listeners: Set<Listener> = new Set();
  private timerId: number | null = null;
  private isSyncing = false;

  constructor() {
    this.config = this.loadConfig();
    this.initAutoSync();
  }

  private loadConfig(): GoogleSheetsConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (e) {
      console.warn('Error reading Google Sheets config:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  private saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Error saving Google Sheets config:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb({ ...this.config });
      } catch (e) {
        console.error('Error in Google Sheets listener:', e);
      }
    });
  }

  public subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    cb({ ...this.config });
    return () => this.listeners.delete(cb);
  }

  public getConfig(): GoogleSheetsConfig {
    return { ...this.config };
  }

  /**
   * Save user configuration
   */
  public updateConfig(updates: Partial<GoogleSheetsConfig>) {
    this.config = {
      ...this.config,
      ...updates
    };
    this.saveConfig();

    // Restart timer if auto sync settings changed
    if ('autoSyncEnabled' in updates || 'syncIntervalSeconds' in updates || 'spreadsheetUrl' in updates) {
      this.initAutoSync();
    }
  }

  /**
   * Helper to parse any Google Sheets URL into direct CSV fetch URLs
   */
  public parseGoogleSheetsUrl(rawUrl: string): { 
    isValid: boolean; 
    spreadsheetId?: string; 
    gid?: string; 
    csvUrl?: string; 
    error?: string 
  } {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return { isValid: false, error: 'URL Google Spreadsheet tidak boleh kosong.' };
    }

    // Direct CSV export link provided
    if (trimmed.includes('format=csv') || trimmed.includes('/pub?output=csv')) {
      return { isValid: true, csvUrl: trimmed };
    }

    // Published to Web link: /spreadsheets/d/e/2PACX-.../pubhtml or /pub
    if (trimmed.includes('/spreadsheets/d/e/')) {
      const cleanPubUrl = trimmed
        .replace(/\/pubhtml.*$/, '/pub?output=csv')
        .replace(/\/pub\?.*$/, '/pub?output=csv');
      const csvUrl = cleanPubUrl.includes('output=csv') ? cleanPubUrl : `${cleanPubUrl.replace(/\/$/, '')}/pub?output=csv`;
      return { isValid: true, csvUrl };
    }

    // Extract Spreadsheet ID: docs.google.com/spreadsheets/d/{ID}/...
    const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch || !idMatch[1]) {
      // Check if user entered just the ID
      if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
        const id = trimmed;
        return {
          isValid: true,
          spreadsheetId: id,
          gid: '0',
          csvUrl: `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=0`
        };
      }
      return { 
        isValid: false, 
        error: 'Format URL tidak valid. Harap gunakan link Google Spreadsheet (contoh: https://docs.google.com/spreadsheets/d/.../edit)' 
      };
    }

    const spreadsheetId = idMatch[1];
    
    // Extract GID if present: #gid=123 or gid=123
    let gid = '0';
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }

    // Best approach: Google Visualization API CSV output (handles CORS well for shared sheets)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

    return {
      isValid: true,
      spreadsheetId,
      gid,
      csvUrl
    };
  }

  /**
   * Normalize KTM status string into official KTMStatus enum
   */
  public normalizeStatus(raw: string): KTMStatus {
    const s = String(raw || '').toLowerCase().trim();
    if (!s) return 'Proses pembuatan';

    if (s.includes('sudah jadi') || s.includes('selesai') || s.includes('siap diambil') || s.includes('ready') || s === 'jadi') {
      return 'Sudah jadi';
    }
    if (s.includes('didistribusikan') || s.includes('sudah diambil') || s.includes('diterima') || s.includes('selesai diambil')) {
      return 'Sudah Didistribusikan';
    }
    if (s.includes('belum') && (s.includes('jadwal') || s.includes('dijadwalkan'))) {
      return 'Belum dijadwalkan';
    }
    if (s.includes('proses') || s.includes('cetak') || s.includes('pembuatan') || s.includes('bank') || s.includes('belum jadi')) {
      return 'Proses pembuatan';
    }

    return 'Proses pembuatan';
  }

  /**
   * Map raw row object into student fields
   */
  private mapRowToData(row: any) {
    const keys = Object.keys(row);
    const findVal = (terms: string[]): string => {
      for (const k of keys) {
        const lower = k.toLowerCase().trim();
        if (terms.some(t => lower.includes(t))) {
          const val = row[k];
          return val !== undefined && val !== null ? String(val).trim() : '';
        }
      }
      return '';
    };

    const nim = findVal(['nim', 'nomor induk', 'no mhs', 'no. mhs', 'id']);
    const nama = findVal(['nama mahasiswa', 'nama lengkap', 'nama']);
    const prodi = findVal(['program studi', 'prodi', 'jurusan']);
    const rawStatus = findVal(['status ktm', 'status', 'keterangan status', 'kondisi']);
    const tanggal = findVal(['tanggal distribusi', 'tanggal', 'jadwal', 'tgl']);
    const waktu = findVal(['waktu', 'sesi', 'jam', 'pukul']);
    const ruangan = findVal(['ruangan', 'lokasi', 'tempat']);
    const catatan = findVal(['catatan', 'keterangan']);

    return {
      nim: nim.replace(/[^0-9]/g, ''),
      nama: nama.toUpperCase(),
      programStudi: prodi,
      rawStatus,
      tanggalDistribusi: tanggal,
      waktu,
      ruangan,
      catatan
    };
  }

  /**
   * Fetch CSV from URL via server-side proxy route or fallback
   */
  private async fetchCsvData(url: string): Promise<string> {
    // Attempt 1: Server-side proxy route (No browser CORS or iframe restrictions)
    try {
      const serverProxyUrl = `/api/sync-sheets?url=${encodeURIComponent(url)}`;
      const response = await fetch(serverProxyUrl, { method: 'GET' });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.csv) {
          return json.csv;
        } else if (json.error) {
          throw new Error(json.error);
        }
      } else {
        const errJson = await response.json().catch(() => null);
        if (errJson && errJson.error) {
          throw new Error(errJson.error);
        }
      }
    } catch (serverErr: any) {
      if (serverErr.message && !serverErr.message.includes('Failed to fetch')) {
        throw serverErr;
      }
      console.warn('Server proxy fetch failed, trying direct browser fetch...', serverErr);
    }

    // Attempt 2: Direct browser fetch (works for published CSV links)
    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'text/csv, text/plain, */*' } });
      if (response.ok) {
        const text = await response.text();
        if (text && (text.includes(',') || text.includes('\t') || text.includes('\n'))) {
          return text;
        }
      }
    } catch (directErr) {
      console.warn('Direct Google Sheet fetch failed:', directErr);
    }

    throw new Error('Tidak dapat mengunduh data dari Google Spreadsheet. Pastikan di Google Drive: 1) Klik tombol "Bagikan", 2) Pada "Akses umum", ubah ke "Siapa saja yang memiliki link" -> "Pelihat (Viewer)". Jika akun Google Anda dikunci oleh admin kampus UPNVJ, gunakan menu File -> Bagikan -> Publikasikan ke web (CSV) atau fitur Tempel Data Spreadsheet.');
  }

  /**
   * Main sync function: Fetches spreadsheet, detects diffs, and updates student database!
   */
  public async performSync(actorUser?: UserProfile): Promise<{
    success: boolean;
    message: string;
    totalRows: number;
    updatedCount: number;
    statusChangesCount: number;
    diffs: StudentChangeDiff[];
  }> {
    if (this.isSyncing) {
      return {
        success: false,
        message: 'Proses sinkronisasi sedang berjalan.',
        totalRows: 0,
        updatedCount: 0,
        statusChangesCount: 0,
        diffs: []
      };
    }

    const { spreadsheetUrl } = this.config;
    if (!spreadsheetUrl) {
      return {
        success: false,
        message: 'URL Google Spreadsheet belum diatur. Masukkan link spreadsheet terlebih dahulu.',
        totalRows: 0,
        updatedCount: 0,
        statusChangesCount: 0,
        diffs: []
      };
    }

    const parsedInfo = this.parseGoogleSheetsUrl(spreadsheetUrl);
    if (!parsedInfo.isValid || !parsedInfo.csvUrl) {
      return {
        success: false,
        message: parsedInfo.error || 'Format URL Google Spreadsheet tidak valid.',
        totalRows: 0,
        updatedCount: 0,
        statusChangesCount: 0,
        diffs: []
      };
    }

    this.isSyncing = true;
    this.config.lastSyncStatus = 'syncing';
    this.config.lastSyncMessage = 'Sedang mengunduh dan membaca data dari Google Spreadsheet...';
    this.notify();

    try {
      // 1. Fetch CSV
      const csvText = await this.fetchCsvData(parsedInfo.csvUrl);

      // 2. Parse CSV with SheetJS
      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false });

      if (!rows || rows.length === 0) {
        throw new Error('Google Spreadsheet terbaca tetapi tidak memiliki baris data.');
      }

      // 3. Load all existing students
      const existingStudents = await studentService.getAllStudents();
      const studentMap = new Map<string, Student>();
      existingStudents.forEach(s => studentMap.set(s.nim, s));

      const diffs: StudentChangeDiff[] = [];
      let updatedCount = 0;
      let insertedCount = 0;
      let statusChangesCount = 0;
      let unchangedCount = 0;

      const now = new Date().toISOString();

      // 4. Compare row by row
      for (const row of rows) {
        const item = this.mapRowToData(row);
        if (!item.nim) continue;

        const current = studentMap.get(item.nim);
        const normalizedStatus = item.rawStatus ? this.normalizeStatus(item.rawStatus) : null;

        if (current) {
          let hasChange = false;
          const oldStatus = current.statusKTM;

          // Check if status changed (e.g. from 'Proses pembuatan' to 'Sudah jadi')
          if (normalizedStatus && normalizedStatus !== current.statusKTM) {
            hasChange = true;
            statusChangesCount++;
            diffs.push({
              nim: current.nim,
              nama: current.nama,
              field: 'status',
              oldStatus: current.statusKTM,
              newStatus: normalizedStatus,
              oldVal: current.statusKTM,
              newVal: normalizedStatus,
              timestamp: now
            });
            current.statusKTM = normalizedStatus;
            current.keterangan = normalizedStatus;
          }

          // Check if schedule date updated
          if (item.tanggalDistribusi && item.tanggalDistribusi !== current.tanggalDistribusi) {
            hasChange = true;
            diffs.push({
              nim: current.nim,
              nama: current.nama,
              field: 'tanggalDistribusi',
              oldStatus: current.statusKTM,
              newStatus: current.statusKTM,
              oldVal: current.tanggalDistribusi,
              newVal: item.tanggalDistribusi,
              timestamp: now
            });
            current.tanggalDistribusi = item.tanggalDistribusi;
          }

          // Check if session/waktu updated
          if (item.waktu && item.waktu !== current.waktuDistribusi) {
            hasChange = true;
            current.waktuDistribusi = item.waktu;
          }

          // Check if notes updated
          if (item.catatan && item.catatan !== current.catatanKhusus) {
            hasChange = true;
            current.catatanKhusus = item.catatan;
          }

          if (hasChange) {
            current.updatedAt = now;
            studentMap.set(current.nim, { ...current });
            updatedCount++;
          } else {
            unchangedCount++;
          }
        } else if (item.nama) {
          // New student added in Google Sheets
          const newNo = studentMap.size + 1;
          const assignedStatus = normalizedStatus || 'Sudah jadi';
          const newStudent: Student = {
            no: newNo,
            nim: item.nim,
            nama: item.nama,
            programStudi: item.programStudi || 'S1 Manajemen',
            jenjang: (item.programStudi && item.programStudi.startsWith('D3')) ? 'D3' : 'S1',
            statusKTM: assignedStatus,
            keterangan: assignedStatus,
            jadwal: item.tanggalDistribusi || 'Senin, 9 November 2026',
            hariDistribusi: (item.tanggalDistribusi || 'Senin').split(',')[0],
            tanggalDistribusi: item.tanggalDistribusi || 'Senin, 9 November 2026',
            waktuDistribusi: item.waktu || '09:00 s.d 16:00 WIB',
            lokasiDistribusi: item.ruangan || 'Lobby Fakultas Ekonomi dan Bisnis (FEB) Lt. 1, UPN Veteran Jakarta Kampus Pondok Labu',
            angkatan: '2026',
            syaratPengambilan: [
              'Membawa KTP Elektronik / Identitas Asli yang sah',
              'Membawa Tanda Terima Registrasi Mahasiswa Baru 2026',
              'Membawa Lembar Jadwal Distribusi KTM yang dicetak dari sistem'
            ],
            catatanKhusus: item.catatan || 'Diimpor otomatis dari Google Spreadsheet',
            updatedAt: now
          };
          studentMap.set(item.nim, newStudent);
          insertedCount++;
          diffs.push({
            nim: newStudent.nim,
            nama: newStudent.nama,
            field: 'new_student',
            oldStatus: '-',
            newStatus: newStudent.statusKTM,
            oldVal: 'Mahasiswa Baru',
            newVal: newStudent.statusKTM,
            timestamp: now
          });
        }
      }

      // 5. Commit updates to studentService
      if (updatedCount > 0 || insertedCount > 0) {
        const updatedList = Array.from(studentMap.values()).sort((a, b) => a.no - b.no);
        await studentService.importStudents(updatedList, 'sync');

        // Dispatch browser window event to trigger re-renders everywhere
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ktm_students_updated', {
            detail: {
              source: 'google_sheets_sync',
              updatedCount,
              insertedCount,
              statusChangesCount,
              diffs
            }
          }));
        }
      }

      // 6. Record audit log
      const actorName = actorUser ? actorUser.nama : 'Sistem Auto-Sync Spreadsheet';
      const actorRole = actorUser ? actorUser.role : 'super_admin';
      const actorUid = actorUser ? actorUser.uid : 'system-auto-sync';

      auditService.log({
        actorUid,
        actorName,
        actorRole,
        action: 'Sinkronisasi Google Spreadsheet',
        entityType: 'import',
        entityId: parsedInfo.spreadsheetId || 'sheets-sync',
        description: `Sinkronisasi Google Spreadsheet: ${rows.length} baris diproses, ${statusChangesCount} status KTM diperbarui, ${updatedCount} total perubahan, ${insertedCount} mahasiswa baru.`
      });

      // 7. Update local state & history
      const successMessage = updatedCount > 0 || insertedCount > 0
        ? `Sinkronisasi sukses! ${statusChangesCount} status KTM diperbarui, ${updatedCount} rekaman tersinkronisasi dari spreadsheet.`
        : `Sinkronisasi selesai. Semua ${rows.length} data mahasiswa di website sudah sama persis dengan Google Spreadsheet (tidak ada perubahan baru).`;

      const historyEntry: SyncHistoryEntry = {
        id: 'sync-' + Date.now(),
        timestamp: now,
        totalRows: rows.length,
        updatedCount,
        insertedCount,
        statusChangesCount,
        status: 'success',
        message: successMessage,
        diffs: diffs.slice(0, 50)
      };

      this.config.lastSyncTime = now;
      this.config.lastSyncStatus = 'success';
      this.config.lastSyncMessage = successMessage;
      this.config.lastSyncStats = {
        totalRows: rows.length,
        updatedCount,
        insertedCount,
        unchangedCount,
        statusChangesCount
      };
      this.config.lastChanges = diffs.slice(0, 30);
      this.config.syncHistory = [historyEntry, ...this.config.syncHistory.slice(0, 19)];
      this.saveConfig();

      return {
        success: true,
        message: successMessage,
        totalRows: rows.length,
        updatedCount,
        statusChangesCount,
        diffs
      };

    } catch (err: any) {
      const errorMsg = err.message || 'Terjadi kesalahan saat memproses sinkronisasi Google Spreadsheet.';
      const now = new Date().toISOString();

      const failedHistory: SyncHistoryEntry = {
        id: 'sync-err-' + Date.now(),
        timestamp: now,
        totalRows: 0,
        updatedCount: 0,
        insertedCount: 0,
        statusChangesCount: 0,
        status: 'error',
        message: errorMsg,
        diffs: []
      };

      this.config.lastSyncTime = now;
      this.config.lastSyncStatus = 'error';
      this.config.lastSyncMessage = errorMsg;
      this.config.syncHistory = [failedHistory, ...this.config.syncHistory.slice(0, 19)];
      this.saveConfig();

      return {
        success: false,
        message: errorMsg,
        totalRows: 0,
        updatedCount: 0,
        statusChangesCount: 0,
        diffs: []
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync directly from pasted spreadsheet text (tab-separated or comma-separated)
   * Perfect fallback if university network restricts public link sharing
   */
  public async syncFromRawText(rawText: string, actorUser?: UserProfile): Promise<{
    success: boolean;
    message: string;
    totalRows: number;
    updatedCount: number;
    statusChangesCount: number;
    diffs: StudentChangeDiff[];
  }> {
    const trimmed = rawText.trim();
    if (!trimmed) {
      return {
        success: false,
        message: 'Teks data spreadsheet tidak boleh kosong. Salin seluruh baris tabel dari Google Sheets lalu tempelkan di sini.',
        totalRows: 0,
        updatedCount: 0,
        statusChangesCount: 0,
        diffs: []
      };
    }

    try {
      const workbook = XLSX.read(trimmed, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false });

      if (!rows || rows.length === 0) {
        throw new Error('Tidak ada baris data yang terbaca dari teks yang ditempelkan.');
      }

      const existingStudents = await studentService.getAllStudents();
      const studentMap = new Map<string, Student>();
      existingStudents.forEach(s => studentMap.set(s.nim, s));

      const diffs: StudentChangeDiff[] = [];
      let updatedCount = 0;
      let insertedCount = 0;
      let statusChangesCount = 0;
      let unchangedCount = 0;
      const now = new Date().toISOString();

      for (const row of rows) {
        const item = this.mapRowToData(row);
        if (!item.nim) continue;

        const current = studentMap.get(item.nim);
        const normalizedStatus = item.rawStatus ? this.normalizeStatus(item.rawStatus) : null;

        if (current) {
          let hasChange = false;

          if (normalizedStatus && normalizedStatus !== current.statusKTM) {
            hasChange = true;
            statusChangesCount++;
            diffs.push({
              nim: current.nim,
              nama: current.nama,
              field: 'status',
              oldStatus: current.statusKTM,
              newStatus: normalizedStatus,
              oldVal: current.statusKTM,
              newVal: normalizedStatus,
              timestamp: now
            });
            current.statusKTM = normalizedStatus;
            current.keterangan = normalizedStatus;
          }

          if (item.tanggalDistribusi && item.tanggalDistribusi !== current.tanggalDistribusi) {
            hasChange = true;
            diffs.push({
              nim: current.nim,
              nama: current.nama,
              field: 'tanggalDistribusi',
              oldStatus: current.statusKTM,
              newStatus: current.statusKTM,
              oldVal: current.tanggalDistribusi,
              newVal: item.tanggalDistribusi,
              timestamp: now
            });
            current.tanggalDistribusi = item.tanggalDistribusi;
          }

          if (item.waktu && item.waktu !== current.waktuDistribusi) {
            hasChange = true;
            current.waktuDistribusi = item.waktu;
          }

          if (item.catatan && item.catatan !== current.catatanKhusus) {
            hasChange = true;
            current.catatanKhusus = item.catatan;
          }

          if (hasChange) {
            current.updatedAt = now;
            studentMap.set(current.nim, { ...current });
            updatedCount++;
          } else {
            unchangedCount++;
          }
        } else if (item.nama) {
          const newNo = studentMap.size + 1;
          const assignedStatus = normalizedStatus || 'Sudah jadi';
          const newStudent: Student = {
            no: newNo,
            nim: item.nim,
            nama: item.nama,
            programStudi: item.programStudi || 'S1 Manajemen',
            jenjang: (item.programStudi && item.programStudi.startsWith('D3')) ? 'D3' : 'S1',
            statusKTM: assignedStatus,
            keterangan: assignedStatus,
            jadwal: item.tanggalDistribusi || 'Senin, 9 November 2026',
            hariDistribusi: (item.tanggalDistribusi || 'Senin').split(',')[0],
            tanggalDistribusi: item.tanggalDistribusi || 'Senin, 9 November 2026',
            waktuDistribusi: item.waktu || '09:00 s.d 16:00 WIB',
            lokasiDistribusi: item.ruangan || 'Lobby Fakultas Ekonomi dan Bisnis (FEB) Lt. 1, UPN Veteran Jakarta Kampus Pondok Labu',
            angkatan: '2026',
            syaratPengambilan: [
              'Membawa KTP Elektronik / Identitas Asli yang sah',
              'Membawa Tanda Terima Registrasi Mahasiswa Baru 2026',
              'Membawa Lembar Jadwal Distribusi KTM yang dicetak dari sistem'
            ],
            catatanKhusus: item.catatan || 'Diimpor dari tempelan teks spreadsheet',
            updatedAt: now
          };
          studentMap.set(item.nim, newStudent);
          insertedCount++;
          diffs.push({
            nim: newStudent.nim,
            nama: newStudent.nama,
            field: 'new_student',
            oldStatus: '-',
            newStatus: newStudent.statusKTM,
            oldVal: 'Mahasiswa Baru',
            newVal: newStudent.statusKTM,
            timestamp: now
          });
        }
      }

      if (updatedCount > 0 || insertedCount > 0) {
        const updatedList = Array.from(studentMap.values()).sort((a, b) => a.no - b.no);
        await studentService.importStudents(updatedList, 'sync');

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ktm_students_updated', {
            detail: {
              source: 'raw_text_sync',
              updatedCount,
              insertedCount,
              statusChangesCount,
              diffs
            }
          }));
        }
      }

      const successMsg = `Sinkronisasi tempel data sukses! ${rows.length} baris diproses, ${statusChangesCount} status mahasiswa diperbarui, ${updatedCount} total perubahan tersimpan.`;

      const historyEntry: SyncHistoryEntry = {
        id: 'sync-paste-' + Date.now(),
        timestamp: now,
        totalRows: rows.length,
        updatedCount,
        insertedCount,
        statusChangesCount,
        status: 'success',
        message: successMsg,
        diffs: diffs.slice(0, 50)
      };

      this.config.lastSyncTime = now;
      this.config.lastSyncStatus = 'success';
      this.config.lastSyncMessage = successMsg;
      this.config.lastSyncStats = {
        totalRows: rows.length,
        updatedCount,
        insertedCount,
        unchangedCount,
        statusChangesCount
      };
      this.config.lastChanges = diffs.slice(0, 30);
      this.config.syncHistory = [historyEntry, ...this.config.syncHistory.slice(0, 19)];
      this.saveConfig();

      auditService.log({
        actorUid: actorUser?.uid || 'admin-paste',
        actorName: actorUser?.nama || 'Admin FEB',
        actorRole: actorUser?.role || 'admin',
        action: 'Sinkronisasi Tempel Spreadsheet',
        entityType: 'import',
        entityId: 'paste-sync',
        description: successMsg
      });

      return {
        success: true,
        message: successMsg,
        totalRows: rows.length,
        updatedCount,
        statusChangesCount,
        diffs
      };

    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal memproses data yang ditempel: ' + err.message,
        totalRows: 0,
        updatedCount: 0,
        statusChangesCount: 0,
        diffs: []
      };
    }
  }

  /**
   * Interactive Simulation for quick testing in UI without needing an external spreadsheet
   */
  public async simulateLiveSpreadsheetUpdate(
    mode: 'update-few' | 'update-batch-ready' | 'reset',
    actorUser?: UserProfile
  ): Promise<{ success: boolean; message: string; diffs: StudentChangeDiff[] }> {
    const existing = await studentService.getAllStudents();
    const now = new Date().toISOString();
    const diffs: StudentChangeDiff[] = [];

    if (mode === 'update-few') {
      // Find students currently in "Proses pembuatan" and change to "Sudah jadi"
      const inProcess = existing.filter(s => s.statusKTM === 'Proses pembuatan');
      const targetStudents = inProcess.slice(0, 4);

      if (targetStudents.length === 0) {
        return {
          success: false,
          message: 'Semua mahasiswa saat ini sudah berstatus "Sudah jadi" atau lainnya.',
          diffs: []
        };
      }

      for (const st of targetStudents) {
        diffs.push({
          nim: st.nim,
          nama: st.nama,
          field: 'status',
          oldStatus: st.statusKTM,
          newStatus: 'Sudah jadi',
          oldVal: st.statusKTM,
          newVal: 'Sudah jadi',
          timestamp: now
        });
        st.statusKTM = 'Sudah jadi';
        st.keterangan = 'Sudah jadi';
        st.updatedAt = now;
      }

      await studentService.importStudents(existing, 'sync');

      // Dispatch event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ktm_students_updated', {
          detail: {
            source: 'simulation_sync',
            updatedCount: targetStudents.length,
            statusChangesCount: targetStudents.length,
            diffs
          }
        }));
      }

      const msg = `Simulasi Berhasil: 4 mahasiswa (${targetStudents.map(s => s.nama.split(' ')[0]).join(', ')}) diubah statusnya menjadi "Sudah jadi" sesuai simulasi update Google Spreadsheet!`;

      this.config.lastSyncTime = now;
      this.config.lastSyncStatus = 'success';
      this.config.lastSyncMessage = msg;
      this.config.lastSyncStats = {
        totalRows: existing.length,
        updatedCount: targetStudents.length,
        insertedCount: 0,
        unchangedCount: existing.length - targetStudents.length,
        statusChangesCount: targetStudents.length
      };
      this.config.lastChanges = diffs;
      this.saveConfig();

      auditService.log({
        actorUid: actorUser?.uid || 'sim-admin',
        actorName: actorUser?.nama || 'Admin Simulasi',
        actorRole: actorUser?.role || 'admin',
        action: 'Simulasi Update Spreadsheet',
        entityType: 'import',
        entityId: 'sim-sync-01',
        description: msg
      });

      return { success: true, message: msg, diffs };
    }

    return { success: false, message: 'Mode simulasi tidak dikenali.', diffs: [] };
  }

  /**
   * Background Auto-Sync Timer setup
   */
  private initAutoSync() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.config.autoSyncEnabled && this.config.spreadsheetUrl) {
      const intervalMs = Math.max(30, this.config.syncIntervalSeconds) * 1000;
      this.timerId = window.setInterval(() => {
        // Run in background if not already syncing
        if (!this.isSyncing && this.config.spreadsheetUrl) {
          console.log('[AutoSync] Running periodic Google Sheets sync...');
          this.performSync().catch(e => console.warn('[AutoSync] periodic error:', e));
        }
      }, intervalMs);
    }
  }
}

export const googleSheetsSyncService = new GoogleSheetsSyncService();
