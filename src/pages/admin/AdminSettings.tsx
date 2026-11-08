import React, { useState } from 'react';
import { UserProfile, SiteSettings } from '../../types';
import { studentService } from '../../services/studentService';
import { auditService } from '../../services/auditService';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { 
  Settings, 
  Database, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Building, 
  Clock, 
  Phone, 
  Mail, 
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface AdminSettingsProps {
  currentUser: UserProfile;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ currentUser }) => {
  const [settings, setSettings] = useState<SiteSettings>({
    namaWebsite: 'DATA PEMBUATAN DAN PEMBAGIAN KARTU TANDA MAHASISWA BARU UPNVJ',
    namaUniversitas: 'Universitas Pembangunan Nasional "Veteran" Jakarta',
    tahunDistribusi: '2026',
    lokasiUtama: 'Lobby Gedung FEB Lantai 1, UPN Veteran Jakarta Kampus Pondok Labu, Jl. RS. Fatmawati No. 1, Jakarta Selatan 12450',
    kontakBantuan: '(021) 7656971 / Ext. 124 FEB',
    emailBantuan: 'feb@upnvj.ac.id',
    jamOperasional: 'Senin - Kamis, 09:00 s.d 16:00 WIB',
    catatanPenting: 'Wajib membawa Kartu Identitas Asli (KTP) dan Lembar Bukti Jadwal Resmi yang diunduh dari portal ini.'
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 1089 });
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Confirm Reset Modal
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);

    auditService.log({
      actorUid: currentUser.uid,
      actorName: currentUser.nama,
      actorRole: currentUser.role,
      action: 'Ubah Pengaturan Sistem',
      entityType: 'settings',
      entityId: 'global-settings',
      description: 'Menyimpan konfigurasi umum portal KTM UPNVJ 2026.'
    });
  };

  const handleSyncFirestore = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);

    try {
      const res = await studentService.seedAllToFirestore((synced, total) => {
        setSyncProgress({ current: synced, total });
      });

      if (res.success) {
        setSyncSuccess(true);
        await auditService.log({
          actorUid: currentUser.uid,
          actorName: currentUser.nama,
          actorRole: currentUser.role,
          action: 'Batch Sync Firestore',
          entityType: 'settings',
          entityId: 'batch-sync',
          description: `Melakukan batch write ${res.total} data mahasiswa ke koleksi Firestore "students".`
        });
      }
    } catch (err: any) {
      alert('Gagal melakukan sync ke Firestore: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetData = () => {
    studentService.resetToDefault();
    setConfirmResetOpen(false);
    alert('Database lokal berhasil dikembalikan ke data resmi 1.089 mahasiswa.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Pengaturan Sistem & Database Firestore
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas resmi kampus, informasi operasional, dan pemeliharaan sinkronisasi database cloud.
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Pengaturan sistem berhasil disimpan!</span>
        </div>
      )}

      {/* Grid: Settings Form & Firestore Cloud Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1 & 2: General Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-3">
            Informasi Resmi Portal KTM UPNVJ
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Sistem / Website</label>
              <input
                type="text"
                value={settings.namaWebsite}
                onChange={(e) => setSettings({ ...settings, namaWebsite: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Institusi Pendidikan</label>
                <input
                  type="text"
                  value={settings.namaUniversitas}
                  onChange={(e) => setSettings({ ...settings, namaUniversitas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran Distribusi</label>
                <input
                  type="text"
                  value={settings.tahunDistribusi}
                  onChange={(e) => setSettings({ ...settings, tahunDistribusi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Titik Lokasi Utama Penyerahan KTM</label>
              <textarea
                rows={2}
                value={settings.lokasiUtama}
                onChange={(e) => setSettings({ ...settings, lokasiUtama: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jam Operasional Layanan</label>
                <input
                  type="text"
                  value={settings.jamOperasional}
                  onChange={(e) => setSettings({ ...settings, jamOperasional: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kontak Telepon Layanan</label>
                <input
                  type="text"
                  value={settings.kontakBantuan}
                  onChange={(e) => setSettings({ ...settings, kontakBantuan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Layanan Mahasiswa</label>
              <input
                type="email"
                value={settings.emailBantuan}
                onChange={(e) => setSettings({ ...settings, emailBantuan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Catatan Penting Pengambilan</label>
              <textarea
                rows={2}
                value={settings.catatanPenting}
                onChange={(e) => setSettings({ ...settings, catatanPenting: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi Portal</span>
              </button>
            </div>
          </form>
        </div>

        {/* Col 3: Database & Firestore Cloud Maintenance */}
        <div className="space-y-6">
          
          {/* Card: Sync to Firestore */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>Sinkronisasi Cloud Firestore</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tekan tombol berikut untuk menjalankan batch upload seluruh <strong>1.089 data mahasiswa FEB 2026</strong> ke Google Cloud Firestore secara terstruktur (koleksi <code>students</code>).
            </p>

            {isSyncing && (
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Mengunggah data...</span>
                  <span className="font-mono text-emerald-700">{syncProgress.current} / {syncProgress.total}</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {syncSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Batch sync 1.089 mahasiswa ke Firestore selesai!</span>
              </div>
            )}

            <button
              onClick={handleSyncFirestore}
              disabled={isSyncing}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              type="button"
            >
              <Database className="w-4 h-4" />
              <span>{isSyncing ? 'Sedang Menyinkronkan...' : 'Sync Batch 1.089 Mahasiswa ke Firestore'}</span>
            </button>
          </div>

          {/* Card: Firestore Rules Info */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Keamanan Firestore Rules</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Aturan keamanan <code>firestore.rules</code> telah dikonfigurasi penuh untuk melindungi privasi data mahasiswa:
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1">
              <li>Mahasiswa: hanya dapat membaca dokumen NIM sendiri.</li>
              <li>Petugas: verifikasi identitas & konfirmasi serah terima.</li>
              <li>Admin: manajemen data & jadwal distribusi.</li>
              <li>Super Admin: manajemen akun petugas & hak akses.</li>
              <li>Audit Log: 100% immutable (dilarang hapus/ubah).</li>
            </ul>
          </div>

          {/* Card: Reset Database Local Cache */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-900">Reset Data ke Bawaan</h4>
            <p className="text-slate-500 text-[11px]">
              Kembalikan seluruh data mahasiswa ke dataset awal 1.089 mahasiswa dari spreadsheet resmi.
            </p>
            <button
              onClick={() => setConfirmResetOpen(true)}
              className="w-full py-2 px-3 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center justify-center gap-2"
              type="button"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Lokal</span>
            </button>
          </div>

        </div>

      </div>

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleResetData}
        title="Reset Data Mahasiswa ke Bawaan"
        message="Apakah Anda yakin ingin mengatur ulang data ke 1.089 mahasiswa awal? Perubahan lokal yang belum di-sync ke Firestore akan diatur ulang."
        variant="danger"
      />

    </div>
  );
};
