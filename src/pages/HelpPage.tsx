import React, { useState } from 'react';
import { 
  HelpCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ChevronDown, 
  FileQuestion, 
  Building2, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Bagaimana cara mengetahui jadwal distribusi KTM saya?',
      a: 'Mahasiswa baru cukup login ke sistem ini menggunakan 10 digit NIM dan kata sandi Anda. Setelah login, jadwal hari, tanggal, dan sesi waktu layanan Anda akan langsung ditampilkan pada Kartu Jadwal Distribusi.'
    },
    {
      q: 'Apa arti status "Proses pembuatan" pada akun saya?',
      a: 'Status "Proses pembuatan" menandakan fisik kartu Anda sedang dalam tahap pencetakan dan personalisasi chip/rekening oleh pihak bank mitra. Jadwal pengambilan Anda akan tercatat "Dijadwalkan kemudian" dan akan diperbarui segera setelah kartu selesai dicetak.'
    },
    {
      q: 'Bagaimana jika saya belum memiliki kata sandi atau akun belum aktif?',
      a: 'Buka halaman login, lalu klik tombol "Aktivasi Akun Mahasiswa Baru". Masukkan 10 digit NIM dan nama lengkap Anda untuk konfirmasi identitas, lalu buat kata sandi baru Anda.'
    },
    {
      q: 'Apakah pengambilan KTM dapat diwakilkan oleh orang lain?',
      a: 'Pengambilan sangat disarankan dilakukan secara langsung oleh mahasiswa yang bersangkutan. Apabila terdapat kendala darurat / medis, pengambilan dapat diwakilkan dengan menyertakan Surat Kuasa Asli bermaterai Rp10.000, fotokopi KTP pemberi kuasa, dan KTP asli penerima kuasa.'
    },
    {
      q: 'Dokumen apa saja yang wajib dibawa saat hari H pengambilan?',
      a: '1. Lembar Bukti Jadwal Distribusi KTM yang diunduh (PDF) dari sistem ini.\n2. Kartu Identitas Asli (e-KTP / KK / SIM / Paspor).\n3. Bukti Tanda Terima Registrasi Mahasiswa Baru UPNVJ 2026.'
    },
    {
      q: 'Di mana lokasi persis pengambilan KTM Mahasiswa Baru FEB?',
      a: 'Lokasi bertempat di Lobby Gedung Fakultas Ekonomi dan Bisnis (FEB) Lantai 1, UPN Veteran Jakarta Kampus Pondok Labu, Jl. RS. Fatmawati No. 1, Pondok Labu, Jakarta Selatan.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          Pusat Informasi & Bantuan
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pertanyaan Umum (FAQ) & Layanan Bantuan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Temukan jawaban seputar proses pembuatan, jadwal distribusi, dan kendala akun KTM UPNVJ 2026.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div 
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm text-slate-800 hover:text-emerald-700 transition-colors focus:outline-hidden"
                type="button"
              >
                <span className="flex items-center gap-3">
                  <FileQuestion className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{faq.q}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 whitespace-pre-line bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Cards */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <span>Loket Layanan Kemahasiswaan FEB UPNVJ</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Alamat Kampus</h3>
            <p className="leading-relaxed">
              Gedung FEB Lantai 1, UPN Veteran Jakarta Kampus Pondok Labu, Jl. RS. Fatmawati No. 1, Jakarta Selatan 12450.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Jam Layanan</h3>
            <p className="leading-relaxed">
              Senin - Kamis: 09:00 s.d 16:00 WIB<br />
              Istirahat: 12:00 - 13:00 WIB
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Kontak Resmi</h3>
            <p className="leading-relaxed">
              Telepon: (021) 7656971 / Ext. 124<br />
              Email: feb@upnvj.ac.id
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>KTM Resmi Universitas Pembangunan Nasional &quot;Veteran&quot; Jakarta 2026</span>
          </div>
          <a
            href="https://upnvj.ac.id"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
          >
            <span>Kunjungi Website UPNVJ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
};
