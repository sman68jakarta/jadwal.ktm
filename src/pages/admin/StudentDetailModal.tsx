import React from 'react';
import { Student } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { downloadStudentSchedulePdf } from '../../utils/pdfGenerator';
import { 
  X, 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  Award, 
  FileText, 
  Download, 
  Edit3, 
  CheckCircle,
  Copy,
  ShieldCheck
} from 'lucide-react';

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onConfirmHandover?: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  onEdit,
  onConfirmHandover
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !student) return null;

  const handleCopyNim = () => {
    navigator.clipboard.writeText(student.nim);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSudahDiambil = student.statusKTM === 'Sudah Didistribusikan';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 font-extrabold text-lg border border-white/20">
              {student.nama.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {student.nama}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-200 mt-0.5">
                <span>NIM: {student.nim}</span>
                <span>•</span>
                <span>{student.programStudi}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status & Highlight Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Status Fisik Kartu Mahasiswa
              </p>
              <div className="mt-1.5">
                <StatusBadge status={student.statusKTM} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Nomor Urut Excel
              </p>
              <p className="font-mono text-base font-black text-slate-800 mt-1">
                No. #{student.no}
              </p>
            </div>
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Box 1: Identitas */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Identitas Mahasiswa</span>
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-500 text-[11px]">NIM Mahasiswa:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 text-sm">{student.nim}</span>
                    <button
                      onClick={handleCopyNim}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold flex items-center gap-1"
                      type="button"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Program Studi:</span>
                  <p className="font-bold text-slate-900">{student.programStudi}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Jenjang & Angkatan:</span>
                  <p className="font-bold text-slate-900">{student.programStudi.startsWith('S1') ? 'Sarjana (S1)' : 'Diploma (D3)'} — 2026</p>
                </div>
              </div>
            </div>

            {/* Box 2: Jadwal & Waktu */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Jadwal Pengambilan</span>
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-500 text-[11px]">Hari & Tanggal:</span>
                  <p className="font-bold text-slate-900">{student.hariDistribusi ? `${student.hariDistribusi}, ${student.tanggalDistribusi}` : student.jadwal}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Sesi Waktu Layanan:</span>
                  <p className="font-bold text-slate-900">{student.waktuDistribusi || '09:00 s.d 16:00 WIB'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Titik Lokasi:</span>
                  <p className="font-bold text-slate-900">{student.lokasiDistribusi || 'Lobby Gedung FEB Lt. 1 Kampus Pondok Labu'}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Log Handover if already completed */}
          {student.petugasDistribusi && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Catatan Serah Terima KTM Fisik</span>
              </div>
              <p className="text-slate-700 mt-1">
                KTM fisik telah diserahkan dan diverifikasi oleh petugas: <span className="font-bold">{student.petugasDistribusi}</span>
              </p>
              {student.waktuPenerimaan && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Waktu: {new Date(student.waktuPenerimaan).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          )}

          {/* Syarat Pengambilan */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <h5 className="font-bold text-slate-800">Berkas Wajib yang Harus Ditunjukkan:</h5>
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              <li>Kartu Tanda Penduduk (e-KTP) / Identitas Asli yang sah</li>
              <li>Tanda Terima Registrasi Mahasiswa Baru UPNVJ 2026</li>
              <li>Lembar Bukti Jadwal Distribusi KTM resmi bertanda tangan</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            onClick={() => downloadStudentSchedulePdf(student)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-2xs"
            type="button"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cetak PDF Bukti</span>
          </button>

          <div className="flex items-center gap-2">
            {onConfirmHandover && !isSudahDiambil && (
              <button
                onClick={() => onConfirmHandover(student)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-colors"
                type="button"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Konfirmasi Diterima</span>
              </button>
            )}

            <button
              onClick={() => onEdit(student)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
              type="button"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors"
              type="button"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
