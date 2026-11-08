import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Calendar, 
  Tag, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { Announcement, UserProfile } from '../types';
import { announcementService } from '../services/announcementService';
import { Modal } from '../components/Modal';

interface AnnouncementsPageProps {
  currentUser: UserProfile | null;
}

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ currentUser }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modal State for Admin Creation / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('jadwal');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  const [isActive, setIsActive] = useState(true);

  const isAdmin = currentUser?.role === 'admin';

  const loadAnnouncements = async () => {
    setLoading(true);
    const data = await announcementService.getAll();
    setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('jadwal');
    setPriority('normal');
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setCategory(ann.category);
    setPriority(ann.priority || 'normal');
    setIsActive(ann.isActive);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    await announcementService.deleteAnnouncement(id);
    await loadAnnouncements();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    await announcementService.saveAnnouncement({
      id: editingId || undefined,
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      isActive,
      date: new Date().toISOString().split('T')[0],
      author: currentUser?.nama || 'Petugas FEB UPNVJ'
    });

    setModalOpen(false);
    await loadAnnouncements();
  };

  const filtered = announcements.filter(a => {
    if (!isAdmin && !a.isActive) return false;
    if (filterCategory !== 'ALL' && a.category !== filterCategory) return false;
    return true;
  });

  const getCategoryBadge = (cat: string) => {
    const configMap: Record<string, { label: string; bg: string }> = {
      jadwal: { label: 'Jadwal & Waktu', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
      syarat: { label: 'Persyaratan', bg: 'bg-teal-50 text-teal-800 border-teal-200' },
      lokasi: { label: 'Titik Lokasi', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
      penting: { label: 'Pemberitahuan Penting', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
      informasi: { label: 'Informasi Umum', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
      perubahan: { label: 'Perubahan Jadwal', bg: 'bg-orange-50 text-orange-800 border-orange-200' },
      administrasi: { label: 'Administrasi', bg: 'bg-purple-50 text-purple-800 border-purple-200' }
    };

    const cfg = configMap[cat] || { label: cat.toUpperCase(), bg: 'bg-slate-50 text-slate-800 border-slate-200' };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <Bell className="w-3.5 h-3.5 text-teal-600" />
            <span>Papan Pengumuman Resmi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pengumuman Distribusi KTM 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Informasi terkini mengenai jadwal, regulasi, dan petunjuk teknis pengambilan KTM FEB UPNVJ.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengumuman</span>
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'Semua Kategori' },
          { id: 'jadwal', label: 'Jadwal & Waktu' },
          { id: 'syarat', label: 'Persyaratan' },
          { id: 'lokasi', label: 'Titik Lokasi' },
          { id: 'penting', label: 'Penting' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterCategory === cat.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
            type="button"
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Info className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-bold text-slate-700">Belum ada pengumuman pada kategori ini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(ann => (
            <div 
              key={ann.id}
              className={`bg-white rounded-2xl p-6 border shadow-2xs hover:shadow-sm transition-all space-y-3 ${
                ann.priority === 'high' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(ann.category)}
                  {ann.priority === 'high' && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      PENTING
                    </span>
                  )}
                  {!ann.isActive && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      DRAF (NON-AKTIF)
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {ann.date}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {ann.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Diterbitkan oleh: {ann.author || 'Biro Kemahasiswaan FEB UPNVJ'}</span>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(ann)}
                      className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50"
                      title="Edit pengumuman"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                      title="Hapus pengumuman"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Announcement */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Judul Pengumuman</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Perubahan Lokasi Distribusi Hari Rabu..."
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="jadwal">Jadwal & Waktu</option>
                <option value="syarat">Persyaratan</option>
                <option value="lokasi">Titik Lokasi</option>
                <option value="penting">Penting</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                <option value="normal">Normal</option>
                <option value="high">Tinggi (Highlight)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Isi Lengkap Pengumuman</label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan rincian pengumuman resmi..."
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-normal leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300"
            />
            <label htmlFor="isActiveCheck" className="text-slate-700 font-semibold cursor-pointer">
              Publikasikan pengumuman ini (Aktif terlihat oleh mahasiswa)
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Simpan Pengumuman
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
