import React, { useEffect, useState } from 'react';
import { UserProfile, Student, AuditLog } from '../../types';
import { studentService } from '../../services/studentService';
import { auditService } from '../../services/auditService';
import { googleSheetsSyncService, GoogleSheetsConfig } from '../../services/googleSheetsSyncService';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  FileSpreadsheet, 
  Bell, 
  Search,
  Building,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface AdminOverviewProps {
  currentUser: UserProfile;
  onNavigateTab: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  currentUser,
  onNavigateTab
}) => {
  const [stats, setStats] = useState(() => studentService.getStatistics());
  const [students, setStudents] = useState<Student[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(googleSheetsSyncService.getConfig());
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  const reloadOverviewData = async () => {
    const allStudents = await studentService.getAllStudents();
    setStudents(allStudents);
    setStats(studentService.getStatistics());
    const logs = await auditService.getAuditLogs(6);
    setRecentLogs(logs);
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await reloadOverviewData();
      setIsLoading(false);
    }
    loadData();

    // Listen to Google Sheets sync events
    const unsubSheets = googleSheetsSyncService.subscribe((cfg) => {
      setSheetsConfig(cfg);
    });

    const handleKtmUpdated = () => {
      reloadOverviewData();
    };

    window.addEventListener('ktm_students_updated', handleKtmUpdated);

    return () => {
      unsubSheets();
      window.removeEventListener('ktm_students_updated', handleKtmUpdated);
    };
  }, []);

  const handleSyncNow = async () => {
    if (isSyncingSheets) return;
    setIsSyncingSheets(true);
    try {
      await googleSheetsSyncService.performSync(currentUser);
      await reloadOverviewData();
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const totalSudahDiambil = students.filter(s => s.statusKTM === 'Sudah Didistribusikan').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner with dynamic greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/30">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-amber-300 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sistem Terintegrasi Firebase Firestore FEB 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Selamat datang, {currentUser.nama}!
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau dan kelola proses pembuatan serta distribusi Kartu Tanda Mahasiswa (KTM) Baru Angkatan 2026 Fakultas Ekonomi dan Bisnis secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('monitoring')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105"
              type="button"
            >
              <Activity className="w-4 h-4 text-slate-900" />
              <span>Monitoring Live</span>
            </button>
            <button
              onClick={() => onNavigateTab('students')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all border border-white/20"
              type="button"
            >
              <Users className="w-4 h-4 text-emerald-300" />
              <span>Kelola Mahasiswa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheets Real-Time Sync Status Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Sinkronisasi Google Spreadsheet:
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                sheetsConfig.spreadsheetUrl
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sheetsConfig.spreadsheetUrl ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
                {sheetsConfig.spreadsheetUrl ? 'Otomatis Terhubung' : 'Link Belum Dikonfigurasi'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {sheetsConfig.spreadsheetUrl ? (
                <span>
                  {sheetsConfig.lastSyncTime ? (
                    <>Terakhir disinkronkan: <strong className="text-slate-700">{new Date(sheetsConfig.lastSyncTime).toLocaleTimeString('id-ID')}</strong> ({sheetsConfig.lastSyncMessage || 'Data web telah sesuai spreadsheet'})</>
                  ) : (
                    'Link tersimpan. Menunggu sinkronisasi berkala...'
                  )}
                </span>
              ) : (
                'Masukkan link Google Spreadsheet di Admin Panel agar status KTM mahasiswa baru otomatis terupdate saat spreadsheet diedit.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {sheetsConfig.spreadsheetUrl && (
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncingSheets}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-all active:scale-98 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'Mensinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('import-export')}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <span>{sheetsConfig.spreadsheetUrl ? 'Pengaturan Spreadsheet' : 'Atur Link Spreadsheet →'}</span>
          </button>
        </div>
      </div>

      {/* 6 Key Statistical Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Card 1: Total Mahasiswa */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Mahasiswa</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {stats.totalStudents.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            6 Program Studi FEB
          </p>
        </div>

        {/* Card 2: KTM Sudah Jadi */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">KTM Sudah Jadi</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 tracking-tight">
            {stats.totalSudahJadi.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            {stats.percentageSudahJadi}% Siap Didistribusi
          </p>
        </div>

        {/* Card 3: KTM Dalam Proses */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Dalam Proses</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-teal-700 tracking-tight">
            {stats.totalProses.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-teal-700 font-semibold mt-1">
            {Math.round((stats.totalProses / (stats.totalStudents || 1)) * 100)}% Percetakan Bank
          </p>
        </div>

        {/* Card 4: Belum Dijadwalkan */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Susulan</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 tracking-tight">
            {stats.totalBelumDijadwalkan.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">
            Jadwal Menyusul
          </p>
        </div>

        {/* Card 5: Distribusi Selesai */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sudah Diambil</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 tracking-tight">
            {totalSudahDiambil}
          </p>
          <p className="text-[11px] text-blue-700 font-semibold mt-1">
            Telah Diterima Mhs
          </p>
        </div>

        {/* Card 6: Periode Distribusi */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Periode FEB</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 tracking-tight">
            4 Hari
          </p>
          <p className="text-[11px] text-purple-700 font-semibold mt-1">
            9 - 12 Nov 2026
          </p>
        </div>

      </div>

      {/* Main Charts & Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1 & 2: Program Studi Breakdown & Daily Quotas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Distribusi Program Studi */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Distribusi Mahasiswa per Program Studi
                </h3>
                <p className="text-xs text-slate-600">
                  Total 1.089 mahasiswa Fakultas Ekonomi dan Bisnis (S1 & D3)
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Data Riil Excel
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {Object.entries(stats.prodiBreakdown).map(([prodi, info]) => {
                const count = info.total;
                const percentage = Math.round((count / (stats.totalStudents || 1)) * 100);
                const isS1 = prodi.startsWith('S1');
                return (
                  <div key={prodi} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isS1 ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'}`}>
                          {isS1 ? 'S1' : 'D3'}
                        </span>
                        <span className="font-bold text-slate-800">{prodi}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-semibold">{count} Mahasiswa</span>
                        <span className="text-slate-600 font-mono text-[11px]">({percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isS1 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-teal-500 to-teal-600'}`}
                        style={{ width: `${(count / 320) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Kuota Distribusi Harian */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mb-1">
              Jadwal & Kuota Distribusi Harian FEB 2026
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Pembagian alur pengambilan KTM per sesi di Lobby Gedung FEB Lt. 1
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Hari 1
                </span>
                <h4 className="font-bold text-xs text-slate-800 mt-2">Senin, 9 Nov 2026</h4>
                <p className="text-xl font-black text-emerald-700 mt-1">303 <span className="text-xs font-normal text-slate-600">mhs</span></p>
                <p className="text-[10px] text-slate-600 mt-1">S1 Manajemen & D3 Akuntansi</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Hari 2
                </span>
                <h4 className="font-bold text-xs text-slate-800 mt-2">Selasa, 10 Nov 2026</h4>
                <p className="text-xl font-black text-emerald-700 mt-1">190 <span className="text-xs font-normal text-slate-600">mhs</span></p>
                <p className="text-[10px] text-slate-600 mt-1">S1 Akuntansi & Ek. Syariah</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Hari 3
                </span>
                <h4 className="font-bold text-xs text-slate-800 mt-2">Rabu, 11 Nov 2026</h4>
                <p className="text-xl font-black text-emerald-700 mt-1">223 <span className="text-xs font-normal text-slate-600">mhs</span></p>
                <p className="text-[10px] text-slate-600 mt-1">Ek. Pembangunan & D3 Perbankan</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Hari 4
                </span>
                <h4 className="font-bold text-xs text-slate-800 mt-2">Kamis, 12 Nov 2026</h4>
                <p className="text-xl font-black text-emerald-700 mt-1">228 <span className="text-xs font-normal text-slate-600">mhs</span></p>
                <p className="text-[10px] text-slate-600 mt-1">Reguler Seluruh Prodi</p>
              </div>
            </div>
          </div>

        </div>

        {/* Col 3: Status Ring & Recent Activity Log */}
        <div className="space-y-6">
          
          {/* Card: Status Ring & S1 vs D3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Proporsi Status Pembuatan KTM
            </h3>

            {/* Visual Progress Bar Multi-Segment */}
            <div className="space-y-2">
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100">
                <div 
                  className="bg-emerald-600 h-full" 
                  style={{ width: `${stats.percentageSudahJadi}%` }}
                  title={`Sudah Jadi: ${stats.totalSudahJadi}`}
                />
                <div 
                  className="bg-teal-500 h-full" 
                  style={{ width: `${Math.round((stats.totalProses / (stats.totalStudents || 1)) * 100)}%` }}
                  title={`Proses: ${stats.totalProses}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>Sudah Jadi</span>
                  </div>
                  <p className="text-lg font-black text-emerald-950 mt-1">
                    {stats.totalSudahJadi} <span className="text-xs font-normal text-emerald-800">({stats.percentageSudahJadi}%)</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span>Proses Cetak</span>
                  </div>
                  <p className="text-lg font-black text-teal-950 mt-1">
                    {stats.totalProses} <span className="text-xs font-normal text-teal-800">({Math.round((stats.totalProses / (stats.totalStudents || 1)) * 100)}%)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* S1 vs D3 Summary */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Perbandingan Jenjang</h4>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                <span className="text-slate-600">Jenjang Sarjana (S1)</span>
                <span className="font-bold text-slate-900">857 Mahasiswa (78.7%)</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-600">Jenjang Diploma Tiga (D3)</span>
                <span className="font-bold text-slate-900">232 Mahasiswa (21.3%)</span>
              </div>
            </div>
          </div>

          {/* Card: Recent Audit Activities */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Aktivitas Audit Terbaru
              </h3>
              <button
                onClick={() => onNavigateTab('audit-logs')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                type="button"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-2">
                    {log.description}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Oleh: <span className="font-semibold text-slate-700">{log.actorName}</span> ({log.actorRole})
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
