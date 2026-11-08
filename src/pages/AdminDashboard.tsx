import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Database, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  FileSpreadsheet, 
  Save, 
  BarChart3,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Student, KTMStatus, UserProfile } from '../types';
import { studentService } from '../services/studentService';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { filterAndSearchStudents, calculateStudentStatistics } from '../utils/studentLogic';

interface AdminDashboardProps {
  currentUser: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedJadwal, setSelectedJadwal] = useState('ALL');
  const [sortField, setSortField] = useState<'no' | 'nim' | 'nama' | 'programStudi' | 'statusKTM' | 'jadwal'>('no');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'students' | 'statistics' | 'sync'>('students');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStatus, setEditStatus] = useState<KTMStatus>('Sudah jadi');
  const [editJadwal, setEditJadwal] = useState('');
  const [editWaktu, setEditWaktu] = useState('');
  const [editLokasi, setEditLokasi] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importedPreview, setImportedPreview] = useState<Student[]>([]);
  const [importMode, setImportMode] = useState<'sync' | 'update' | 'add'>('sync');
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore Seed State
  const [seedingProgress, setSeedingProgress] = useState<{ synced: number; total: number } | null>(null);
  const [seedingSuccess, setSeedingSuccess] = useState<string | null>(null);

  // Load students
  const loadData = async () => {
    setLoading(true);
    const data = await studentService.getAllStudents();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and pagination
  const filteredResult = useMemo(() => {
    return filterAndSearchStudents(students, {
      search,
      prodi: selectedProdi,
      status: selectedStatus,
      jadwal: selectedJadwal,
      sortField,
      sortOrder,
      page,
      pageSize
    });
  }, [students, search, selectedProdi, selectedStatus, selectedJadwal, sortField, sortOrder, page, pageSize]);

  // Overall Statistics
  const stats = useMemo(() => {
    return calculateStudentStatistics(students);
  }, [students]);

  // Unique lists for dropdowns
  const prodiList = useMemo(() => {
    const set = new Set(students.map(s => s.programStudi).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  const jadwalList = useMemo(() => {
    const set = new Set(students.map(s => s.jadwal).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  // Sort toggle handler
  const handleSortToggle = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditStatus(student.statusKTM);
    setEditJadwal(student.jadwal);
    setEditWaktu(student.waktuDistribusi);
    setEditLokasi(student.lokasiDistribusi);
    setEditModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditSaving(true);

    let hari = editJadwal;
    let tgl = editJadwal;
    if (editJadwal.includes(',')) {
      const parts = editJadwal.split(',');
      hari = parts[0].trim();
      tgl = parts[1].trim();
    }

    const updates: Partial<Student> = {
      statusKTM: editStatus,
      keterangan: editStatus,
      jadwal: editJadwal,
      hariDistribusi: hari,
      tanggalDistribusi: tgl,
      waktuDistribusi: editWaktu,
      lokasiDistribusi: editLokasi
    };

    await studentService.updateStudent(editingStudent.nim, updates);
    setEditSaving(false);
    setEditModalOpen(false);
    await loadData();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const headers = [
      ['No.', 'NIM', 'NAMA', 'Program Studi', 'Keterangan', 'Jadwal', 'Waktu', 'Lokasi']
    ];
    const rows = students.map(s => [
      s.no,
      s.nim,
      s.nama,
      s.programStudi,
      s.statusKTM,
      s.jadwal,
      s.waktuDistribusi,
      s.lokasiDistribusi
    ]);
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FEB 2026');
    XLSX.writeFile(wb, `DATA_DISTRIBUSI_KTM_UPNVJ_FEB_2026_${Date.now()}.xlsx`);
  };

  // Handle Excel File Selected for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawJson.length < 2) {
          alert('File Excel kosong atau format tidak sesuai.');
          return;
        }

        // Header check
        const parsed: Student[] = [];
        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;
          
          const rawNim = String(row[1] || '').trim();
          const rawNama = String(row[2] || '').trim();
          if (!rawNim || !rawNama) continue;

          parsed.push({
            no: parseInt(row[0], 10) || i,
            nim: rawNim,
            nama: rawNama,
            programStudi: String(row[3] || 'S1 Manajemen').trim(),
            keterangan: (String(row[4] || 'Sudah jadi').trim() as KTMStatus),
            statusKTM: (String(row[4] || 'Sudah jadi').trim() as KTMStatus),
            jadwal: String(row[5] || 'Dijadwalkan kemudian').trim(),
            hariDistribusi: String(row[5] || '').split(',')[0]?.trim() || '',
            tanggalDistribusi: String(row[5] || '').split(',')[1]?.trim() || '',
            waktuDistribusi: String(row[6] || '09:00 s.d 16:00 WIB').trim(),
            lokasiDistribusi: String(row[7] || 'Gedung FEB Lt. 1 Kampus Pondok Labu').trim(),
            angkatan: '2026',
            syaratPengambilan: []
          });
        }

        setImportedPreview(parsed);
        setImportSummary(null);
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan format spreadsheet valid.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Commit Import
  const handleCommitImport = async () => {
    if (importedPreview.length === 0) return;
    setImportProgress({ current: 0, total: importedPreview.length });
    
    const result = await studentService.importStudents(
      importedPreview,
      importMode,
      (current, total) => setImportProgress({ current, total })
    );

    setImportProgress(null);
    setImportSummary(`Import selesai! Berhasil: ${result.inserted} data baru ditambahkan, ${result.updated} data diperbarui, ${result.duplicates} duplikat diabaikan.`);
    setImportedPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await loadData();
  };

  // Sync / Seed all to Firestore
  const handleSeedToFirestore = async () => {
    if (!confirm('Apakah Anda ingin menyinkronkan seluruh 1.089 data mahasiswa ini langsung ke koleksi Firestore database?')) {
      return;
    }
    setSeedingSuccess(null);
    setSeedingProgress({ synced: 0, total: students.length });

    try {
      const res = await studentService.seedAllToFirestore((synced, total) => {
        setSeedingProgress({ synced, total });
      });
      setSeedingSuccess(`Berhasil menyinkronkan seluruh ${res.total} data mahasiswa ke koleksi Firestore "students"!`);
    } catch (e: any) {
      alert('Kendala sinkronisasi Firestore: ' + (e?.message || e));
    } finally {
      setSeedingProgress(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Hak Akses: Administrator & Petugas FEB UPNVJ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Portal Administrasi Distribusi KTM 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Kelola data 1.089 mahasiswa baru FEB, verifikasi status fisik, update jadwal, import Excel, dan sinkronisasi Firestore.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            type="button"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            type="button"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleSeedToFirestore}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            type="button"
            title="Batch write seluruh data ke database Firestore"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sync ke Firestore</span>
          </button>
        </div>
      </div>

      {/* Seeding Alert Notification */}
      {seedingProgress && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
              Menyinkronkan data mahasiswa ke Cloud Firestore...
            </span>
            <span>{seedingProgress.synced} / {seedingProgress.total} Data</span>
          </div>
          <div className="w-full bg-teal-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-teal-600 h-2 transition-all duration-300"
              style={{ width: `${(seedingProgress.synced / seedingProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {seedingSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{seedingSuccess}</span>
          </div>
          <button 
            onClick={() => setSeedingSuccess(null)}
            className="p-1 hover:bg-emerald-100 rounded-md text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs (Data Mahasiswa | Statistik Distribusi) */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          type="button"
        >
          <Users className="w-4 h-4" />
          <span>Data Mahasiswa ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('statistics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'statistics'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          type="button"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Statistik & Visualisasi</span>
        </button>
      </div>

      {/* TAB 1: DATA MAHASISWA & MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          
          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
            
            {/* Search Input Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari berdasarkan NIM, nama mahasiswa, atau program studi..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              
              {/* Program Studi */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Program Studi
                </label>
                <select
                  value={selectedProdi}
                  onChange={(e) => {
                    setSelectedProdi(e.target.value);
                    setPage(1);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 font-medium focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="ALL">Semua Program Studi (6 Prodi)</option>
                  {prodiList.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Status KTM */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Status Fisik KTM
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 font-medium focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Sudah jadi">Sudah jadi (945)</option>
                  <option value="Proses pembuatan">Proses pembuatan (144)</option>
                </select>
              </div>

              {/* Jadwal Distribusi */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Hari & Tanggal
                </label>
                <select
                  value={selectedJadwal}
                  onChange={(e) => {
                    setSelectedJadwal(e.target.value);
                    setPage(1);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 font-medium focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="ALL">Semua Jadwal Distribusi</option>
                  {jadwalList.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              {/* Reset filter button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedProdi('ALL');
                    setSelectedStatus('ALL');
                    setSelectedJadwal('ALL');
                    setPage(1);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              </div>

            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <p>
                Menampilkan <strong className="text-slate-800">{filteredResult.data.length}</strong> dari total <strong className="text-slate-800">{filteredResult.total}</strong> mahasiswa sesuai filter
              </p>
              <p className="font-mono text-[11px]">
                Halaman {filteredResult.page} dari {filteredResult.totalPages}
              </p>
            </div>

          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                    <th 
                      onClick={() => handleSortToggle('no')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-16"
                    >
                      <div className="flex items-center gap-1">
                        <span>No.</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSortToggle('nim')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-32"
                    >
                      <div className="flex items-center gap-1">
                        <span>NIM</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSortToggle('nama')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Nama Mahasiswa</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSortToggle('programStudi')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Program Studi</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSortToggle('statusKTM')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Status Pembuatan</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSortToggle('jadwal')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Jadwal Distribusi</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4 w-28">Waktu</th>
                    <th className="py-3 px-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredResult.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">Tidak ada data mahasiswa yang sesuai.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau reset filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredResult.data.map(student => (
                      <tr 
                        key={student.nim} 
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3 px-4 font-mono text-slate-500 font-medium">
                          {student.no}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {student.nim}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {student.nama}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {student.programStudi}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={student.statusKTM} size="sm" />
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {student.jadwal}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                          {student.waktuDistribusi}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                            title="Edit Status / Jadwal Mahasiswa"
                            type="button"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {filteredResult.data.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600 text-xs">Data tidak ditemukan</p>
              </div>
            ) : (
              filteredResult.data.map(student => (
                <div 
                  key={student.nim}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">#{student.no}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{student.nama}</h4>
                      <p className="font-mono text-emerald-700 font-bold">{student.nim}</p>
                    </div>
                    <button
                      onClick={() => handleOpenEdit(student)}
                      className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-600">{student.programStudi}</span>
                    <StatusBadge status={student.statusKTM} size="sm" />
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] space-y-0.5">
                    <p className="font-semibold text-slate-800">{student.jadwal}</p>
                    <p className="font-mono text-slate-500">{student.waktuDistribusi}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {filteredResult.totalPages > 1 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <p className="text-slate-500">
                Halaman {filteredResult.page} dari {filteredResult.totalPages} (Total {filteredResult.total} Mahasiswa)
              </p>
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={filteredResult.page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Jump indicator */}
                <span className="px-3 py-1 font-mono font-bold text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
                  {filteredResult.page}
                </span>

                <button
                  type="button"
                  disabled={filteredResult.page >= filteredResult.totalPages}
                  onClick={() => setPage(p => Math.min(filteredResult.totalPages, p + 1))}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: STATISTIK & VISUALISASI */}
      {activeTab === 'statistics' && (
        <div className="space-y-8">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Mahasiswa</p>
              <p className="text-3xl font-extrabold text-slate-900 font-mono mt-1">{stats.totalStudents}</p>
              <p className="text-xs text-slate-500 mt-1">100% Terdaftar di FEB 2026</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">KTM Sudah Jadi</p>
              <p className="text-3xl font-extrabold text-emerald-700 font-mono mt-1">{stats.totalSudahJadi}</p>
              <p className="text-xs text-emerald-600 mt-1">{stats.percentageSudahJadi}% dari total cetak</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-teal-200 bg-teal-50/30 shadow-2xs">
              <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Proses Pembuatan</p>
              <p className="text-3xl font-extrabold text-teal-700 font-mono mt-1">{stats.totalProses}</p>
              <p className="text-xs text-teal-600 mt-1">Tahap finalisasi bank</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-2xs">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Belum Dijadwalkan</p>
              <p className="text-3xl font-extrabold text-amber-700 font-mono mt-1">{stats.totalBelumDijadwalkan}</p>
              <p className="text-xs text-amber-700 mt-1">Menunggu distribusi susulan</p>
            </div>
          </div>

          {/* Breakdown by Program Studi */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Distribusi Mahasiswa Berdasarkan Program Studi</span>
            </h3>

            <div className="space-y-3 pt-2">
              {Object.entries(stats.prodiBreakdown).map(([prodi, val]) => {
                const percent = Math.round((val.total / stats.totalStudents) * 100);
                return (
                  <div key={prodi} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{prodi}</span>
                      <span className="text-slate-500 font-mono">
                        {val.total} Mahasiswa ({percent}%) • Sudah jadi: {val.sudahJadi} • Proses: {val.proses}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                      <div 
                        className="bg-emerald-600 h-2.5" 
                        style={{ width: `${(val.sudahJadi / val.total) * 100}%` }}
                        title={`Sudah jadi: ${val.sudahJadi}`}
                      />
                      <div 
                        className="bg-teal-400 h-2.5" 
                        style={{ width: `${(val.proses / val.total) * 100}%` }}
                        title={`Proses: ${val.proses}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown by Jadwal */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Volume Distribusi Berdasarkan Tanggal</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
              {Object.entries(stats.jadwalBreakdown).map(([jadwal, count]) => (
                <div key={jadwal} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {jadwal.includes(',') ? jadwal.split(',')[0] : 'Status'}
                  </span>
                  <p className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                    {jadwal}
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-800 font-mono mt-2">
                    {count} <span className="text-xs font-normal text-slate-500">Mhs</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Data Mahasiswa: ${editingStudent?.nama || ''}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">NIM (Tidak dapat diubah)</label>
            <input 
              type="text" 
              value={editingStudent?.nim || ''} 
              disabled 
              className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 font-mono text-slate-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Status Fisik KTM</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as KTMStatus)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-semibold"
            >
              <option value="Sudah jadi">Sudah jadi</option>
              <option value="Proses pembuatan">Proses pembuatan</option>
              <option value="Belum dijadwalkan">Belum dijadwalkan</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Jadwal Pengambilan (Hari, Tanggal)</label>
            <input 
              type="text" 
              value={editJadwal} 
              onChange={(e) => setEditJadwal(e.target.value)}
              placeholder="Contoh: Senin, 9 November 2026 atau Dijadwalkan kemudian"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Waktu / Sesi Layanan</label>
            <input 
              type="text" 
              value={editWaktu} 
              onChange={(e) => setEditWaktu(e.target.value)}
              placeholder="Contoh: 09:00 s.d 16:00 WIB"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Lokasi Pengambilan</label>
            <input 
              type="text" 
              value={editLokasi} 
              onChange={(e) => setEditLokasi(e.target.value)}
              placeholder="Contoh: Gedung FEB Lt. 1 Kampus Pondok Labu"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* IMPORT EXCEL MODAL */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setImportedPreview([]);
          setImportSummary(null);
        }}
        title="Import Data Distribusi Mahasiswa dari Excel"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Unggah file spreadsheet <code>.xlsx</code> dengan kolom: <strong>No., NIM, NAMA, Program Studi, Keterangan, Jadwal, Waktu</strong>.
          </p>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50">
            <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <input
              type="file"
              accept=".xlsx, .xls"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              id="excel-file-upload"
            />
            <label
              htmlFor="excel-file-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer text-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Pilih File Excel</span>
            </label>
            <p className="text-[11px] text-slate-600 mt-2">
              Dukungan file: .xlsx, .xls (Format Sheet FEB)
            </p>
          </div>

          {importSummary && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              {importSummary}
            </div>
          )}

          {importedPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Pratinjau Data: {importedPreview.length} Mahasiswa Siap Diimpor
                </span>
                
                {/* Mode Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-slate-500">Mode Sinkronisasi:</label>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as any)}
                    className="p-1.5 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="sync">Sinkronisasi NIM (Update + Insert)</option>
                    <option value="update">Hanya Perbarui Data Lama</option>
                    <option value="add">Hanya Tambah Data Baru</option>
                  </select>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2">NIM</th>
                      <th className="p-2">Nama</th>
                      <th className="p-2">Prodi</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Jadwal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importedPreview.slice(0, 10).map((p, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono font-bold">{p.nim}</td>
                        <td className="p-2">{p.nama}</td>
                        <td className="p-2">{p.programStudi}</td>
                        <td className="p-2">{p.statusKTM}</td>
                        <td className="p-2">{p.jadwal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importedPreview.length > 10 && (
                <p className="text-[11px] text-slate-400 italic text-right">
                  ...dan {importedPreview.length - 10} data lainnya
                </p>
              )}

              {importProgress && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-teal-700">
                    Menyimpan ke database: {importProgress.current} / {importProgress.total}...
                  </p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-1.5" 
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportedPreview([])}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={!!importProgress}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Jalankan Proses Import</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
