import React from 'react';
import { UserProfile } from '../types';
import { UPNVJ_LOGO_SRC, UPNVJ_LOGO_FALLBACK } from '../assets/logo';
import { 
  GraduationCap, 
  Calendar, 
  LayoutDashboard, 
  Users, 
  Bell, 
  HelpCircle, 
  LogOut, 
  LogIn, 
  Menu, 
  X,
  ShieldCheck,
  Shield,
  Briefcase
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isAdminRole = currentUser && (
    currentUser.role === 'super_admin' || 
    currentUser.role === 'admin' || 
    currentUser.role === 'petugas' ||
    currentUser.role === 'staff'
  );
  const isStudent = currentUser?.role === 'student';

  const navItems = [
    { id: 'landing', label: 'Beranda', icon: GraduationCap, show: true },
    { id: 'dashboard', label: 'Dashboard Saya', icon: LayoutDashboard, show: isStudent },
    { id: 'schedule', label: 'Jadwal KTM Saya', icon: Calendar, show: isStudent },
    { id: 'admin-dashboard', label: 'Panel Admin', icon: Briefcase, show: !!isAdminRole, isSpecial: true },
    { id: 'announcements', label: 'Pengumuman', icon: Bell, show: true },
    { id: 'help', label: 'Bantuan & FAQ', icon: HelpCircle, show: true }
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded">SUPER ADMIN</span>;
      case 'admin':
        return <span className="bg-emerald-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">ADMIN</span>;
      case 'petugas':
        return <span className="bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PETUGAS</span>;
      default:
        return <span className="bg-teal-100 text-teal-800 text-[9px] font-bold px-1.5 py-0.5 rounded">MHS</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro-bar for official institution tag */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white text-[11px] py-1 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide">PORTAL RESMI DISTRIBUSI KTM 2026</span>
            <span className="hidden md:inline text-emerald-300">|</span>
            <span className="hidden md:inline text-emerald-200">Universitas Pembangunan Nasional &quot;Veteran&quot; Jakarta</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-emerald-200">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3 text-amber-300" />
              Sistem Terverifikasi FEB
            </span>
            <span className="hidden sm:inline bg-emerald-700/60 px-2 py-0.5 rounded text-amber-300 font-mono">
              Tahun Ajaran 2026
            </span>
            <span className="text-emerald-400">|</span>
            <button
              onClick={() => handleNavClick(isAdminRole ? 'admin-dashboard' : 'admin-login')}
              className="text-amber-300 hover:text-white font-bold underline flex items-center gap-1 transition-colors"
              type="button"
            >
              <span>{isAdminRole ? 'Buka Admin Panel' : 'Portal Admin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <button 
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 text-left group focus:outline-hidden"
            type="button"
          >
            <div className="relative">
              <img 
                src={UPNVJ_LOGO_SRC} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = UPNVJ_LOGO_FALLBACK; }}
                alt="Logo UPN Veteran Jakarta" 
                className="w-10 h-10 md:w-11 md:h-11 object-contain rounded-full shadow-xs group-hover:scale-105 transition-transform border border-emerald-500/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-600 rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base md:text-lg text-emerald-800 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                  KTM UPNVJ
                </span>
                <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs leading-none">
                  2026
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium tracking-tight mt-0.5">
                Fakultas Ekonomi dan Bisnis
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems
              .filter(item => item.show)
              .map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      item.isSpecial
                        ? 'bg-amber-400 text-slate-900 hover:bg-amber-300 font-extrabold shadow-xs ml-1'
                        : isActive
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                    }`}
                    type="button"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </nav>

          {/* User Profile or Login CTA */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-slate-800 max-w-[160px] truncate block">
                      {currentUser.nama}
                    </span>
                    {getRoleBadge(currentUser.role)}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {currentUser.nim ? `NIM: ${currentUser.nim}` : currentUser.email}
                  </p>
                </div>

                {isAdminRole && (
                  <button
                    onClick={() => handleNavClick('admin-dashboard')}
                    className="p-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    title="Buka Admin Panel"
                    type="button"
                  >
                    <Briefcase className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                  title="Keluar dari Akun"
                  type="button"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('admin-login')}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 transition-all"
                  type="button"
                >
                  <Briefcase className="w-3.5 h-3.5 text-teal-700" />
                  <span>Admin / Petugas</span>
                </button>

                <button
                  onClick={() => handleNavClick('login')}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs hover:shadow transition-all"
                  type="button"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login Mahasiswa</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            {!currentUser && (
              <button
                onClick={() => handleNavClick('login')}
                className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                type="button"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle Menu"
              type="button"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-1">
            {navItems
              .filter(item => item.show)
              .map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                      item.isSpecial
                        ? 'bg-amber-400 text-slate-900 font-extrabold'
                        : isActive
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    type="button"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </nav>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            {!currentUser ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavClick('admin-login')}
                  className="w-full py-2.5 px-3 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 flex items-center justify-center gap-1.5"
                  type="button"
                >
                  <Briefcase className="w-3.5 h-3.5 text-teal-700" />
                  <span>Admin / Petugas</span>
                </button>
                <button
                  onClick={() => handleNavClick('login')}
                  className="w-full py-2.5 px-3 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                  type="button"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login Mahasiswa</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800">{currentUser.nama}</p>
                    {getRoleBadge(currentUser.role)}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {currentUser.nim ? `NIM: ${currentUser.nim}` : currentUser.email}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors"
                  type="button"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
