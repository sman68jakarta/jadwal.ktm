import React, { useState, useEffect } from 'react';
import { Announcement, UserProfile } from '../../types';
import { announcementService } from '../../services/announcementService';
import { auditService } from '../../services/auditService';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { 
  Bell, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Save, 
  Eye, 
  Tag, 
  Calendar 
} from 'lucide-react';

interface AnnouncementManagementProps {
  currentUser: UserProfile;
}

export const AnnouncementManagement: React.FC<AnnouncementManagementProps> = ({ currentUser }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('jadwal');
  const [targetAudience, setTargetAudience] = useState<'all' | 'S1' | 'D3'>('all');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');
  const [isActive, setIsActive] = useState(true);

  // Confirm Delete
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
  }>({
    isOpen: false,
    id: '',
    title: ''
  });

  const loadAnnouncements = async () => {
    setIsLoading(true);
    const data = await announcementService.getAnnouncements();
    setAnnouncements(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setContent('');
    setCategory('jadwal');
    setTargetAudience('all');
    setPriority('normal');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Announcement) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setTargetAudience((item.targetAudience as any) || 'all');
    setPriority(item.priority || 'normal');
    setIsActive(item.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingItem) {
      await announcementService.updateAnnouncement(editingItem.id, {
        title: title.trim(),
        content: content.trim(),
        category,
        targetAudience,
        priority,
        isActive
      });

      await auditService.log({
        actorUid: currentUser.uid,
        actorName: currentUser.nama,
        actorRole: currentUser.role,
        action: 'Edit Pengumuman',
        entityType: 'announcement',
        entityId: editingItem.id,
        description: `Mengubah pengumuman: "${title}".`
      });
    } else {
      await announcementService.addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        category,
        targetAudience,
        priority,
        isActive,
        author: currentUser.nama,
        date: new Date().toISOString().split('T')[0]
      });

      await auditService.log({
        actorUid: currentUser.uid,
        actorName: currentUser.nama,
        actorRole: currentUser.role,
        action: 'Buat Pengumuman',
        entityType: 'announcement',
        entityId: 'new',
        description: `Menerbitkan pengumuman baru: "${title}".`
      });
    }

    setIsModalOpen(false);
    await loadAnnouncements();
  };

  const handleDelete = async () => {
    await announcementService.deleteAnnouncement(confirmDelete.id);
    await auditService.log({
      actorUid: currentUser.uid,
      actorName: currentUser.nama,
      actorRole: currentUser.role,
      action: 'Hapus Pengumuman',
      entityType: 'announcement',
      entityId: confirmDelete.id,
      description: `Menghapus pengumuman "${confirmDelete.title}".`
    });
    setConfirmDelete({ isOpen: false, id: '', title: '' });
    await loadAnnouncements();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Pengelolaan Papan Pengumuman FEB 2026
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Publikasikan informasi resmi, jadwal susulan, dan tata tertib pengambilan KTM yang tampil di website mahasiswa.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          type="button"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengumuman Baru</span>
        </button>
      </div>

      {/* List of Announcements */}
      <div className="space-y-3">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {item.category.toUpperCase()}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {item.date}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isActive ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>
                  {item.isActive ? 'Dipublikasikan' : 'Draft / Nonaktif'}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {item.content}
              </p>
              {item.author && (
                <p className="text-[10px] text-slate-400">
                  Oleh: {item.author}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenEdit(item)}
                className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                title="Edit Pengumuman"
                type="button"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmDelete({ isOpen: true, id: item.id, title: item.title })}
                className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                title="Hapus Pengumuman"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white">
              <h3 className="font-extrabold text-base">
                {editingItem ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
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
                <label className="block font-bold text-slate-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  placeholder="Contoh: Jadwal Distribusi KTM Baru FEB 2026..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="jadwal">Jadwal</option>
                    <option value="perubahan">Perubahan Jadwal</option>
                    <option value="informasi">Informasi</option>
                    <option value="penting">Penting / Darurat</option>
                    <option value="administrasi">Administrasi</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">Penting (Highlight Merah)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Pesan Pengumuman</label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan detail pengumuman secara lengkap dan jelas..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-slate-800 cursor-pointer">
                  Publikasikan langsung ke Dashboard Mahasiswa
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
                  <span>Simpan Pengumuman</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: '', title: '' })}
        onConfirm={handleDelete}
        title="Hapus Pengumuman"
        message={`Apakah Anda yakin ingin menghapus pengumuman "${confirmDelete.title}"?`}
        variant="danger"
      />

    </div>
  );
};
