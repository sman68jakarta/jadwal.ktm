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
  Building
} from 'lucide-react';
import { authService } from '../services/authService';
import { UserProfile } from '../types';
import { Modal } from '../components/Modal';
import { UPNVJ_LOGO_SRC, UPNVJ_LOGO_FALLBACK } from '../assets/logo';

interface LoginPageProps {
  initialNim?: string;
  onLoginSuccess: (user: UserProfile) => void;
  onNavigateHelp: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialNim = '',
  onLoginSuccess,
  onNavigateHelp
}) => {
  const [nim, setNim] = useState(initialNim);
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nim.trim()) {
      setErrorMessage('Nomor Induk Mahasiswa (NIM) wajib diisi.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(nim, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || 'Login gagal. Periksa kembali NIM dan kata sandi Anda.');
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kendala saat menghubungkan ke sistem autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'student-ready' | 'student-process' | 'admin') => {
    setLoading(true);
    setErrorMessage('');
    try {
      const user = await authService.loginAsDemo(role);
      onLoginSuccess(user);
    } catch (err) {
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
      setActError('Semua field wajib diisi.');
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
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 text-white text-center relative">
            <div className="flex justify-center mb-3">
              <img 
                src={UPNVJ_LOGO_SRC} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = UPNVJ_LOGO_FALLBACK; }}
                alt="Logo UPNVJ" 
                className="w-16 h-16 object-contain rounded-full bg-white/10 p-1 border-2 border-amber-400 shadow-md"
              />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Login Mahasiswa
            </h2>
            <p className="text-xs text-emerald-200 mt-1 max-w-xs mx-auto">
              Silakan login menggunakan akun mahasiswa Anda untuk melihat informasi jadwal distribusi KTM.
            </p>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NIM Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nomor Induk Mahasiswa (NIM)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Contoh: 2610111002"
                    maxLength={10}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-mono placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  10 digit nomor mahasiswa baru FEB UPNVJ
                </p>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActNim(nim);
                      setActivationOpen(true);
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Belum punya sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi Anda..."
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <span>Ingat sesi login saya</span>
                </label>

                <button
                  type="button"
                  onClick={onNavigateHelp}
                  className="text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Bantuan</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem</span>
                  </>
                )}
              </button>
            </form>

            {/* Account Activation Callout */}
            <div className="pt-4 border-t border-slate-200">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
                <UserPlus className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-900">
                    Aktivasi Akun Mahasiswa Baru
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Mahasiswa baru yang belum pernah membuat kata sandi dapat mengaktivasi akun dengan validasi identitas resmi.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActNim(nim);
                      setActivationOpen(true);
                    }}
                    className="mt-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 underline"
                  >
                    <span>Klik di sini untuk Aktivasi Akun Sekarang</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Demo Access Bar for rapid evaluation */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                Akses Demo Cepat (1-Klik)
              </p>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('student-ready')}
                  disabled={loading}
                  className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 transition-colors text-center"
                  title="Masuk sebagai Mahasiswa dengan status KTM Sudah Jadi"
                >
                  <span className="block text-[10px] text-emerald-600 font-bold">MHS 1 (Siap)</span>
                  <span>Aulia Rifina</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('student-process')}
                  disabled={loading}
                  className="p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold border border-teal-200 transition-colors text-center"
                  title="Masuk sebagai Mahasiswa dengan status KTM Dalam Proses"
                >
                  <span className="block text-[10px] text-teal-600 font-bold">MHS 2 (Proses)</span>
                  <span>Luvena S.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  disabled={loading}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-300 transition-colors text-center"
                  title="Masuk sebagai Petugas Admin FEB UPNVJ"
                >
                  <span className="block text-[10px] text-amber-600 font-bold">ADMIN</span>
                  <span>Petugas FEB</span>
                </button>
              </div>
            </div>

            {/* Security note */}
            <div className="text-[11px] text-slate-600 flex items-center justify-center gap-1.5 text-center pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Sesi terenkripsi & data mahasiswa dilindungi hak cipta</span>
            </div>

          </div>
        </div>

      </div>

      {/* Account Activation Modal */}
      <Modal
        isOpen={activationOpen}
        onClose={() => setActivationOpen(false)}
        title="Aktivasi Akun Mahasiswa Baru UPNVJ 2026"
        maxWidth="md"
      >
        <form onSubmit={handleActivationSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Masukkan NIM dan nama lengkap sesuai dengan yang tertera pada berkas registrasi resmi Fakultas Ekonomi dan Bisnis UPNVJ.
          </p>

          {actError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actError}</span>
            </div>
          )}

          {actSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nomor Induk Mahasiswa (10 Digit)
            </label>
            <input
              type="text"
              value={actNim}
              onChange={(e) => setActNim(e.target.value)}
              placeholder="Contoh: 2610111002"
              maxLength={10}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono focus:bg-white focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Lengkap (Sesuai Ijazah / Registrasi)
            </label>
            <input
              type="text"
              value={actName}
              onChange={(e) => setActName(e.target.value)}
              placeholder="Contoh: AULIA RIFINA GANI"
              required
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm uppercase focus:bg-white focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Aktif Mahasiswa
            </label>
            <input
              type="email"
              value={actEmail}
              onChange={(e) => setActEmail(e.target.value)}
              placeholder="nama@mahasiswa.upnvj.ac.id"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Buat Kata Sandi Baru
            </label>
            <input
              type="password"
              value={actPassword}
              onChange={(e) => setActPassword(e.target.value)}
              placeholder="Minimal 6 karakter..."
              minLength={6}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:bg-white focus:border-emerald-600 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-600 mt-1">
              Kata sandi ini akan Anda gunakan untuk login melihat jadwal dan status KTM.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActivationOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 transition-colors flex items-center gap-1.5"
            >
              {actLoading ? 'Memverifikasi...' : 'Aktivasi Akun'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
