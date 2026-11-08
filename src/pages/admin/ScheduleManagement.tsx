import React, { useState, useEffect } from 'react';
import { ScheduleItem, UserProfile } from '../../types';
import { scheduleService } from '../../services/scheduleService';
import { auditService } from '../../services/auditService';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  X,
  Save,
  Building
} from 'lucide-react';

interface ScheduleManagementProps {
  currentUser: UserProfile;
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ currentUser }) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  // Form Fields
  const [namaJadwal, setNamaJadwal] = useState('');
  const [hari, setHari] = useState('Senin');
  const [tanggal, setTanggal] = useState('2026-11-09');
  const [waktuMulai, setWaktuMulai] = useState('09:00');
  const [waktuSelesai, setWaktuSelesai] = useState('16:00');
  const [lokasi, setLokasi] = useState('Gedung FEB Lantai 1, UPN Veteran Jakarta Kampus Pondok Labu');
  const [kelompok, setKelompok] = useState('Kelompok A');
  const [keterangan, setKeterangan] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Aktif' | 'Selesai' | 'Dibatalkan'>('Aktif');
  const [totalMahasiswa, setTotalMahasiswa] = useState(300);

  // Delete Confirmation
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    scheduleId: string;
    scheduleName: string;
  }>({
    isOpen: false,
    scheduleId: '',
    scheduleName: ''
  });

  const loadSchedules = async () => {
    setIsLoading(true);
    const data = await scheduleService.getSchedules();
    setSchedules(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setNamaJadwal('');
    setHari('Senin');
    setTanggal('2026-11-09');
    setWaktuMulai('09:00');
    setWaktuSelesai('16:00');
    setLokasi('Gedung FEB Lantai 1, UPN Veteran Jakarta Kampus Pondok Labu');
    setKelompok('Kelompok A');
    setKeterangan('');
    setStatus('Aktif');
    setTotalMahasiswa(100);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch: ScheduleItem) => {
    setEditingSchedule(sch);
    setNamaJadwal(sch.namaJadwal);
    setHari(sch.hari);
    setTanggal(sch.tanggal);
    setWaktuMulai(sch.waktuMulai);
    setWaktuSelesai(sch.waktuSelesai);
    setLokasi(sch.lokasi);
    setKelompok(sch.kelompok);
    setKeterangan(sch.keterangan);
    setStatus(sch.status);
    setTotalMahasiswa(sch.totalMahasiswa || 0);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaJadwal.trim()) return;

    if (editingSchedule) {
      await scheduleService.updateSchedule(editingSchedule.id, {
        namaJadwal: namaJadwal.trim(),
        hari,
        tanggal,
        waktuMulai,
        waktuSelesai,
        lokasi,
        kelompok,
        keterangan: keterangan.trim(),
        status,
        totalMahasiswa
      });

      await auditService.log({
        actorUid: currentUser.uid,
        actorName: currentUser.nama,
        actorRole: currentUser.role,
        action: 'Edit Jadwal Distribusi',
        entityType: 'schedule',
        entityId: editingSchedule.id,
        description: `Memperbarui jadwal "${namaJadwal}" (${hari}, ${tanggal}).`
      });
    } else {
      await scheduleService.addSchedule({
        namaJadwal: namaJadwal.trim(),
        hari,
        tanggal,
        waktuMulai,
        waktuSelesai,
        lokasi,
        programStudi: ['Fakultas Ekonomi dan Bisnis'],
        kelompok,
        keterangan: keterangan.trim(),
        status,
        totalMahasiswa
      });

      await auditService.log({
        actorUid: currentUser.uid,
        actorName: currentUser.nama,
        actorRole: currentUser.role,
        action: 'Buat Jadwal Baru',
        entityType: 'schedule',
        entityId: 'new',
        description: `Menambahkan sesi distribusi baru "${namaJadwal}".`
      });
    }

    setIsModalOpen(false);
    await loadSchedules();
  };

  const handleDelete = async () => {
    await scheduleService.deleteSchedule(confirmDelete.scheduleId);
    await auditService.log({
      actorUid: currentUser.uid,
      actorName: currentUser.nama,
      actorRole: currentUser.role,
      action: 'Hapus Jadwal',
      entityType: 'schedule',
      entityId: confirmDelete.scheduleId,
      description: `Menghapus jadwal distribusi "${confirmDelete.scheduleName}".`
    });
    setConfirmDelete({ isOpen: false, scheduleId: '', scheduleName: '' });
    await loadSchedules();
  };

  const getStatusBadge = (st: ScheduleItem['status']) => {
    switch (st) {
      case 'Aktif':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">Aktif</span>;
      case 'Draft':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">Draft</span>;
      case 'Selesai':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">Selesai</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800">Dibatalkan</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Pengelolaan Jadwal Distribusi KTM FEB 2026
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur hari, tanggal, sesi waktu operasional, dan lokasi pengambilan kartu bagi mahasiswa.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          type="button"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Jadwal Baru</span>
        </button>
      </div>

      {/* Grid of Schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((sch) => (
          <div
            key={sch.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-800">{sch.kelompok}</span>
                    <span>•</span>
                    {getStatusBadge(sch.status)}
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm mt-1">
                    {sch.namaJadwal}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(sch)}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit Jadwal"
                    type="button"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ isOpen: true, scheduleId: sch.id, scheduleName: sch.namaJadwal })}
                    className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Jadwal"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                <div className="space-y-1">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hari & Tanggal</span>
                  </span>
                  <p className="font-bold text-slate-800">{sch.hari}, {sch.tanggal}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sesi Waktu</span>
                  </span>
                  <p className="font-bold text-slate-800">{sch.waktuMulai} - {sch.waktuSelesai} WIB</p>
                </div>
              </div>

              <div className="text-xs space-y-1 mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lokasi Penyerahan</span>
                </span>
                <p className="text-slate-700 leading-snug">{sch.lokasi}</p>
              </div>

              {sch.keterangan && (
                <p className="text-[11px] text-slate-500 italic mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {sch.keterangan}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Kuota Terdaftar:</span>
              </span>
              <span className="font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {sch.totalMahasiswa} Mahasiswa
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form Tambah / Edit Jadwal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white">
              <h3 className="font-extrabold text-base">
                {editingSchedule ? 'Edit Jadwal Distribusi' : 'Buat Sesi Distribusi Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Sesi Jadwal</label>
                <input
                  type="text"
                  placeholder="Contoh: Sesi 1: FEB S1 Manajemen & D3 Akuntansi"
                  value={namaJadwal}
                  onChange={(e) => setNamaJadwal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={hari}
                    onChange={(e) => setHari(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD atau teks"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai</label>
                  <input
                    type="text"
                    value={waktuMulai}
                    onChange={(e) => setWaktuMulai(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Selesai</label>
                  <input
                    type="text"
                    value={waktuSelesai}
                    onChange={(e) => setWaktuSelesai(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelompok</label>
                  <input
                    type="text"
                    value={kelompok}
                    onChange={(e) => setKelompok(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Sesi</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Draft">Draft</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Titik Lokasi</label>
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, scheduleId: '', scheduleName: '' })}
        onConfirm={handleDelete}
        title="Hapus Jadwal Distribusi"
        message={`Apakah Anda yakin ingin menghapus jadwal "${confirmDelete.scheduleName}"?`}
        variant="danger"
      />

    </div>
  );
};
