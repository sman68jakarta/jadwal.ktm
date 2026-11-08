import React, { useState, useEffect, useMemo } from 'react';
import { Student, KTMStatus, UserProfile } from '../../types';
import { studentService } from '../../services/studentService';
import { auditService } from '../../services/auditService';
import { StatusBadge } from '../../components/StatusBadge';
import { StudentDetailModal } from './StudentDetailModal';
import { StudentFormModal } from './StudentFormModal';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  UserPlus, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckSquare, 
  Square, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface StudentManagementProps {
  currentUser: UserProfile;
  initialSearch?: string;
  onNavigateTab: (tab: string) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  currentUser,
  initialSearch = '',
  onNavigateTab
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Filters
  const [filterProdi, setFilterProdi] = useState('all');
  const [filterJenjang, setFilterJenjang] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTanggal, setFilterTanggal] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState<'no' | 'nim' | 'nama' | 'programStudi' | 'statusKTM' | 'jadwal'>('no');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection for bulk actions
  const [selectedNims, setSelectedNims] = useState<string[]>([]);

  // Modals
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  // Confirmation Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {}
  });

  // Bulk Status Modal
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<KTMStatus>('Sudah jadi');

  // Load students
  const loadStudents = async () => {
    setIsLoading(true);
    const data = await studentService.getAllStudents();
    setStudents(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Filter & Search logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchNim = student.nim.toLowerCase().includes(q);
        const matchNama = student.nama.toLowerCase().includes(q);
        const matchProdi = student.programStudi.toLowerCase().includes(q);
        if (!matchNim && !matchNama && !matchProdi) return false;
      }

      // Prodi Filter
      if (filterProdi !== 'all' && student.programStudi !== filterProdi) {
        return false;
      }

      // Jenjang Filter
      if (filterJenjang === 'S1' && !student.programStudi.startsWith('S1')) return false;
      if (filterJenjang === 'D3' && !student.programStudi.startsWith('D3')) return false;

      // Status Filter
      if (filterStatus !== 'all') {
        const s = student.statusKTM || student.keterangan;
        if (filterStatus === 'Sudah jadi' && s !== 'Sudah jadi') return false;
        if (filterStatus === 'Proses pembuatan' && s !== 'Proses pembuatan') return false;
        if (filterStatus === 'Sudah Didistribusikan' && s !== 'Sudah Didistribusikan') return false;
        if (filterStatus === 'Siap Diambil' && s !== 'Siap Diambil') return false;
      }

      // Tanggal Filter
      if (filterTanggal !== 'all') {
        const t = student.tanggalDistribusi || student.jadwal;
        if (!t.includes(filterTanggal)) return false;
      }

      return true;
    });
  }, [students, debouncedSearch, filterProdi, filterJenjang, filterStatus, filterTanggal]);

  // Sort logic
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'statusKTM') {
        valA = a.statusKTM || a.keterangan || '';
        valB = b.statusKTM || b.keterangan || '';
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [filteredStudents, sortField, sortOrder]);

  // Pagination logic
  const totalItems = sortedStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = sortedStudents.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleResetFilter = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setFilterProdi('all');
    setFilterJenjang('all');
    setFilterStatus('all');
    setFilterTanggal('all');
    setCurrentPage(1);
  };

  // Selection
  const handleSelectAllOnPage = () => {
    const pageNims = paginatedStudents.map(s => s.nim);
    const allSelected = pageNims.every(nim => selectedNims.includes(nim));

    if (allSelected) {
      setSelectedNims(prev => prev.filter(nim => !pageNims.includes(nim)));
    } else {
      setSelectedNims(prev => Array.from(new Set([...prev, ...pageNims])));
    }
  };

  const handleToggleSelectRow = (nim: string) => {
    setSelectedNims(prev => 
      prev.includes(nim) ? prev.filter(n => n !== nim) : [...prev, nim]
    );
  };

  // Delete Single Student
  const handleDeleteSingle = (student: Student) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Data Mahasiswa',
      message: `Apakah Anda yakin ingin menghapus data mahasiswa NIM ${student.nim} (${student.nama})? Tindakan ini tidak dapat dibatalkan.`,
      variant: 'danger',
      onConfirm: async () => {
        await studentService.deleteStudent(student.nim);
        await auditService.log({
          actorUid: currentUser.uid,
          actorName: currentUser.nama,
          actorRole: currentUser.role,
          action: 'Hapus Mahasiswa',
          entityType: 'student',
          entityId: student.nim,
          description: `Menghapus data mahasiswa NIM ${student.nim} (${student.nama}).`
        });
        await loadStudents();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedNims.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: `Hapus ${selectedNims.length} Mahasiswa Terpilih`,
      message: `Apakah Anda yakin ingin menghapus ${selectedNims.length} mahasiswa terpilih dari sistem? Tindakan ini akan menghapus data dari Firestore.`,
      variant: 'danger',
      onConfirm: async () => {
        await studentService.bulkDeleteStudents(selectedNims);
        await auditService.log({
          actorUid: currentUser.uid,
          actorName: currentUser.nama,
          actorRole: currentUser.role,
          action: 'Hapus Massal',
          entityType: 'student',
          entityId: 'bulk',
          description: `Menghapus ${selectedNims.length} mahasiswa terpilih secara massal.`
        });
        setSelectedNims([]);
        await loadStudents();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Bulk Status Update
  const handleBulkStatusSubmit = async () => {
    if (selectedNims.length === 0) return;
    await studentService.bulkUpdateStatus(selectedNims, bulkStatusTarget, currentUser.nama);
    await auditService.log({
      actorUid: currentUser.uid,
      actorName: currentUser.nama,
      actorRole: currentUser.role,
      action: 'Ubah Status Massal',
      entityType: 'status',
      entityId: 'bulk',
      description: `Mengubah status ${selectedNims.length} mahasiswa menjadi "${bulkStatusTarget}".`
    });
    setShowBulkStatusModal(false);
    setSelectedNims([]);
    await loadStudents();
  };

  // Export Filtered or Selected to Excel
  const handleExportExcel = (onlySelected = false) => {
    const listToExport = onlySelected 
      ? students.filter(s => selectedNims.includes(s.nim))
      : sortedStudents;

    if (listToExport.length === 0) return;

    const dataRows = listToExport.map((s, idx) => ({
      'No.': idx + 1,
      'NIM': String(s.nim),
      'NAMA': s.nama,
      'Program Studi': s.programStudi,
      'Keterangan': s.statusKTM || s.keterangan,
      'Jadwal': s.hariDistribusi ? `${s.hariDistribusi}, ${s.tanggalDistribusi}` : s.jadwal,
      'Waktu': s.waktuDistribusi || '09:00 - 16:00 WIB',
      'Lokasi': s.lokasiDistribusi || 'Lobby Gedung FEB Lt. 1'
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Distribusi KTM FEB');
    XLSX.writeFile(wb, `Data_Distribusi_KTM_UPNVJ_2026_${onlySelected ? 'Terpilih' : 'Export'}.xlsx`);
  };

  const isAllPageSelected = paginatedStudents.length > 0 && paginatedStudents.every(s => selectedNims.includes(s.nim));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Data Mahasiswa Baru FEB UPNVJ 2026
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap 1.089 mahasiswa dari spreadsheet resmi dengan pembaruan status real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportExcel(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
            type="button"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => onNavigateTab('import-export')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
            type="button"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => {
              setStudentToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            type="button"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Mahasiswa</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        
        {/* Row 1: Search and Reset */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari NIM, nama mahasiswa, atau program studi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                type="button"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">
              Ditemukan: <strong className="text-slate-900">{totalItems}</strong> mahasiswa
            </span>
            {(filterProdi !== 'all' || filterJenjang !== 'all' || filterStatus !== 'all' || filterTanggal !== 'all' || searchQuery) && (
              <button
                onClick={handleResetFilter}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                type="button"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Select Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          {/* Prodi Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Program Studi</label>
            <select
              value={filterProdi}
              onChange={(e) => { setFilterProdi(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">Semua Program Studi (6)</option>
              <option value="S1 Manajemen">S1 Manajemen (312)</option>
              <option value="S1 Akuntansi">S1 Akuntansi (313)</option>
              <option value="S1 Ekonomi Pembangunan">S1 Ekonomi Pembangunan (118)</option>
              <option value="S1 Ekonomi Syariah">S1 Ekonomi Syariah (114)</option>
              <option value="D3 Akuntansi">D3 Akuntansi (117)</option>
              <option value="D3 Perbankan dan Keuangan">D3 Perbankan (115)</option>
            </select>
          </div>

          {/* Jenjang Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Jenjang Pendidikan</label>
            <select
              value={filterJenjang}
              onChange={(e) => { setFilterJenjang(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">Semua Jenjang</option>
              <option value="S1">Sarjana (S1)</option>
              <option value="D3">Diploma Tiga (D3)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status KTM</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">Semua Status</option>
              <option value="Sudah jadi">Sudah Jadi (945)</option>
              <option value="Proses pembuatan">Proses Pembuatan (144)</option>
              <option value="Sudah Didistribusikan">Sudah Didistribusikan</option>
              <option value="Siap Diambil">Siap Diambil</option>
            </select>
          </div>

          {/* Tanggal Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Distribusi</label>
            <select
              value={filterTanggal}
              onChange={(e) => { setFilterTanggal(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">Semua Tanggal</option>
              <option value="9 November">Senin, 9 Nov 2026 (303)</option>
              <option value="10 November">Selasa, 10 Nov 2026 (190)</option>
              <option value="11 November">Rabu, 11 Nov 2026 (223)</option>
              <option value="12 November">Kamis, 12 Nov 2026 (228)</option>
              <option value="Dijadwalkan">Dijadwalkan kemudian (145)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedNims.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center text-[11px] font-black">
              {selectedNims.length}
            </span>
            <span>Mahasiswa Dipilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkStatusModal(true)}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-xs"
              type="button"
            >
              Ubah Status Massal
            </button>
            <button
              onClick={() => handleExportExcel(true)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700"
              type="button"
            >
              Export Terpilih
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-xs font-bold bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-colors"
              type="button"
            >
              Hapus Terpilih
            </button>
            <button
              onClick={() => setSelectedNims([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 font-semibold"
              type="button"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Main Student Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3 w-10 text-center">
                  <button
                    onClick={handleSelectAllOnPage}
                    className="text-slate-500 hover:text-emerald-700"
                    type="button"
                    title={isAllPageSelected ? 'Batalkan pilihan halaman ini' : 'Pilih semua di halaman ini'}
                  >
                    {isAllPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-3 w-14 cursor-pointer hover:text-slate-900" onClick={() => handleSort('no')}>
                  <div className="flex items-center gap-1">
                    <span>No</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('nim')}>
                  <div className="flex items-center gap-1">
                    <span>NIM</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('nama')}>
                  <div className="flex items-center gap-1">
                    <span>Nama Mahasiswa</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('programStudi')}>
                  <div className="flex items-center gap-1">
                    <span>Program Studi</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('statusKTM')}>
                  <div className="flex items-center gap-1">
                    <span>Status KTM</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('jadwal')}>
                  <div className="flex items-center gap-1">
                    <span>Jadwal Distribusi</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                      <span>Memuat data 1.089 mahasiswa...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">Tidak ada mahasiswa yang sesuai kriteria pencarian.</p>
                    <button
                      onClick={handleResetFilter}
                      className="mt-2 text-xs text-emerald-700 font-bold hover:underline"
                      type="button"
                    >
                      Reset Filter
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const isSelected = selectedNims.includes(student.nim);
                  return (
                    <tr
                      key={student.nim}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-emerald-50/50' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleSelectRow(student.nim)}
                          type="button"
                          className="text-slate-500 hover:text-emerald-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        #{student.no}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {student.nim}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {student.nama}
                      </td>
                      <td className="p-3 text-slate-700">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${student.programStudi.startsWith('S1') ? 'bg-emerald-50 text-emerald-800' : 'bg-teal-50 text-teal-800'}`}>
                          {student.programStudi}
                        </span>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={student.statusKTM || student.keterangan} />
                      </td>
                      <td className="p-3 text-slate-700">
                        <p className="font-medium text-slate-800 leading-tight">
                          {student.hariDistribusi ? `${student.hariDistribusi}, ${student.tanggalDistribusi}` : student.jadwal}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {student.waktuDistribusi || '09:00 - 16:00 WIB'}
                        </p>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedStudentForDetail(student)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Lihat Detail Mahasiswa"
                            type="button"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setStudentToEdit(student);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit Data Mahasiswa"
                            type="button"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(student)}
                            className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Mahasiswa"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Results info bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-600">
              Menampilkan <strong>{Math.min(startIndex + 1, totalItems)}</strong>–<strong>{Math.min(startIndex + pageSize, totalItems)}</strong> dari <strong>{totalItems}</strong> mahasiswa
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600">Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-semibold"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-1 font-bold text-slate-800">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Modal Detail Mahasiswa */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        isOpen={!!selectedStudentForDetail}
        onClose={() => setSelectedStudentForDetail(null)}
        onEdit={(student) => {
          setSelectedStudentForDetail(null);
          setStudentToEdit(student);
          setIsFormModalOpen(true);
        }}
        onConfirmHandover={async (student) => {
          await studentService.confirmKTMReceived(student.nim, currentUser.nama);
          await auditService.log({
            actorUid: currentUser.uid,
            actorName: currentUser.nama,
            actorRole: currentUser.role,
            action: 'Konfirmasi Serah Terima',
            entityType: 'status',
            entityId: student.nim,
            description: `KTM diserahkan kepada mahasiswa NIM ${student.nim} (${student.nama}) oleh ${currentUser.nama}.`
          });
          await loadStudents();
          setSelectedStudentForDetail(null);
        }}
      />

      {/* Modal Form Tambah / Edit */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setStudentToEdit(null);
        }}
        onSaved={async () => {
          await loadStudents();
        }}
        studentToEdit={studentToEdit}
        currentUser={currentUser}
      />

      {/* Modal Ubah Status Massal */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Ubah Status {selectedNims.length} Mahasiswa Terpilih
            </h3>
            <p className="text-xs text-slate-600">
              Pilih status baru yang akan diterapkan pada seluruh mahasiswa yang dicentang:
            </p>
            <select
              value={bulkStatusTarget}
              onChange={(e) => setBulkStatusTarget(e.target.value as KTMStatus)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="Sudah jadi">Sudah jadi (Siap diambil)</option>
              <option value="Proses pembuatan">Proses pembuatan (Percetakan bank)</option>
              <option value="Siap Diambil">Siap Diambil</option>
              <option value="Sudah Didistribusikan">Sudah Didistribusikan (Telah Diterima)</option>
              <option value="Belum dijadwalkan">Belum dijadwalkan</option>
            </select>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowBulkStatusModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
                type="button"
              >
                Batal
              </button>
              <button
                onClick={handleBulkStatusSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                type="button"
              >
                Terapkan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />

    </div>
  );
};
