import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import { authService } from '../../services/authService';
import { auditService } from '../../services/auditService';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { 
  UserCheck, 
  UserPlus, 
  ShieldCheck, 
  Shield, 
  CheckCircle2, 
  Trash2, 
  Lock, 
  X, 
  Save, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface UserManagementProps {
  currentUser: UserProfile;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('petugas');
  const [programStudi, setProgramStudi] = useState('Biro Kemahasiswaan & Distribusi FEB');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Confirm Modal
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    user: UserProfile | null;
  }>({
    isOpen: false,
    user: null
  });

  const isSuperAdmin = currentUser.role === 'super_admin';

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await authService.getAdminUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nama.trim() || !email.trim()) {
      setErrorMsg('Nama dan Email wajib diisi.');
      return;
    }

    try {
      const added = await authService.addAdminUser({
        nama: nama.trim(),
        email: email.trim(),
        role,
        programStudi: programStudi.trim(),
        password: password.trim() || undefined
      });

      await auditService.log({
        actorUid: currentUser.uid,
        actorName: currentUser.nama,
        actorRole: currentUser.role,
        action: 'Tambah Akun Petugas',
        entityType: 'user',
        entityId: added.uid,
        description: `Menambahkan akun baru ${added.nama} sebagai ${added.role.toUpperCase()} (${added.email}).`
      });

      setIsModalOpen(false);
      setNama('');
      setEmail('');
      setPassword('');
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan akun.');
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    if (user.uid === currentUser.uid) {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.');
      return;
    }
    await authService.toggleUserActive(user.uid);
    await auditService.log({
      actorUid: currentUser.uid,
      actorName: currentUser.nama,
      actorRole: currentUser.role,
      action: 'Ubah Status Akun',
      entityType: 'user',
      entityId: user.uid,
      description: `Mengubah status keaktifan akun ${user.nama} (${user.email}).`
    });
    await loadUsers();
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete.user) return;
    const user = confirmDelete.user;
    await authService.deleteAdminUser(user.uid);
    await auditService.log({
      actorUid: currentUser.uid,
      actorName: currentUser.nama,
      actorRole: currentUser.role,
      action: 'Hapus Akun',
      entityType: 'user',
      entityId: user.uid,
      description: `Menghapus akun ${user.nama} (${user.email}).`
    });
    setConfirmDelete({ isOpen: false, user: null });
    await loadUsers();
  };

  const getRoleTag = (r: UserRole) => {
    switch (r) {
      case 'super_admin':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-max">
            <ShieldCheck className="w-3 h-3 text-amber-700" />
            SUPER ADMIN
          </span>
        );
      case 'admin':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 w-max">
            <Shield className="w-3 h-3 text-emerald-700" />
            ADMIN
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1 w-max">
            <CheckCircle2 className="w-3 h-3 text-teal-700" />
            PETUGAS DISTRIBUSI
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Manajemen Akun Administrator & Petugas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola hak akses berjenjang (Super Admin, Admin, dan Petugas Meja) untuk menjaga keamanan data mahasiswa.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            type="button"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Petugas / Admin</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3">Pengguna</th>
                <th className="p-3">Role Hak Akses</th>
                <th className="p-3">Unit / Penugasan</th>
                <th className="p-3">Status</th>
                <th className="p-3">Login Terakhir</th>
                {isSuperAdmin && <th className="p-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.uid === currentUser.uid;
                return (
                  <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {u.nama.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.nama}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">Anda</span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {getRoleTag(u.role)}
                    </td>
                    <td className="p-3 text-slate-600">
                      {u.programStudi || 'FEB UPN Veteran Jakarta'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {u.isActive !== false ? 'Aktif' : 'Dinonaktifkan'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px] font-mono">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    {isSuperAdmin && (
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${isCurrent ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                            title={u.isActive !== false ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                            type="button"
                          >
                            {u.isActive !== false ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ isOpen: true, user: u })}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${isCurrent ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-50 text-slate-400 hover:text-red-700'}`}
                            title="Hapus Akun"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white">
              <h3 className="font-extrabold text-base">Tambah Akun Petugas / Admin</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso, S.Kom"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi</label>
                <input
                  type="email"
                  placeholder="Contoh: petugas3@upnvj.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Hak Akses</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="petugas">Petugas Distribusi (Hanya meja verifikasi fisik)</option>
                  <option value="admin">Admin (Kelola data mahasiswa, jadwal, pengumuman)</option>
                  <option value="super_admin">Super Admin (Akses penuh termasuk role & sistem)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit / Penugasan</label>
                <input
                  type="text"
                  placeholder="Contoh: Tim Verifikasi Meja 3 Gedung FEB"
                  value={programStudi}
                  onChange={(e) => setProgramStudi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Awal</label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter (default: upnvj2026)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
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
                  <span>Simpan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, user: null })}
        onConfirm={handleDeleteUser}
        title="Hapus Akun Petugas"
        message={`Apakah Anda yakin ingin menghapus akun ${confirmDelete.user?.nama} (${confirmDelete.user?.email})?`}
        variant="danger"
      />

    </div>
  );
};
