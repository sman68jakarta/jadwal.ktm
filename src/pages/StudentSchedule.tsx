import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  ShieldCheck,
  Building,
  User,
  Share2
} from 'lucide-react';
import { Student, UserProfile } from '../types';
import { studentService } from '../services/studentService';
import { StatusBadge } from '../components/StatusBadge';
import { downloadStudentSchedulePdf } from '../utils/pdfGenerator';

interface StudentScheduleProps {
  currentUser: UserProfile;
  onBackToDashboard: () => void;
}

export const StudentSchedule: React.FC<StudentScheduleProps> = ({
  currentUser,
  onBackToDashboard
}) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (currentUser.nim) {
        const data = await studentService.getStudentByNim(currentUser.nim);
        setStudent(data);
      }
      setLoading(false);
    }
    loadData();
  }, [currentUser.nim]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-slate-500">Data jadwal tidak ditemukan.</p>
        <button
          onClick={onBackToDashboard}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const isSudahJadi = student.statusKTM === 'Sudah jadi';
  const isJadwalDitentukan = student.jadwal && !student.jadwal.toLowerCase().includes('dijadwalkan kemudian');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-6">
      
      {/* Back button */}
      <div>
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Mahasiswa</span>
        </button>
      </div>

      {/* Main Schedule Container */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 md:p-8 text-white relative">
          <div className="max-w-2xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-white/10 px-2.5 py-1 rounded-full border border-amber-400/30">
              JADWAL PRIBADI MAHASISWA BARU
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Jadwal Distribusi KTM: {student.nama}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200 font-mono">
              NIM: {student.nim} • {student.programStudi} • Angkatan {student.angkatan}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <StatusBadge status={student.statusKTM} size="lg" />
            <span className="text-xs text-emerald-100 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              No. Urut Database: #{student.no}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Schedule Highlight Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-800">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase mb-2">
                <Calendar className="w-4 h-4" />
                <span>Hari & Tanggal</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900">
                {student.jadwal}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {isJadwalDitentukan ? 'Sesuai agenda resmi FEB' : 'Menunggu penjadwalan susulan'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-slate-800">
              <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase mb-2">
                <Clock className="w-4 h-4" />
                <span>Waktu Layanan</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 font-mono">
                {student.waktuDistribusi}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Harap hadir 15 menit sebelum sesi berakhir
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase mb-2">
                <MapPin className="w-4 h-4" />
                <span>Titik Lokasi</span>
              </div>
              <p className="text-sm font-bold text-slate-900 leading-tight">
                Gedung FEB Lt. 1
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Kampus Pondok Labu, Jl. RS. Fatmawati
              </p>
            </div>

          </div>

          {/* Detailed Timeline View */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Alur Saat Tiba di Lokasi Pengambilan
            </h3>

            <div className="relative pl-6 border-l-2 border-emerald-500 space-y-6 text-xs text-slate-600">
              
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-emerald-200" />
                <h4 className="font-bold text-sm text-slate-900">1. Meja Registrasi & Cek Dokumen</h4>
                <p className="mt-1">
                  Tunjukkan cetakan lembar Bukti Jadwal KTM ini bersama identitas diri asli (KTP/KK) dan Bukti Registrasi Mahasiswa Baru 2026.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-teal-600 border-2 border-white ring-2 ring-teal-200" />
                <h4 className="font-bold text-sm text-slate-900">2. Verifikasi Data Mahasiswa & Tanda Tangan</h4>
                <p className="mt-1">
                  Petugas kemahasiswaan akan memverifikasi nomor urut #{student.no} dan mencocokkan identitas pada daftar penerima resmi. Mahasiswa menandatangani bukti terima.
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-white ring-2 ring-amber-200" />
                <h4 className="font-bold text-sm text-slate-900">3. Penyerahan Fisik KTM & Buku Rekening</h4>
                <p className="mt-1">
                  KTM resmi UPN Veteran Jakarta diserahkan kepada Anda lengkap dengan paket mahasiswa baru (buku tabungan / ATM bila terintegrasi bank kampus).
                </p>
              </div>

            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Jadwal ini bersifat pribadi untuk NIM {student.nim}</span>
            </div>

            <button
              onClick={() => downloadStudentSchedulePdf(student)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              type="button"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Formulir Bukti Jadwal (PDF)</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
