import React, { useState, useEffect, useMemo } from 'react';
import { Student, UserProfile } from '../../types';
import { studentService } from '../../services/studentService';
import { auditService } from '../../services/auditService';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { 
  Activity, 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  Award, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  AlertCircle,
  FileText,
  Sparkles
} from 'lucide-react';

interface MonitoringDistributionProps {
  currentUser: UserProfile;
}

export const MonitoringDistribution: React.FC<MonitoringDistributionProps> = ({ currentUser }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchVal, setSearchVal] = useState('');
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const [recentlyHandedOver, setRecentlyHandedOver] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSession, setFilterSession] = useState('all');

  // Confirmation Modal
  const [confirmHandover, setConfirmHandover] = useState<{
    isOpen: boolean;
    student: Student | null;
  }>({
    isOpen: false,
    student: null
  });

  const loadData = async () => {
    setIsLoading(true);
    const data = await studentService.getAllStudents();
    setStudents(data);
    
    // Find students already marked as 'Sudah Didistribusikan'
    const handedOver = data.filter(s => s.statusKTM === 'Sudah Didistribusikan');
    setRecentlyHandedOver(handedOver.slice(0, 8));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick lookup when searching
  useEffect(() => {
    if (!searchVal.trim()) {
      setMatchedStudent(null);
      return;
    }
    const q = searchVal.trim().toLowerCase();
    const found = students.find(s => s.nim === q || s.nim.toLowerCase().includes(q) || s.nama.toLowerCase().includes(q));
    setMatchedStudent(found || null);
  }, [searchVal, students]);

  // Statistics calculation
  const total = students.length || 1089;
  const totalDistributed = students.filter(s => s.statusKTM === 'Sudah Didistribusikan').length;
  const totalReady = students.filter(s => s.statusKTM === 'Sudah jadi' || s.statusKTM === 'Siap Diambil').length;
  const percentDistributed = Math.round((totalDistributed / total) * 100);

  const handleConfirmHandover = async () => {
    if (!confirmHandover.student) return;

    const student = confirmHandover.student;
    const updated = await studentService.confirmKTMReceived(student.nim, currentUser.nama);

    if (updated) {
      await auditService.log({
        actorUid: currentUser.uid,
        actorName: currentUser.nama,
        actorRole: currentUser.role,
        action: 'Konfirmasi Serah Terima',
        entityType: 'status',
        entityId: student.nim,
        beforeData: student,
        afterData: updated,
        description: `KTM fisik NIM ${student.nim} (${student.nama}) berhasil diserahkan dan dikonfirmasi oleh ${currentUser.nama}.`
      });

      setRecentlyHandedOver(prev => [updated, ...prev.filter(s => s.nim !== updated.nim)].slice(0, 8));
      setMatchedStudent(updated);
      await loadData();
    }

    setConfirmHandover({ isOpen: false, student: null });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner with live status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Monitoring & Konfirmasi Distribusi KTM
            </h2>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              LIVE MEJA DISTRIBUSI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Petugas dapat memverifikasi identitas mahasiswa di lokasi dan menandai KTM telah resmi diterima.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-400 font-semibold uppercase">Petugas Bertugas:</p>
          <p className="font-extrabold text-xs text-slate-800">{currentUser.nama} ({currentUser.role})</p>
        </div>
      </div>

      {/* Progress Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">KTM Diserahkan</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700">{totalDistributed}</p>
          <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${percentDistributed}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">{percentDistributed}% dari 1.089 mahasiswa</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">KTM Siap Diambil</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-teal-700">{totalReady}</p>
          <p className="text-[11px] text-slate-500 mt-3 font-semibold">Tersedia di Meja Fakultas</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Menunggu Pengambilan</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600">{Math.max(0, total - totalDistributed)}</p>
          <p className="text-[11px] text-slate-500 mt-3 font-semibold">Mahasiswa Terjadwal</p>
        </div>
      </div>

      {/* Quick Lookup & Handover Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
            Pencarian Cepat di Meja Pengambilan (Fast Check-in)
          </h3>
          <p className="text-xs text-slate-500">
            Ketik NIM mahasiswa (10 digit) atau nama lengkap untuk memeriksa data dan melakukan konfirmasi penerimaan fisik.
          </p>
        </div>

        <div className="relative max-w-xl">
          <input
            type="text"
            placeholder="Ketik 10 digit NIM mahasiswa (contoh: 2610111002)..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:font-sans"
            autoFocus
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          {searchVal && (
            <button
              onClick={() => setSearchVal('')}
              className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        {/* Verification Result Card */}
        {matchedStudent ? (
          <div className="p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                  {matchedStudent.nama.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                    {matchedStudent.nama}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                    <span className="font-mono font-bold text-emerald-800">NIM: {matchedStudent.nim}</span>
                    <span>•</span>
                    <span>{matchedStudent.programStudi}</span>
                  </div>
                </div>
              </div>
              <div>
                <StatusBadge status={matchedStudent.statusKTM || matchedStudent.keterangan} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Jadwal Pengambilan:</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {matchedStudent.hariDistribusi ? `${matchedStudent.hariDistribusi}, ${matchedStudent.tanggalDistribusi}` : matchedStudent.jadwal}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Sesi Waktu:</span>
                <p className="font-bold text-slate-800 mt-0.5">{matchedStudent.waktuDistribusi || '09:00 - 16:00 WIB'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Titik Lokasi:</span>
                <p className="font-bold text-slate-800 mt-0.5 truncate">{matchedStudent.lokasiDistribusi || 'Lobby FEB Lt. 1'}</p>
              </div>
            </div>

            {/* Handover Action or Already Handed Over Notice */}
            {matchedStudent.statusKTM === 'Sudah Didistribusikan' ? (
              <div className="p-4 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <p className="font-extrabold">KTM Telah Resmi Diserahkan</p>
                    <p className="text-[11px] text-emerald-800">
                      Petugas: {matchedStudent.petugasDistribusi || 'Petugas Meja'} • Waktu: {matchedStudent.waktuPenerimaan ? new Date(matchedStudent.waktuPenerimaan).toLocaleString('id-ID') : 'Tercatat'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-200 text-emerald-950 rounded-lg font-bold text-[11px]">
                  Terverifikasi
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-600">
                  Pastikan mahasiswa telah menunjukkan <strong className="text-slate-800">KTP/Identitas Asli</strong> dan <strong className="text-slate-800">Lembar Bukti Jadwal</strong> sebelum menyerahkan fisik KTM.
                </p>
                <button
                  onClick={() => setConfirmHandover({ isOpen: true, student: matchedStudent })}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center gap-2 hover:scale-105"
                  type="button"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi KTM Telah Diterima</span>
                </button>
              </div>
            )}

          </div>
        ) : searchVal.trim() ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <p className="font-bold text-slate-700">Mahasiswa tidak ditemukan untuk kata kunci &quot;{searchVal}&quot;.</p>
            <p className="text-[11px] mt-0.5">Periksa kembali penulisan 10 digit NIM atau nama mahasiswa.</p>
          </div>
        ) : null}

      </div>

      {/* Recently Handed Over List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">
          Riwayat Serah Terima Terbaru (Sesi Hari Ini)
        </h3>

        {recentlyHandedOver.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            Belum ada penyerahan KTM yang dicatat pada sesi ini.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentlyHandedOver.map((s) => (
              <div key={s.nim} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{s.nama}</p>
                    <p className="text-[11px] text-slate-500">NIM: {s.nim} • {s.programStudi}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Diserahkan
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Oleh: {s.petugasDistribusi || 'Petugas'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Handover Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmHandover.isOpen}
        onClose={() => setConfirmHandover({ isOpen: false, student: null })}
        onConfirm={handleConfirmHandover}
        title="Konfirmasi Penyerahan Fisik KTM"
        message={`Apakah Anda yakin bahwa Kartu Tanda Mahasiswa (KTM) fisik atas nama ${confirmHandover.student?.nama} (NIM: ${confirmHandover.student?.nim}) telah diserahkan dan diterima oleh mahasiswa yang bersangkutan? Tindakan ini akan dicatat ke dalam audit log resmi sistem.`}
        confirmText="Ya, KTM Telah Diserahkan"
        variant="success"
      />

    </div>
  );
};
