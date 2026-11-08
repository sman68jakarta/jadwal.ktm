import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  FileCheck, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  FileText,
  Printer,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Student, UserProfile, Announcement } from '../types';
import { studentService } from '../services/studentService';
import { announcementService } from '../services/announcementService';
import { StatusBadge } from '../components/StatusBadge';
import { StudentCard } from '../components/StudentCard';
import { downloadStudentSchedulePdf } from '../utils/pdfGenerator';

interface StudentDashboardProps {
  currentUser: UserProfile;
  onNavigateSchedule: () => void;
  onNavigateAnnouncements: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onNavigateSchedule,
  onNavigateAnnouncements
}) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [copiedNim, setCopiedNim] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (currentUser.nim) {
        const data = await studentService.getStudentByNim(currentUser.nim);
        setStudent(data);
        if (data?.statusKTM === 'Sudah jadi') {
          // Trigger celebratory confetti
          try {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.6 }
            });
          } catch {
            // ignore
          }
        }
      }
      const anns = await announcementService.getAll();
      setAnnouncements(anns.slice(0, 3));
      setLoading(false);
    }
    loadData();
  }, [currentUser.nim]);

  const handleDownloadPdf = () => {
    if (student) {
      downloadStudentSchedulePdf(student);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
          <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
            <div className="h-40 bg-slate-200 rounded-2xl" />
            <div className="h-40 bg-slate-200 rounded-2xl" />
            <div className="h-40 bg-slate-200 rounded-2xl" />
            <div className="h-40 bg-slate-200 rounded-2xl" />
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">
            Data Mahasiswa Belum Ditemukan
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            NIM {currentUser.nim} tidak ditemukan dalam database distribusi. Silakan hubungi loket akademik FEB UPNVJ atau hubungi administrator sistem.
          </p>
        </div>
      </div>
    );
  }

  const isSudahJadi = student.statusKTM === 'Sudah jadi';
  const isJadwalDitentukan = student.jadwal && !student.jadwal.toLowerCase().includes('dijadwalkan kemudian');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      
      {/* Top Header as specified in Master Prompt */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Portal Mahasiswa Baru FEB 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Selamat Datang, {student.nama}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Berikut informasi pembuatan dan distribusi KTM Anda.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all"
            type="button"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Bukti Jadwal (PDF)</span>
          </button>
        </div>
      </div>

      {/* 4 MANDATORY CARDS (Section 4 of Master Prompt) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KARTU 1: Identitas Mahasiswa */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Kartu 1: Identitas
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>
            
            <h3 className="font-bold text-base text-slate-900 leading-tight">
              {student.nama}
            </h3>
            
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">NIM</span>
                <span className="font-mono font-bold text-slate-800">{student.nim}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Program Studi</span>
                <span className="font-semibold text-emerald-700 text-right">{student.programStudi}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Tahun Angkatan</span>
                <span className="font-semibold text-slate-800">{student.angkatan}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data Terverifikasi Resmi</span>
          </div>
        </div>

        {/* KARTU 2: Status Pembuatan KTM */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Kartu 2: Status KTM
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="mb-2">
              <StatusBadge status={student.statusKTM} size="lg" />
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {isSudahJadi 
                ? 'KTM fisik Anda telah selesai dicetak oleh bank mitra dan dapat diambil pada jadwal yang telah ditetapkan.' 
                : 'KTM Anda saat ini masih dalam proses pencetakan fisik dan personalisasi data kartu.'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-500 font-medium">
            {isSudahJadi ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Siap didistribusikan
              </span>
            ) : (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Menunggu finalisasi bank
              </span>
            )}
          </div>
        </div>

        {/* KARTU 3: Jadwal Distribusi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Kartu 3: Jadwal
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            {isJadwalDitentukan ? (
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Hari & Tanggal</span>
                  <p className="text-sm font-extrabold text-slate-900">
                    {student.jadwal}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Sesi Waktu Layanan</span>
                  <p className="text-xs font-bold text-emerald-700 font-mono">
                    {student.waktuDistribusi}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <p className="font-bold">Dijadwalkan Kemudian</p>
                <p className="text-[11px] text-amber-800 mt-1">
                  Jadwal distribusi KTM Anda belum ditentukan. Silakan periksa kembali secara berkala.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Sesuai Jam Operasional FEB</span>
          </div>
        </div>

        {/* KARTU 4: Informasi Pengambilan KTM */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Kartu 4: Lokasi & Ambil
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>

            {student.lokasiDistribusi ? (
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Titik Lokasi</span>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  {student.lokasiDistribusi}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ruang Distribusi Kemahasiswaan & Perbankan Mitra
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Informasi lokasi pengambilan KTM akan diumumkan lebih lanjut.
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3">
            <button
              onClick={onNavigateSchedule}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              type="button"
            >
              <span>Lihat Rincian Jadwal Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Section: Digital Student Card & Verification Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Digital KTM Card Display */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Kartu Identitas Mahasiswa Digital
              </h2>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Pratinjau Resmi
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              FEB-2026
            </span>
          </div>

          <StudentCard 
            student={student} 
            onCopyNim={() => setCopiedNim(true)}
          />

          {/* Quick PDF & Print CTA Banner */}
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  Unduh Lembar Bukti Jadwal Resmi
                </p>
                <p className="text-xs text-slate-600">
                  Wajib dicetak dan ditunjukkan kepada petugas verifikasi saat pengambilan fisik KTM.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-2 shadow-xs"
              type="button"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Right: Persyaratan & Pengumuman Aktif */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Checklist Berkas */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-100 pb-3">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>Berkas Wajib Dibawa Saat Pengambilan</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  ✓
                </div>
                <span><strong>Lembar Bukti Jadwal KTM</strong> yang diunduh dari portal ini (format PDF dicetak).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  ✓
                </div>
                <span><strong>Kartu Identitas Asli</strong> (e-KTP / KK / SIM / Paspor yang berlaku).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  ✓
                </div>
                <span><strong>Bukti Registrasi Mahasiswa Baru 2026</strong> (Slip UKT / Registrasi Resmi).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  !
                </div>
                <span><strong>Surat Kuasa bermaterai Rp10.000</strong> (hanya bila diwakilkan karena alasan darurat).</span>
              </li>
            </ul>
          </div>

          {/* Pengumuman Terkini */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <Info className="w-5 h-5 text-teal-600" />
                <span>Pengumuman Terkait</span>
              </div>
              <button
                onClick={onNavigateAnnouncements}
                className="text-xs font-bold text-teal-700 hover:text-teal-800"
                type="button"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-3">
              {announcements.map(ann => (
                <div 
                  key={ann.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 line-clamp-1">{ann.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{ann.date}</span>
                  </div>
                  <p className="text-slate-500 line-clamp-2 leading-relaxed">
                    {ann.content}
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
