import React from 'react';
import { ShieldCheck, MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import { UPNVJ_LOGO_SRC, UPNVJ_LOGO_FALLBACK } from '../assets/logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-auto">
      {/* Upper footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={UPNVJ_LOGO_SRC} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = UPNVJ_LOGO_FALLBACK; }}
                alt="Logo UPN Veteran Jakarta" 
                className="w-12 h-12 object-contain rounded-full bg-white/10 p-1 border border-emerald-500/40"
              />
              <div>
                <h4 className="text-white font-extrabold text-base tracking-tight">
                  UNIVERSITAS PEMBANGUNAN NASIONAL &quot;VETERAN&quot; JAKARTA
                </h4>
                <p className="text-xs text-emerald-400 font-semibold">
                  Fakultas Ekonomi dan Bisnis (FEB) - Distribusi KTM 2026
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Sistem Informasi Resmi Pembuatan dan Distribusi Kartu Tanda Mahasiswa Baru Universitas Pembangunan Nasional &quot;Veteran&quot; Jakarta Tahun 2026. Portal ini menyediakan data jadwal, waktu pengambilan, serta status penerbitan fisik KTM berbasis cloud database yang terintegrasi secara aman.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Keamanan data mahasiswa terenkripsi dan terlindungi.</span>
            </div>
          </div>

          {/* Col 2: Info Kontak & Layanan */}
          <div className="space-y-3">
            <h5 className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
              Layanan Informasi
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Gedung FEB Lantai 1, UPN Veteran Jakarta Kampus Pondok Labu, Jl. RS. Fatmawati No. 1, Jakarta Selatan</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Senin - Kamis: 09:00 - 16:00 WIB</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>(021) 7656971 / Ext. 124 FEB</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>feb@upnvj.ac.id</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Program Studi FEB */}
          <div className="space-y-3">
            <h5 className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
              Program Studi FEB 2026
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li className="hover:text-emerald-300 transition-colors">1. S1 Manajemen</li>
              <li className="hover:text-emerald-300 transition-colors">2. S1 Akuntansi</li>
              <li className="hover:text-emerald-300 transition-colors">3. S1 Ekonomi Pembangunan</li>
              <li className="hover:text-emerald-300 transition-colors">4. S1 Ekonomi Syariah</li>
              <li className="hover:text-emerald-300 transition-colors">5. D3 Akuntansi</li>
              <li className="hover:text-emerald-300 transition-colors">6. D3 Perbankan dan Keuangan</li>
            </ul>
            <div className="pt-2">
              <a 
                href="https://upnvj.ac.id" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                <span>Portal Utama UPNVJ</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 sm:px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            &copy; {new Date().getFullYear()} Universitas Pembangunan Nasional &quot;Veteran&quot; Jakarta. Hak Cipta Dilindungi.
          </p>
          <p className="text-[11px] text-slate-400">
            Sistem Informasi Jadwal Distribusi Kartu Tanda Mahasiswa Baru FEB 2026
          </p>
        </div>
      </div>
    </footer>
  );
};
