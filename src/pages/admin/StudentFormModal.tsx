import React, { useState, useEffect } from 'react';
import { Student, KTMStatus, UserProfile } from '../../types';
import { studentService } from '../../services/studentService';
import { auditService } from '../../services/auditService';
import { X, Save, UserPlus, Edit, AlertCircle } from 'lucide-react';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedStudent: Student) => void;
  studentToEdit?: Student | null;
  currentUser: UserProfile;
}

const PROGRAM_STUDI_LIST = [
  'S1 Manajemen',
  'S1 Akuntansi',
  'S1 Ekonomi Pembangunan',
  'S1 Ekonomi Syariah',
  'D3 Akuntansi',
  'D3 Perbankan dan Keuangan'
];

const STATUS_LIST: KTMStatus[] = [
  'Sudah jadi',
  'Proses pembuatan',
  'Belum dijadwalkan',
  'Siap Diambil',
  'Sudah Didistribusikan'
];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  studentToEdit,
  currentUser
}) => {
  const isEditing = !!studentToEdit;

  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [programStudi, setProgramStudi] = useState(PROGRAM_STUDI_LIST[0]);
  const [statusKTM, setStatusKTM] = useState<KTMStatus>('Sudah jadi');
  const [hariDistribusi, setHariDistribusi] = useState('Senin');
  const [tanggalDistribusi, setTanggalDistribusi] = useState('9 November 2026');
  const [waktuDistribusi, setWaktuDistribusi] = useState('09:00 s.d 16:00 WIB');
  const [lokasiDistribusi, setLokasiDistribusi] = useState('Lobby Gedung FEB Lt. 1 Kampus Pondok Labu');
  const [catatanKhusus, setCatatanKhusus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (studentToEdit) {
      setNim(studentToEdit.nim);
      setNama(studentToEdit.nama);
      setProgramStudi(studentToEdit.programStudi);
      setStatusKTM(studentToEdit.statusKTM || studentToEdit.keterangan || 'Sudah jadi');
      setHariDistribusi(studentToEdit.hariDistribusi || 'Senin');
      setTanggalDistribusi(studentToEdit.tanggalDistribusi || '9 November 2026');
      setWaktuDistribusi(studentToEdit.waktuDistribusi || '09:00 s.d 16:00 WIB');
      setLokasiDistribusi(studentToEdit.lokasiDistribusi || 'Lobby Gedung FEB Lt. 1 Kampus Pondok Labu');
      setCatatanKhusus(studentToEdit.catatanKhusus || '');
      setErrorMsg('');
    } else {
      setNim('');
      setNama('');
      setProgramStudi(PROGRAM_STUDI_LIST[0]);
      setStatusKTM('Sudah jadi');
      setHariDistribusi('Senin');
      setTanggalDistribusi('9 November 2026');
      setWaktuDistribusi('09:00 s.d 16:00 WIB');
      setLokasiDistribusi('Lobby Gedung FEB Lt. 1 Kampus Pondok Labu');
      setCatatanKhusus('');
      setErrorMsg('');
    }
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nim.trim()) {
      setErrorMsg('NIM wajib diisi.');
      return;
    }
    if (!/^\d{8,14}$/.test(nim.trim())) {
      setErrorMsg('NIM harus berupa angka (contoh: 2610111002).');
      return;
    }
    if (!nama.trim()) {
      setErrorMsg('Nama mahasiswa wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && studentToEdit) {
        // Edit Mode
        const updates: Partial<Student> = {
          nama: nama.trim().toUpperCase(),
          programStudi,
          statusKTM,
          keterangan: statusKTM,
          jadwal: `${hariDistribusi}, ${tanggalDistribusi}`,
          hariDistribusi,
          tanggalDistribusi,
          waktuDistribusi,
          lokasiDistribusi,
          catatanKhusus: catatanKhusus.trim()
        };

        await studentService.updateStudent(studentToEdit.nim, updates);

        const updatedStudent: Student = {
          ...studentToEdit,
          ...updates
        };

        // Audit log
        await auditService.log({
          actorUid: currentUser.uid,
          actorName: currentUser.nama,
          actorRole: currentUser.role,
          action: 'Edit Data Mahasiswa',
          entityType: 'student',
          entityId: studentToEdit.nim,
          beforeData: studentToEdit,
          afterData: updatedStudent,
          description: `Memperbarui data mahasiswa NIM ${studentToEdit.nim} (${updatedStudent.nama}).`
        });

        onSaved(updatedStudent);
      } else {
        // Add Mode
        const newStudentData: Omit<Student, 'no'> = {
          nim: nim.trim(),
          nama: nama.trim().toUpperCase(),
          programStudi,
          statusKTM,
          keterangan: statusKTM,
          jadwal: `${hariDistribusi}, ${tanggalDistribusi}`,
          hariDistribusi,
          tanggalDistribusi,
          waktuDistribusi,
          lokasiDistribusi,
          angkatan: '2026',
          syaratPengambilan: [
            'Kartu Identitas Diri Asli (KTP / KK / SIM / Paspor)',
            'Bukti Registrasi Mahasiswa Baru UPNVJ 2026',
            'Lembar Jadwal Distribusi KTM resmi'
          ],
          catatanKhusus: catatanKhusus.trim()
        };

        const added = await studentService.addStudent(newStudentData);

        // Audit log
        await auditService.log({
          actorUid: currentUser.uid,
          actorName: currentUser.nama,
          actorRole: currentUser.role,
          action: 'Tambah Mahasiswa',
          entityType: 'student',
          entityId: added.nim,
          afterData: added,
          description: `Menambahkan mahasiswa baru NIM ${added.nim} (${added.nama}) - ${added.programStudi}.`
        });

        onSaved(added);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data mahasiswa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300">
              {isEditing ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                {isEditing ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}
              </h3>
              <p className="text-xs text-emerald-200">
                {isEditing ? `Mengubah data untuk NIM ${studentToEdit?.nim}` : 'Pencatatan mahasiswa baru ke database Firestore'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor Induk Mahasiswa (NIM) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={isEditing}
                placeholder="Contoh: 2610111002"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border font-mono ${isEditing ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600'}`}
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Format: 10 digit string numerik</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Program Studi <span className="text-red-500">*</span>
              </label>
              <select
                value={programStudi}
                onChange={(e) => setProgramStudi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {PROGRAM_STUDI_LIST.map((prodi) => (
                  <option key={prodi} value={prodi}>{prodi}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap Mahasiswa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: AULIA RIFINA GANI"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 uppercase font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Status Pembuatan KTM
              </label>
              <select
                value={statusKTM}
                onChange={(e) => setStatusKTM(e.target.value as KTMStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
              >
                {STATUS_LIST.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Hari Distribusi
              </label>
              <select
                value={hariDistribusi}
                onChange={(e) => setHariDistribusi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Dijadwalkan kemudian">Dijadwalkan kemudian</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal Distribusi
              </label>
              <input
                type="text"
                placeholder="Contoh: 9 November 2026"
                value={tanggalDistribusi}
                onChange={(e) => setTanggalDistribusi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Sesi Waktu Layanan
              </label>
              <input
                type="text"
                placeholder="Contoh: 09:00 s.d 16:00 WIB"
                value={waktuDistribusi}
                onChange={(e) => setWaktuDistribusi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Titik Lokasi Pengambilan
            </label>
            <input
              type="text"
              placeholder="Contoh: Lobby Gedung FEB Lt. 1 Kampus Pondok Labu"
              value={lokasiDistribusi}
              onChange={(e) => setLokasiDistribusi(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan Khusus (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan untuk mahasiswa..."
              value={catatanKhusus}
              onChange={(e) => setCatatanKhusus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambahkan Mahasiswa'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
