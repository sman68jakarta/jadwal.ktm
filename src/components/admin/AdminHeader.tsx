import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { 
  Menu, 
  Search, 
  Bell, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface AdminHeaderProps {
  currentUser: UserProfile;
  activeTab: string;
  onOpenMobileSidebar: () => void;
  onNavigatePublic: () => void;
  onQuickSearch: (query: string) => void;
  onRefreshData?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentUser,
  activeTab,
  onOpenMobileSidebar,
  onNavigatePublic,
  onQuickSearch,
  onRefreshData
}) => {
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const getTabLabel = (id: string) => {
    switch (id) {
      case 'overview': return 'Dashboard Overview & Statistik';
      case 'students': return 'Manajemen Data Mahasiswa Baru (1.089 Mhs)';
      case 'schedules': return 'Pengelolaan Jadwal Distribusi KTM';
      case 'monitoring': return 'Monitoring & Konfirmasi Serah Terima';
      case 'import-export': return 'Import & Export Excel Spreadsheet';
      case 'announcements': return 'Manajemen Pengumuman FEB 2026';
      case 'users': return 'Manajemen Akun Admin & Petugas';
      case 'audit-logs': return 'Audit Trail & Riwayat Aktivitas';
      case 'settings': return 'Pengaturan Sistem & Database Firestore';
      default: return 'Admin Panel';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onQuickSearch(searchVal.trim());
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile hamburger & breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            type="button"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
              <span>Admin Panel</span>
              <span>/</span>
              <span className="text-emerald-700 font-bold capitalize">{activeTab}</span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
              {getTabLabel(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right: Quick search, notifications, sync, and web link */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick search input */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:block relative">
            <input
              type="text"
              placeholder="Cari NIM / Nama mahasiswa..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-56 xl:w-72 pl-9 pr-4 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-600"
            />
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2" />
          </form>

          {/* Refresh Button */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
              title="Refresh Data dari Cache & Firestore"
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              type="button"
              aria-label="Notifikasi sistem"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-900">Pemberitahuan Sistem</h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full">
                    Sistem Aktif
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">1.089 Data Mahasiswa Siap</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Seluruh rekaman resmi FEB 2026 terintegrasi dengan Firestore.</p>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">Firestore Rules Diperbarui</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Akses granular RBAC untuk Super Admin, Admin, dan Petugas aktif.</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-full text-center text-[11px] text-emerald-700 hover:underline font-bold pt-1"
                  type="button"
                >
                  Tutup Notifikasi
                </button>
              </div>
            )}
          </div>

          {/* Button: View Public Portal */}
          <button
            onClick={onNavigatePublic}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs"
            type="button"
          >
            <span>Web Mahasiswa</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
