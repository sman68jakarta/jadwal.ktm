import React, { useState } from 'react';
import { 
  LogIn, 
  Search, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { UPNVJ_LOGO_SRC, UPNVJ_LOGO_FALLBACK } from '../assets/logo';

interface LandingPageProps {
  onNavigateLogin: (prefilledNim?: string) => void;
  onNavigateHelp: () => void;
  onNavigateAdminLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateLogin,
  onNavigateHelp,
  onNavigateAdminLogin
}) => {
  const [searchNim, setSearchNim] = useState('');
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    student?: Student;
    searched: boolean;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleQuickCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchNim.trim();
    if (!clean) return;

    setIsSearching(true);
    const student = await studentService.getStudentByNim(clean);
    setIsSearching(false);

    if (student) {
      setSearchResult({ found: true, student, searched: true });
    } else {
      setSearchResult({ found: false, searched: true });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-16 md:py-24 px-4 sm:px-6">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Portal Resmi Mahasiswa Baru UPNVJ 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Informasi Distribusi KTM Mahasiswa Baru{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                  UPNVJ 2026
                </span>
              </h1>

              <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Temukan jadwal pembuatan dan pembagian Kartu Tanda Mahasiswa Anda dengan mudah, cepat, dan praktis melalui sistem informasi KTM UPN Veteran Jakarta.
              </p>

              {/* Primary Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onNavigateLogin()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-700/40 transition-all text-sm group"
                  type="button"
                >
                  <LogIn className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                  <span>Login Mahasiswa</span>
                  <ArrowRight className="w-4 h-4 text-emerald-200 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="#alur-distribusi"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-slate-700 transition-colors text-sm"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Lihat Alur & Persyaratan</span>
                </a>

                {onNavigateAdminLogin && (
                  <button
                    onClick={onNavigateAdminLogin}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600 transition-colors text-xs"
                    type="button"
                  >
                    <Building2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Portal Admin</span>
                  </button>
                )}
              </div>

              {/* Quick NIM Checker Widget (Strictly Privacy-First: asks login to view details) */}
              <div className="pt-4 max-w-xl mx-auto lg:mx-0">
                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-2">
                    <Search className="w-3.5 h-3.5" />
                    <span>Cek Status Pendaftaran Akun NIM Anda</span>
                  </div>
                  
                  <form onSubmit={handleQuickCheck} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchNim}
                        onChange={(e) => setSearchNim(e.target.value)}
                        placeholder="Masukkan 10 digit NIM (contoh: 2610111002)..."
                        maxLength={10}
                        className="w-full pl-3.5 pr-4 py-2.5 rounded-xl bg-slate-900/90 text-white placeholder-slate-400 text-sm border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching || !searchNim.trim()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold transition-colors shrink-0 flex items-center justify-center gap-1.5"
                    >
                      {isSearching ? 'Memeriksa...' : 'Cek Status'}
                    </button>
                  </form>

                  {/* Result feedback */}
                  {searchResult?.searched && (
                    <div className="mt-3 pt-3 border-t border-slate-700/80 animate-in fade-in duration-200">
                      {searchResult.found && searchResult.student ? (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-left">
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-emerald-200">
                              Data Mahasiswa Terdaftar dalam Sistem UPNVJ!
                            </p>
                            <p className="text-xs text-slate-300 font-mono">
                              NIM: {searchResult.student.nim} ({searchResult.student.programStudi})
                            </p>
                            <p className="text-[11px] text-amber-200/90 pt-1">
                              Demi perlindungan data pribadi mahasiswa, rincian jadwal dan status lengkap dapat diakses setelah melakukan login.
                            </p>
                            <button
                              onClick={() => onNavigateLogin(searchResult.student?.nim)}
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-400/20 hover:bg-amber-400/30 px-3 py-1.5 rounded-lg transition-colors"
                              type="button"
                            >
                              <span>Login Sekarang dengan NIM ini</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-left">
                          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-rose-200">
                              NIM Tidak Ditemukan
                            </p>
                            <p className="text-[11px] text-slate-300 mt-0.5">
                              Pastikan Anda memasukkan 10 digit NIM resmi mahasiswa baru Fakultas Ekonomi dan Bisnis UPNVJ angkatan 2026.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Security Tagline */}
              <div className="flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Keamanan Data Pribadi Terjamin
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  Gedung FEB UPNVJ
                </span>
              </div>
            </div>

            {/* Right Column: Visual Poster & Badge */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group max-w-sm sm:max-w-md w-full">
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 opacity-30 blur-lg group-hover:opacity-50 transition duration-500" />
                
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-5 text-center">
                  <img 
                    src={UPNVJ_LOGO_SRC} 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = UPNVJ_LOGO_FALLBACK; }}
                    alt="Poster Resmi UPNVJ Kartu Mahasiswa Baru" 
                    className="w-full h-auto object-contain rounded-xl shadow-lg border border-slate-800"
                  />
                  
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Resmi & Terverifikasi
                    </span>
                    <span className="text-amber-300 font-mono text-[11px]">
                      Tahun Ajaran 2026/2027
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Key Metrics / Highlights Bar */}
      <section className="bg-white border-y border-slate-200 py-8 px-4 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
                1.089
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                Mahasiswa Baru Terdata
              </p>
              <p className="text-[11px] text-slate-500">Fakultas Ekonomi dan Bisnis</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-2xl sm:text-3xl font-extrabold text-teal-700 font-mono">
                6
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                Program Studi
              </p>
              <p className="text-[11px] text-slate-500">Jenjang S1 & D3</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
                4 Hari
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                Periode Distribusi
              </p>
              <p className="text-[11px] text-slate-500">9 - 12 November 2026</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-800 font-mono">
                945 (86.8%)
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                KTM Siap Diambil
              </p>
              <p className="text-[11px] text-slate-500">Status &quot;Sudah jadi&quot;</p>
            </div>

          </div>
        </div>
      </section>

      {/* Alur Distribusi KTM (Step by Step) */}
      <section id="alur-distribusi" className="py-16 md:py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Tata Cara & Panduan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Alur Pengambilan Kartu Tanda Mahasiswa (KTM)
            </h2>
            <p className="text-sm text-slate-600">
              Ikuti 4 langkah mudah berikut untuk memastikan proses pengambilan KTM Anda berjalan lancar, tertib, dan tepat waktu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold text-base flex items-center justify-center mb-4 shadow-md">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">
                Login & Cek Jadwal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Masuk ke akun mahasiswa menggunakan NIM Anda. Periksa hari, tanggal, dan sesi waktu distribusi yang telah ditetapkan secara personal.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-extrabold text-base flex items-center justify-center mb-4 shadow-md">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">
                Unduh Lembar Bukti
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unduh atau cetak formulir Bukti Jadwal Distribusi KTM PDF langsung dari halaman dashboard mahasiswa Anda sebagai syarat validasi.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-extrabold text-base flex items-center justify-center mb-4 shadow-md">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">
                Siapkan Identitas Asli
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bawa Kartu Identitas Asli (KTP/KK/SIM/Paspor) serta Tanda Terima Registrasi Mahasiswa Baru UPNVJ 2026.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-extrabold text-base flex items-center justify-center mb-4 shadow-md">
                4
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">
                Ambil di Gedung FEB
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hadir di Lobby Gedung FEB Lt. 1 Kampus Pondok Labu sesuai jam operasional 09:00 s.d 16:00 WIB untuk verifikasi fisik dan penerimaan kartu.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Persyaratan & Informasi Penting */}
      <section className="py-16 px-4 sm:px-6 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left box: Requirements */}
            <div className="lg:col-span-7 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-6 sm:p-8 border border-emerald-200/80 shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-lg mb-4">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Persyaratan Wajib Pengambilan KTM Fisik</span>
              </div>
              
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Kartu Identitas Diri Asli</strong> (KTP Elektronik / Kartu Keluarga / SIM / Paspor yang masih berlaku).</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Bukti Tanda Terima Registrasi</strong> Mahasiswa Baru UPN Veteran Jakarta Tahun 2026.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Lembar Jadwal Distribusi</strong> yang diunduh dari dashboard akun mahasiswa pada sistem ini.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Kehadiran Langsung</strong>: Pengambilan tidak dapat diwakilkan kecuali dalam keadaan mendesak dengan menyertakan Surat Kuasa Asli bermaterai Rp10.000 dan fotokopi KTP kedua belah pihak.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Tata Tertib</strong>: Wajib berpakaian sopan, berkerah, dan bersepatu saat memasuki area kampus.</span>
                </li>
              </ul>
            </div>

            {/* Right box: Location & Venue Detail */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 text-amber-300 font-bold text-lg">
                <MapPin className="w-5 h-5 text-amber-400" />
                <span>Lokasi & Jadwal Operasional</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div>
                  <p className="font-semibold text-white uppercase text-[11px] text-emerald-400 tracking-wider">
                    Tempat Pengambilan:
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    Lobby Fakultas Ekonomi dan Bisnis (FEB) Lt. 1
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    Universitas Pembangunan Nasional &quot;Veteran&quot; Jakarta Kampus Pondok Labu, Jl. RS. Fatmawati No. 1, Jakarta Selatan 12450.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <p className="font-semibold text-white uppercase text-[11px] text-emerald-400 tracking-wider">
                    Jadwal Distribusi FEB 2026:
                  </p>
                  <div className="mt-1 space-y-1 font-mono text-xs">
                    <p className="flex justify-between">
                      <span>Senin, 9 November 2026</span>
                      <span className="text-amber-300 font-bold">09:00 - 16:00 WIB</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Selasa, 10 November 2026</span>
                      <span className="text-amber-300 font-bold">09:00 - 16:00 WIB</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Rabu, 11 November 2026</span>
                      <span className="text-amber-300 font-bold">09:00 - 16:00 WIB</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Kamis, 12 November 2026</span>
                      <span className="text-amber-300 font-bold">09:00 - 16:00 WIB</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-200/90">
                  <p>
                    *Bagi mahasiswa dengan status &quot;Proses pembuatan&quot; atau &quot;Dijadwalkan kemudian&quot;, pengambilan susulan akan dibuka setelah pencetakan bank mitra rampung.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateLogin()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                type="button"
              >
                <span>Masuk untuk Melihat Jadwal Anda</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Program Studi List */}
      <section className="py-14 px-4 sm:px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Program Studi Fakultas Ekonomi dan Bisnis
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Data terintegrasi untuk 1.089 mahasiswa baru angkatan 2026
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'S1 Manajemen', total: '312 Mhs' },
              { name: 'S1 Akuntansi', total: '313 Mhs' },
              { name: 'S1 Ekonomi Pembangunan', total: '118 Mhs' },
              { name: 'S1 Ekonomi Syariah', total: '114 Mhs' },
              { name: 'D3 Akuntansi', total: '117 Mhs' },
              { name: 'D3 Perbankan dan Keuangan', total: '115 Mhs' },
            ].map(prodi => (
              <div 
                key={prodi.name}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all text-center"
              >
                <GraduationCap className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-xs text-slate-800 line-clamp-2">
                  {prodi.name}
                </h4>
                <span className="inline-block mt-1.5 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {prodi.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
