import React, { useState, useEffect } from 'react';
import { 
  googleSheetsSyncService, 
  GoogleSheetsConfig, 
  StudentChangeDiff 
} from '../../services/googleSheetsSyncService';
import { UserProfile } from '../../types';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Sliders, 
  ArrowRight, 
  Layers, 
  Info,
  Play,
  RotateCw,
  HelpCircle
} from 'lucide-react';

interface GoogleSheetsSyncTabProps {
  currentUser: UserProfile;
}

export const GoogleSheetsSyncTab: React.FC<GoogleSheetsSyncTabProps> = ({ currentUser }) => {
  const [config, setConfig] = useState<GoogleSheetsConfig>(googleSheetsSyncService.getConfig());
  const [inputUrl, setInputUrl] = useState(config.spreadsheetUrl);
  const [intervalSecs, setIntervalSecs] = useState(config.syncIntervalSeconds);
  const [autoSync, setAutoSync] = useState(config.autoSyncEnabled);
  
  const [syncMode, setSyncMode] = useState<'url' | 'paste'>('url');
  const [pastedText, setPastedText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const unsubscribe = googleSheetsSyncService.subscribe((newCfg) => {
      setConfig(newCfg);
      setInputUrl(newCfg.spreadsheetUrl);
      setAutoSync(newCfg.autoSyncEnabled);
      setIntervalSecs(newCfg.syncIntervalSeconds);
    });
    return unsubscribe;
  }, []);

  const handleSaveAndSync = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatusFeedback(null);

    const parsed = googleSheetsSyncService.parseGoogleSheetsUrl(inputUrl);
    if (!parsed.isValid) {
      setStatusFeedback({
        type: 'error',
        message: parsed.error || 'URL Google Spreadsheet tidak valid.'
      });
      return;
    }

    // Save config
    googleSheetsSyncService.updateConfig({
      spreadsheetUrl: inputUrl.trim(),
      autoSyncEnabled: autoSync,
      syncIntervalSeconds: intervalSecs
    });

    setIsSyncing(true);
    try {
      const res = await googleSheetsSyncService.performSync(currentUser);
      if (res.success) {
        setStatusFeedback({
          type: 'success',
          message: res.message
        });
      } else {
        setStatusFeedback({
          type: 'error',
          message: res.message
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Gagal melakukan sinkronisasi dengan Google Spreadsheet.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePasteSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) {
      setStatusFeedback({
        type: 'error',
        message: 'Silakan tempelkan data baris tabel dari Google Sheets terlebih dahulu.'
      });
      return;
    }

    setIsSyncing(true);
    setStatusFeedback(null);
    try {
      const res = await googleSheetsSyncService.syncFromRawText(pastedText, currentUser);
      if (res.success) {
        setStatusFeedback({
          type: 'success',
          message: res.message
        });
        setPastedText('');
      } else {
        setStatusFeedback({
          type: 'error',
          message: res.message
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Gagal memproses data tempelan spreadsheet.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulateChange = async () => {
    setIsSimulating(true);
    setStatusFeedback(null);
    try {
      const res = await googleSheetsSyncService.simulateLiveSpreadsheetUpdate('update-few', currentUser);
      if (res.success) {
        setStatusFeedback({
          type: 'success',
          message: res.message
        });
      } else {
        setStatusFeedback({
          type: 'info',
          message: res.message
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Simulasi gagal dijalankan.'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const copyHeaderTemplate = () => {
    const template = "NO\tNIM\tNAMA MAHASISWA\tPROGRAM STUDI\tSTATUS KTM\tTANGGAL DISTRIBUSI\tWAKTU\tRUANGAN\tCATATAN";
    navigator.clipboard.writeText(template);
    setCopiedHeader(true);
    setTimeout(() => setCopiedHeader(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Hero Card: Google Sheets Live Sync */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 w-80 h-32 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>SINKRONISASI REAL-TIME GOOGLE SPREADSHEET</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            Hubungkan Link Google Spreadsheet untuk Sinkronisasi Otomatis Data KTM
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Cukup masukkan link Google Spreadsheet universitas Anda di bawah ini. Ketika Anda mengubah status di spreadsheet (misalnya dari <strong className="text-amber-300">"Belum jadi"</strong> menjadi <strong className="text-emerald-300">"Sudah jadi"</strong>), website KTM UPNVJ akan langsung mendeteksi perubahan dan otomatis mengupdate data di web secara real-time!
          </p>

          {/* Quick Status Pill */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${
              config.spreadsheetUrl 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' 
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${config.spreadsheetUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{config.spreadsheetUrl ? 'Google Spreadsheet Terhubung' : 'Link Spreadsheet Belum Diisi'}</span>
            </div>

            {config.lastSyncTime && (
              <span className="text-emerald-200/80 text-[11px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Terakhir sinkron: {new Date(config.lastSyncTime).toLocaleTimeString('id-ID')} ({new Date(config.lastSyncTime).toLocaleDateString('id-ID')})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Konfigurasi Link Spreadsheet & Pengaturan Auto-Sync</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih metode sinkronisasi data yang paling sesuai dengan kebutuhan dan kebijakan kampus Anda.
            </p>
          </div>

          {/* Sync Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setSyncMode('url'); setStatusFeedback(null); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                syncMode === 'url' ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode 1: Tautan URL (Auto-Sync)
            </button>
            <button
              type="button"
              onClick={() => { setSyncMode('paste'); setStatusFeedback(null); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                syncMode === 'paste' ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode 2: Tempel Data (Copy-Paste)
            </button>
          </div>
        </div>

        {syncMode === 'url' ? (
          /* Mode 1: URL Auto-Sync Form */
          <form onSubmit={handleSaveAndSync} className="space-y-5">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Link Google Spreadsheet (URL) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0"
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  required
                />
                {inputUrl && (
                  <a
                    href={inputUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3.5 top-3 p-1 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                    title="Buka Spreadsheet di tab baru"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Contoh link: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800">https://docs.google.com/spreadsheets/d/[ID_SPREADSHEET]/edit</code> atau link Publikasikan ke Web.</span>
              </p>
            </div>

            {/* Sync Frequency & Auto-Sync Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Auto-Sync di Latar Belakang</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Secara berkala memeriksa perubahan data di spreadsheet tanpa perlu klik tombol.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Interval Pengecekan Otomatis
                </label>
                <select
                  value={intervalSecs}
                  onChange={(e) => setIntervalSecs(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value={30}>Setiap 30 Detik (Cepat / Real-Time)</option>
                  <option value={60}>Setiap 1 Menit (Direkomendasikan)</option>
                  <option value={300}>Setiap 5 Menit</option>
                  <option value={900}>Setiap 15 Menit</option>
                  <option value={3600}>Setiap 1 Jam</option>
                </select>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSyncing || !inputUrl.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sedang Mensinkronkan...' : 'Simpan Link & Sinkronkan Sekarang'}</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateChange}
                disabled={isSimulating || isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-98 transition-all border border-slate-200"
                title="Uji coba perubahan status mahasiswa secara instan untuk verifikasi"
              >
                <Play className={`w-3.5 h-3.5 text-amber-600 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Memproses Simulasi...' : 'Uji Coba Ubah Status (Simulasi 1-Klik)'}</span>
              </button>

              <button
                type="button"
                onClick={copyHeaderTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors ml-auto"
              >
                {copiedHeader ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedHeader ? 'Header Disalin!' : 'Salin Format Kolom Spreadsheet'}</span>
              </button>
            </div>

          </form>
        ) : (
          /* Mode 2: Direct Paste Form */
          <form onSubmit={handlePasteSync} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tempel Data Spreadsheet Langsung (Copy-Paste)
                </label>
                <button
                  type="button"
                  onClick={copyHeaderTemplate}
                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Lihat Format Header Kolom</span>
                </button>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Buka Google Sheets Anda, pilih/blok semua data (Ctrl+A), tekan Salin (Ctrl+C), lalu tempelkan (Ctrl+V) di kotak ini..."
                rows={8}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 leading-relaxed"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Metode ini 100% instan dan tidak terpengaruh batasan internet atau proteksi domain akun Google Workspace kampus Anda.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isSyncing || !pastedText.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sedang Memproses...' : 'Sinkronkan Data Tempelan Sekarang'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPastedText('')}
                disabled={!pastedText}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Kosongkan Kotak
              </button>
            </div>
          </form>
        )}

        {/* Feedback Alert */}
        {statusFeedback && (
          <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in duration-150 ${
            statusFeedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : statusFeedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-teal-50 border-teal-200 text-teal-800'
          }`}>
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusFeedback.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-bold">{statusFeedback.type === 'success' ? 'Sukses' : statusFeedback.type === 'error' ? 'Peringatan' : 'Informasi'}</p>
              <p className="mt-0.5 leading-relaxed">{statusFeedback.message}</p>
            </div>
          </div>
        )}

      </div>

      {/* Security Guarantee & Step Instruction Guide */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-5">
        
        {/* Security Reassurance Callout */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5 font-black text-xs">
            VIEWER ONLY
          </div>
          <div className="space-y-1">
            <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
              Apakah Aman Jika Link Diatur ke "Only Viewer" (Pelihat Saja)?
            </p>
            <p className="text-slate-700 leading-relaxed text-[11px] sm:text-xs">
              <strong>SANGAT BISA DAN MEMANG WAJIB HANYA "VIEWER" (PELIHAT)!</strong> Website KTM UPNVJ hanya memerlukan hak akses <strong>Baca (Read-Only)</strong>. Anda <strong>TIDAK PERLU</strong> memberikan hak akses <em>Editor</em> kepada siapa pun. Dengan akses Pelihat (Viewer), publik maupun website tidak dapat mengubah atau merusak rumus di spreadsheet Anda. Data hanya bisa diubah oleh Anda sendiri melalui akun Google Drive Anda.
            </p>
          </div>
        </div>

        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>2 Cara Mudah Menghubungkan Google Spreadsheet (Pilih Salah Satu)</span>
        </h4>

        {/* Method 1: Share Link (Viewer) */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full inline-block">
            Metode 1: Tautan Berbagi Google Drive (Paling Populer)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[10px]">1</span>
              <p className="font-bold text-slate-900">Klik "Bagikan / Share"</p>
              <p className="text-[11px] text-slate-500">Buka Google Sheets di laptop/komputer Anda, lalu klik tombol biru <strong>Bagikan</strong> di kanan atas.</p>
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[10px]">2</span>
              <p className="font-bold text-slate-900">Pilih "Pelihat (Viewer)"</p>
              <p className="text-[11px] text-slate-500">Di Akses Umum, pilih <strong>Siapa saja yang memiliki link</strong> dengan peran <strong>Pelihat (Viewer)</strong>.</p>
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[10px]">3</span>
              <p className="font-bold text-slate-900">Salin & Tempel Link</p>
              <p className="text-[11px] text-slate-500">Klik <strong>Salin link</strong>, lalu tempel ke kolom di atas dan klik tombol hijau di atas.</p>
            </div>
          </div>
        </div>

        {/* Method 2: Publish to Web */}
        <div className="space-y-2 pt-2 border-t border-slate-200/80">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full inline-block">
            Metode 2: Menu File → Bagikan → Publikasikan ke Web (Resmi & Sangat Cepat)
          </span>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-700 leading-relaxed">
            <p>
              Di Google Sheets, klik menu <strong>File</strong> $\rightarrow$ <strong>Bagikan</strong> $\rightarrow$ <strong>Publikasikan ke web</strong>. Pilih tab lembar mahasiswa Anda, pilih format <strong>Nilai yang dipisahkan koma (.csv)</strong> atau <strong>Halaman web</strong>, lalu klik <strong>Publikasikan</strong>. Tautan yang dihasilkan aman 100% dan berstatus <em>View-Only</em> murni.
            </p>
          </div>
        </div>

      </div>

      {/* Recent Synchronized Changes (Diff Viewer) */}
      {config.lastChanges && config.lastChanges.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-emerald-600" />
                <span>Perubahan Status KTM yang Baru Saja Tersinkron ({config.lastChanges.length} Mahasiswa)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar mahasiswa yang statusnya otomatis berubah mengikuti update di Google Spreadsheet.
              </p>
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
              Live Diff
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {config.lastChanges.map((change, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{change.nama}</p>
                  <p className="text-[11px] text-slate-500">NIM: <code className="font-mono text-slate-700">{change.nim}</code></p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {change.oldStatus}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {change.newStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync History Logs */}
      {config.syncHistory && config.syncHistory.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Riwayat Sinkronisasi Spreadsheet Terakhir</span>
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Baris Terbaca</th>
                  <th className="py-2.5 px-3">Status Berubah</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {config.syncHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {new Date(item.timestamp).toLocaleTimeString('id-ID')} ({new Date(item.timestamp).toLocaleDateString('id-ID')})
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.status === 'success' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status === 'success' ? 'Berhasil' : 'Gagal'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {item.totalRows > 0 ? `${item.totalRows} baris` : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.statusChangesCount > 0 ? (
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          +{item.statusChangesCount} status
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={item.message}>
                      {item.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
