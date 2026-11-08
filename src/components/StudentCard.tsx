import React from 'react';
import { Student } from '../types';
import { StatusBadge } from './StatusBadge';
import { ShieldCheck, Award, QrCode, Copy, Check } from 'lucide-react';
import { UPNVJ_LOGO_SRC, UPNVJ_LOGO_FALLBACK } from '../assets/logo';

interface StudentCardProps {
  student: Student;
  onCopyNim?: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, onCopyNim }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(student.nim);
    setCopied(true);
    if (onCopyNim) onCopyNim();
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate initials for avatar
  const initials = student.nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 text-white shadow-xl border border-emerald-500/30 p-6 md:p-8">
      {/* Decorative background watermarks */}
      <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
      
      {/* Header with Logo and University Title */}
      <div className="relative flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-6">
        <div className="flex items-center gap-3.5">
          <img 
            src={UPNVJ_LOGO_SRC} 
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = UPNVJ_LOGO_FALLBACK; }}
            alt="Logo UPN Veteran Jakarta" 
            className="w-14 h-14 object-contain rounded-full shadow-md bg-white/10 p-1 backdrop-blur-xs border border-amber-400/40"
          />
          <div>
            <p className="text-[10px] tracking-widest font-semibold uppercase text-emerald-300">
              Kementerian Pendidikan Tinggi, Sains, dan Teknologi
            </p>
            <h3 className="font-extrabold text-base md:text-lg tracking-tight text-white leading-tight">
              UNIVERSITAS PEMBANGUNAN NASIONAL &quot;VETERAN&quot; JAKARTA
            </h3>
            <p className="text-xs font-medium text-amber-300 flex items-center gap-1.5 mt-0.5">
              <span>KARTU TANDA MAHASISWA BARU 2026</span>
              <span className="w-1 h-1 rounded-full bg-amber-400" />
              <span>FAKULTAS EKONOMI & BISNIS</span>
            </p>
          </div>
        </div>
        
        {/* Hologram badge simulation */}
        <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400/20 via-emerald-400/20 to-teal-300/30 border border-amber-300/40 text-amber-300 text-[10px] text-center font-bold shadow-inner">
          <Award className="w-5 h-5 text-amber-300 mb-0.5" />
          <span>RESMI</span>
        </div>
      </div>

      {/* Main Card Body */}
      <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        {/* Photo Box / Silhouette */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-32 h-40 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-emerald-400/40 shadow-inner flex flex-col items-center justify-center relative overflow-hidden group">
            {/* Holographic shimmer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-60" />
            <div className="w-16 h-16 rounded-full bg-emerald-600/40 text-emerald-200 flex items-center justify-center font-bold text-xl border border-emerald-400/30 shadow-md">
              {initials}
            </div>
            <span className="text-[10px] text-slate-300 mt-2 font-medium tracking-wide">
              MHS BARU 2026
            </span>
            <div className="absolute bottom-1 bg-emerald-950/80 px-2 py-0.5 rounded text-[9px] text-emerald-300 font-mono">
              UPNVJ-FEB
            </div>
          </div>
        </div>

        {/* Student Details */}
        <div className="md:col-span-3 space-y-3">
          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Nama Mahasiswa
            </label>
            <p className="text-xl md:text-2xl font-bold text-white tracking-wide leading-tight">
              {student.nama}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Nomor Induk Mahasiswa (NIM)
              </label>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base md:text-lg font-mono font-bold text-amber-300 tracking-wider">
                  {student.nim}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  title="Salin NIM"
                  type="button"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Tahun Angkatan
              </label>
              <p className="text-base font-semibold text-white mt-0.5">
                2026 / Semester Gasal
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Program Studi
              </label>
              <p className="text-sm font-semibold text-emerald-200">
                {student.programStudi}
              </p>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Status Fisik KTM
              </label>
              <div className="mt-1">
                <StatusBadge status={student.statusKTM} size="md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Barcode & Security Strip */}
      <div className="relative mt-6 pt-4 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>VERIFIKASI SISTEM DISTRIBUSI KTM UPNVJ 2026</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-amber-300/90 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Kartu Tanda Mahasiswa Sah & Terdaftar Resmi</span>
        </div>
      </div>
    </div>
  );
};
