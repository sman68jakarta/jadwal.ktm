import React from 'react';
import { UserProfile } from '../../types';
import { UPNVJ_LOGO_SRC, UPNVJ_LOGO_FALLBACK } from '../../assets/logo';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Activity, 
  FileSpreadsheet, 
  Bell, 
  UserCheck, 
  History, 
  Settings, 
  LogOut, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';

interface AdminSidebarProps {
  currentUser: UserProfile;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
  onNavigatePublic: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onLogout,
  onNavigatePublic
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin = currentUser.role === 'admin' || isSuperAdmin;
  const isPetugas = currentUser.role === 'petugas';

  const menuSections = [
    {
      title: 'UTAMA',
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, role: 'all' }
      ]
    },
    {
      title: 'DATA MAHASISWA',
      items: [
        { id: 'students', label: 'Kelola Mahasiswa (1.089)', icon: Users, role: 'all' }
      ]
    },
    {
      title: 'DISTRIBUSI KTM',
      items: [
        { id: 'schedules', label: 'Jadwal Distribusi', icon: Calendar, role: 'all' },
        { id: 'monitoring', label: 'Monitoring & Serah Terima', icon: Activity, role: 'all', badge: 'Live' }
      ]
    },
    {
      title: 'INTEGRASI DATA',
      items: [
        { id: 'import-export', label: 'Import & Export Excel', icon: FileSpreadsheet, role: 'admin' }
      ]
    },
    {
      title: 'KOMUNIKASI',
      items: [
        { id: 'announcements', label: 'Pengumuman FEB', icon: Bell, role: 'all' }
      ]
    },
    {
      title: 'SISTEM & KEAMANAN',
      items: [
        { id: 'users', label: 'Pengguna & Petugas', icon: UserCheck, role: 'super_admin' },
        { id: 'audit-logs', label: 'Audit Log Aktivitas', icon: History, role: 'admin' },
        { id: 'settings', label: 'Pengaturan Sistem', icon: Settings, role: 'admin' }
      ]
    }
  ];

  const getRoleBadge = () => {
    if (isSuperAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900 border border-amber-300">
          <ShieldCheck className="w-3 h-3 text-slate-900" />
          SUPER ADMIN
        </span>
      );
    }
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white border border-emerald-400">
          <Shield className="w-3 h-3 text-white" />
          ADMIN FEB
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500 text-white border border-teal-400">
        <CheckCircle2 className="w-3 h-3 text-white" />
        PETUGAS MEJA
      </span>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative shrink-0">
            <img
              src={UPNVJ_LOGO_SRC}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = UPNVJ_LOGO_FALLBACK; }}
              alt="Logo UPNVJ"
              className="w-10 h-10 object-contain rounded-full bg-white/10 p-0.5 border border-emerald-500/40"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white tracking-tight truncate">
                  KTM UPNVJ 2026
                </span>
              </div>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Admin Panel FEB
              </p>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
          type="button"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Card when expanded */}
      {!isCollapsed && (
        <div className="px-4 py-3 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between">
          <div className="text-xs">
            <p className="text-slate-400 text-[10px]">Peran Pengguna:</p>
            <div className="mt-1">{getRoleBadge()}</div>
          </div>
          <button
            onClick={onNavigatePublic}
            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            title="Buka Website Utama"
            type="button"
          >
            <span>Web Publik</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Nav Menu Items */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {menuSections.map((section, sIdx) => {
          // Filter items based on user role
          const visibleItems = section.items.filter(item => {
            if (item.role === 'all') return true;
            if (item.role === 'admin' && isAdmin) return true;
            if (item.role === 'super_admin' && isSuperAdmin) return true;
            return false;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  {section.title}
                </p>
              )}
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                    type="button"
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400 text-slate-900 leading-none">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-xs shrink-0">
              {currentUser.nama.slice(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {currentUser.nama}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {currentUser.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            title="Keluar dari Admin Panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            type="button"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-18' : 'w-64'}`}>
        <div className="fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out h-full overflow-hidden" style={{ width: isCollapsed ? '4.5rem' : '16rem' }}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
