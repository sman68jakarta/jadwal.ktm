import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  UserPlus,
  HelpCircle,
  Building,
  Shield,
  Briefcase
} from 'lucide-react';
import { authService } from '../services/authService';
import { UserProfile } from '../types';
import { Modal } from '../components/Modal';
import { UPNVJ_LOGO_SRC, UPNVJ_LOGO_FALLBACK } from '../assets/logo';

interface LoginPageProps {
  initialNim?: string;
  initialMode?: 'student' | 'admin';
  onLoginSuccess: (user: UserProfile) => void;
  onNavigateHelp: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialNim = '',
  initialMode = 'student',
  onLoginSuccess,
  onNavigateHelp
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>(initialMode);
  
  // Student Form
  const [nim, setNim] = useState(initialNim);
  const [studentPassword, setStudentPassword] = useState('');
  
  // Admin Form
  const [adminIdentifier, setAdminIdentifier] = useState('admin@upnvj.ac.id');
  const [adminPassword, setAdminPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Activation modal state
  const [activationOpen, setActivationOpen] = useState(false);
  const [actNim, setActNim] = useState('');
  const [actName, setActName] = useState('');
  const [actEmail, setActEmail] = useState('');
  const [actPassword, setActPassword] = useState('');
  const [actLoading, setActLoading] = useState(false);
  const [actError, setActError] = useState('');
  const [actSuccess, setActSuccess] = useState('');

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nim.trim()) {
      setErrorMessage('Nomor Induk Mahasiswa (NIM) wajib diisi.');
      return;
    }
    if (!studentPassword.trim()) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(nim, studentPassword);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || 'Login mahasiswa gagal. Periksa kembali NIM dan kata sandi Anda.');
      }
    } catch {
      setErrorMessage('Terjadi kendala saat menghubungkan ke sistem autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!adminIdentifier.trim()) {
      setErrorMessage('Email atau Username Administrator / Petugas wajib diisi.');
      return;
    }
    if (!adminPassword.trim()) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(adminIdentifier, adminPassword);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || 'Login Administrator gagal. Periksa kembali akun dan kata sandi Anda.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat memproses login admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'student-ready' | 'student-process' | 'admin' | 'superadmin' | 'petugas') => {
    setLoading(true);
    setErrorMessage('');
    try {
      const user = await authService.loginAsDemo(role);
      onLoginSuccess(user);
    } catch {
      setErrorMessage('Gagal memuat sesi demo.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActError('');
    setActSuccess('');

    if (!actNim.trim() || !actName.trim() || !actPassword.trim()) {
      setActError('Semua field bertanda * wajib diisi.');
      return;
    }

    setActLoading(true);
    try {
      const res = await authService.activateStudentAccount(actNim, actName, actEmail, actPassword);
      if (res.success && res.user) {
        setActSuccess('Akun berhasil diaktivasi! Anda akan langsung dialihkan ke dashboard...');
        setTimeout(() => {
          setActivationOpen(false);
          onLoginSuccess(res.user!);
        }, 1200);
      } else {
        setActError(res.message || 'Aktivasi gagal. Periksa kecocokan data NIM dan Nama Anda.');
      }
    } catch {
      setActError('Terjadi kesalahan saat memproses aktivasi.');
    } finally {
      setActLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50 relative">
      {/* Decorative ambient blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 text-white text-center relative">
            <div className="flex justify-center mb-3">
              <img 
                src={UPNVJ_LOGO_SRC} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = UPNVJ_LOGO_FALLBACK; }}
                alt="Logo UPNVJ" 
                className="w-14 h-14 object-contain rounded-full bg-white/10 p-1 border-2 border-amber-400 shadow-md"
              />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Sistem Informasi KTM UPNVJ 2026
            </h2>
            <p className="text-xs text-emerald-200 mt-1 max-w-xs mx-auto">
              Portal Resmi Distribusi Kartu Tanda Mahasiswa Baru Fakultas Ekonomi dan Bisnis
            </p>
          </div>

          {/* Mode Tab Switcher: Mahasiswa vs Admin/Petugas */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => { setActiveTab('student'); setErrorMessage(''); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Login Mahasiswa</span>
            </button>

            <button
              onClick={() => { setActiveTab('admin'); setErrorMessage(''); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              <Briefcase className="w-4 h-4 text-teal-600" />
              <span>Admin & Petugas</span>
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold">Login Belum Berhasil</p>
                  <p className="text-rose-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* TAB 1: MAHASISWA LOGIN */}
            {activeTab === 'student' && (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                {/* NIM Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor Induk Mahasiswa (NIM)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Contoh: 2610111002"
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:font-sans placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    10 digit nomor mahasiswa baru FEB UPNVJ
                  </p>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => setActivationOpen(true)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                    >
                      Belum punya sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi Anda..."
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Help */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Ingat sesi login saya</span>
                  </label>
                  <button
                    type="button"
                    onClick={onNavigateHelp}
                    className="text-slate-500 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Bantuan</span>
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk ke Dashboard Mahasiswa</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: ADMIN & PETUGAS LOGIN */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {/* Email / Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Resmi / Username Petugas
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="admin@upnvj.ac.id atau petugas@upnvj.ac.id"
                      value={adminIdentifier}
                      onChange={(e) => setAdminIdentifier(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Akun terdaftar Super Admin, Admin FEB, atau Petugas Distribusi
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kata Sandi Administrator
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi admin..."
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-[11px] text-teal-800 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Akses terlindungi Firestore Security Rules. Hanya akun dengan otorisasi yang dapat masuk ke Admin Panel.</span>
                </div>

                {/* Admin Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi Otorisasi...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Masuk ke Admin Panel</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Student Activation Section */}
            {activeTab === 'student' && (
              <div className="pt-2 border-t border-slate-100">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                  <p className="text-xs font-bold text-slate-800">
                    Aktivasi Akun Mahasiswa Baru
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Mahasiswa baru yang belum pernah membuat kata sandi dapat mengaktivasi akun dengan validasi identitas resmi.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActivationOpen(true)}
                    className="mt-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Klik di sini untuk Aktivasi Akun Sekarang →
                  </button>
                </div>
              </div>
            )}

            {/* Quick Demo Access Buttons */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center mb-2.5">
                {activeTab === 'student' ? 'Akses Demo Mahasiswa (1-Klik)' : 'Akses Demo Petugas & Admin (1-Klik)'}
              </p>
              
              {activeTab === 'student' ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('student-ready')}
                    disabled={loading}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-left transition-colors"
                  >
                    <span className="block font-black text-[10px] text-emerald-800 uppercase">MHS 1 (Siap)</span>
                    <span className="font-bold text-[11px] block truncate">Aulia Rifina</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('student-process')}
                    disabled={loading}
                    className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-left transition-colors"
                  >
                    <span className="block font-black text-[10px] text-teal-800 uppercase">MHS 2 (Proses)</span>
                    <span className="font-bold text-[11px] block truncate">Luvena S.</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('superadmin')}
                    disabled={loading}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-left transition-colors"
                  >
                    <span className="block font-black text-[9px] text-amber-800 uppercase">SUPER ADMIN</span>
                    <span className="font-bold text-[10px] block truncate">Dr. Hendra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin')}
                    disabled={loading}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-left transition-colors"
                  >
                    <span className="block font-black text-[9px] text-emerald-800 uppercase">ADMIN FEB</span>
                    <span className="font-bold text-[10px] block truncate">Siti R.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('petugas')}
                    disabled={loading}
                    className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-900 text-left transition-colors"
                  >
                    <span className="block font-black text-[9px] text-teal-800 uppercase">PETUGAS</span>
                    <span className="font-bold text-[10px] block truncate">Budi (Meja 1)</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Footer Security Badge */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-600 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sesi terenkripsi & data mahasiswa dilindungi hak cipta</span>
          </div>

        </div>

      </div>

      {/* Activation Modal */}
      <Modal
        isOpen={activationOpen}
        onClose={() => setActivationOpen(false)}
        title="Aktivasi Akun Mahasiswa Baru"
      >
        <form onSubmit={handleActivationSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Masukkan data identitas Anda sesuai yang tertera pada berkas registrasi mahasiswa baru UPNVJ 2026.
          </p>

          {actError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actError}</span>
            </div>
          )}

          {actSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actSuccess}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nomor Induk Mahasiswa (NIM) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: 2610111002"
              value={actNim}
              onChange={(e) => setActNim(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap Sesuai Ijazah / KTP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: AULIA RIFINA GANI"
              value={actName}
              onChange={(e) => setActName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 uppercase"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Email Pribadi / Mahasiswa
            </label>
            <input
              type="email"
              placeholder="Contoh: nama@mahasiswa.upnvj.ac.id"
              value={actEmail}
              onChange={(e) => setActEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Buat Kata Sandi Baru <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={actPassword}
              onChange={(e) => setActPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setActivationOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              {actLoading ? 'Memproses...' : 'Aktivasi Sekarang'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
