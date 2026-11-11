import React, { useState } from 'react';
import { Student, UserProfile, KTMStatus } from '../../types';
import { studentService } from '../../services/studentService';
import { auditService } from '../../services/auditService';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { GoogleSheetsSyncTab } from './GoogleSheetsSyncTab';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  ArrowRight, 
  X,
  Database,
  Sparkles
} from 'lucide-react';

interface ImportExportExcelProps {
  currentUser: UserProfile;
}

export const ImportExportExcel: React.FC<ImportExportExcelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'sheets-sync' | 'import' | 'export'>('sheets-sync');

  // Import State
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'add' | 'update' | 'sync'>('sync');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importSummary, setImportSummary] = useState<{
    total: number;
    inserted: number;
    updated: number;
    duplicates: number;
  } | null>(null);

  // Export State
  const [exportScope, setExportScope] = useState<'all' | 'prodi' | 'status'>('all');
  const [selectedProdi, setSelectedProdi] = useState('S1 Manajemen');
  const [selectedStatus, setSelectedStatus] = useState<KTMStatus>('Sudah jadi');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');

  // Confirmation modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Handle File Upload and Parse
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportSummary(null);
    setValidationErrors([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { raw: false });

        if (!data || data.length === 0) {
          setValidationErrors(['File Excel kosong atau tidak memiliki baris data.']);
          return;
        }

        // Validate headers: expect NIM or Nama
        const firstRow = data[0];
        const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());
        const hasNim = keys.some(k => k.includes('nim'));
        const hasNama = keys.some(k => k.includes('nama'));

        if (!hasNim || !hasNama) {
          setValidationErrors([
            'Header kolom tidak lengkap. Kolom wajib: NIM dan NAMA mahasiswa. Kolom lain: Program Studi, Keterangan, Jadwal, Waktu.'
          ]);
        }

        setParsedRows(data);
      } catch (err: any) {
        setValidationErrors(['Gagal membaca file Excel: ' + err.message]);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  // Convert raw row to Student object
  const mapRowToStudent = (row: any, idx: number): Student => {
    const rowKeys = Object.keys(row);
    const findVal = (terms: string[]) => {
      for (const k of rowKeys) {
        const lower = k.toLowerCase().trim();
        if (terms.some(t => lower.includes(t))) {
          return String(row[k] || '').trim();
        }
      }
      return '';
    };

    const nim = findVal(['nim']) || `2610000000${idx}`;
    const nama = (findVal(['nama']) || 'MAHASISWA BARU').toUpperCase();
    const programStudi = findVal(['program studi', 'prodi', 'jurusan']) || 'Fakultas Ekonomi dan Bisnis';
    const rawKet = findVal(['keterangan', 'status']);
    
    let statusKTM: KTMStatus = 'Sudah jadi';
    if (rawKet.toLowerCase().includes('proses')) {
      statusKTM = 'Proses pembuatan';
    } else if (rawKet.toLowerCase().includes('belum') || rawKet.toLowerCase().includes('susulan')) {
      statusKTM = 'Belum dijadwalkan';
    }

    const rawJadwal = findVal(['jadwal', 'hari', 'tanggal']) || 'Senin, 9 November 2026';
    const waktu = findVal(['waktu', 'jam']) || '09:00 - 16:00 WIB';

    return {
      no: idx + 1,
      nim,
      nama,
      programStudi,
      statusKTM,
      keterangan: statusKTM,
      jadwal: rawJadwal,
      hariDistribusi: rawJadwal.includes(',') ? rawJadwal.split(',')[0].trim() : 'Senin',
      tanggalDistribusi: rawJadwal.includes(',') ? rawJadwal.split(',')[1].trim() : rawJadwal,
      waktuDistribusi: waktu,
      lokasiDistribusi: 'Lobby Gedung FEB Lt. 1 Kampus Pondok Labu',
      angkatan: '2026',
      syaratPengambilan: [
        'Kartu Identitas Diri Asli (KTP / KK / SIM / Paspor)',
        'Bukti Registrasi Mahasiswa Baru UPNVJ 2026',
        'Lembar Bukti Jadwal Distribusi KTM resmi'
      ]
    };
  };

  const handleExecuteImport = async () => {
    setIsConfirmOpen(false);
    setIsProcessing(true);
    setProgress({ current: 0, total: parsedRows.length });

    try {
      const studentObjects: Student[] = parsedRows.map((r, i) => mapRowToStudent(r, i));

      const result = await studentService.importStudents(studentObjects, importMode, (curr, tot) => {
        setProgress({ current: curr, total: tot });
      });

      setImportSummary({
        total: parsedRows.length,
        inserted: result.inserted,
        updated: result.updated,
        duplicates: result.duplicates
      });

      await auditService.log({
        actorUid: currentUser.uid,
        actorName: currentUser.nama,
        actorRole: currentUser.role,
        action: 'Import Excel Berhasil',
        entityType: 'import',
        entityId: file?.name || 'excel-upload',
        description: `Import Excel "${file?.name}": ${result.inserted} data baru, ${result.updated} diperbarui (${importMode}).`
      });

    } catch (err: any) {
      setValidationErrors(['Gagal mengimpor data ke Firestore: ' + err.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Report
  const handleDownloadReport = () => {
    if (!importSummary) return;

    const reportData = [
      { Parameter: 'Nama File', Nilai: file?.name || '-' },
      { Parameter: 'Waktu Import', Nilai: new Date().toLocaleString('id-ID') },
      { Parameter: 'Petugas / Admin', Nilai: `${currentUser.nama} (${currentUser.role})` },
      { Parameter: 'Mode Import', Nilai: importMode },
      { Parameter: 'Total Baris Dibaca', Nilai: importSummary.total },
      { Parameter: 'Data Baru Ditambahkan', Nilai: importSummary.inserted },
      { Parameter: 'Data Diperbarui (Update)', Nilai: importSummary.updated },
      { Parameter: 'Data Dilewati / Duplikat', Nilai: importSummary.duplicates },
      { Parameter: 'Status Integrasi', Nilai: 'Berhasil tersinkronisasi ke Firestore' }
    ];

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Import');
    XLSX.writeFile(wb, `Laporan_Import_KTM_UPNVJ_${Date.now()}.xlsx`);
  };

  // Execute Export
  const handleExecuteExport = async () => {
    const allStudents = await studentService.getAllStudents();
    let exportList = allStudents;

    if (exportScope === 'prodi') {
      exportList = allStudents.filter(s => s.programStudi === selectedProdi);
    } else if (exportScope === 'status') {
      exportList = allStudents.filter(s => (s.statusKTM || s.keterangan) === selectedStatus);
    }

    const rows = exportList.map((s, idx) => ({
      'No.': idx + 1,
      'NIM': String(s.nim),
      'NAMA': s.nama,
      'Program Studi': s.programStudi,
      'Keterangan': s.statusKTM || s.keterangan,
      'Jadwal': s.hariDistribusi ? `${s.hariDistribusi}, ${s.tanggalDistribusi}` : s.jadwal,
      'Waktu': s.waktuDistribusi || '09:00 - 16:00 WIB',
      'Lokasi': s.lokasiDistribusi || 'Lobby Gedung FEB Lt. 1 Kampus Pondok Labu',
      'Status Serah Terima': s.statusKTM === 'Sudah Didistribusikan' ? 'Telah Diterima' : 'Belum Diambil'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Distribusi KTM FEB');

    const fileName = `Data_Distribusi_KTM_UPNVJ_2026_${exportScope}_${Date.now()}.${exportFormat}`;
    if (exportFormat === 'csv') {
      XLSX.writeFile(wb, fileName, { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, fileName, { bookType: 'xlsx' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Tab Switcher: Sheets Sync vs Upload Import vs Export */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sheets-sync')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'sheets-sync'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          type="button"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Sinkronisasi Google Spreadsheet Real-Time</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'import'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          type="button"
        >
          <Upload className="w-4 h-4" />
          <span>Upload File Excel (.xlsx)</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'export'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          type="button"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel & CSV</span>
        </button>
      </div>

      {activeTab === 'sheets-sync' && (
        <GoogleSheetsSyncTab currentUser={currentUser} />
      )}

      {activeTab === 'import' && (
        <div className="space-y-6">
          
          {/* Section: Upload Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Unggah File Excel Distribusi Mahasiswa
              </h3>
              <p className="text-xs text-slate-500">
                Mendukung format .XLSX dan .XLS resmi dari universitas atau fakultas.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-800">
                {file ? file.name : 'Klik atau seret file Excel ke area ini'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Format: .XLSX atau .XLS (Maks. 10MB)'}
              </p>
            </div>

            {validationErrors.length > 0 && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Validasi Gagal:</span>
                </div>
                {validationErrors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}
          </div>

          {/* Section: Preview & Mode Selector (When file loaded) */}
          {parsedRows.length > 0 && !importSummary && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Pratinjau Data (Terbaca {parsedRows.length} Baris)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Menampilkan 5 baris pertama untuk validasi kolom sebelum sinkronisasi Firestore.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                  Valid
                </span>
              </div>

              {/* Sample Table Preview */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">NIM</th>
                      <th className="p-2.5">Nama</th>
                      <th className="p-2.5">Program Studi</th>
                      <th className="p-2.5">Status/Keterangan</th>
                      <th className="p-2.5">Jadwal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, i) => {
                      const sample = mapRowToStudent(row, i);
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-[11px] text-slate-500">#{sample.no}</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{sample.nim}</td>
                          <td className="p-2.5 font-bold text-slate-900">{sample.nama}</td>
                          <td className="p-2.5 text-slate-700">{sample.programStudi}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {sample.statusKTM}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700">{sample.jadwal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Import Mode Radio */}
              <div className="space-y-3 pt-2">
                <label className="block font-bold text-xs text-slate-800">Pilih Mode Import:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <label className={`p-3.5 rounded-xl border cursor-pointer transition-all ${importMode === 'sync' ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="sync"
                      checked={importMode === 'sync'}
                      onChange={() => setImportMode('sync')}
                      className="sr-only"
                    />
                    <p className="font-extrabold text-slate-900">Sinkronisasi Penuh</p>
                    <p className="text-[11px] text-slate-500 mt-1">Perbarui data yang sudah ada berdasarkan NIM & tambahkan data baru.</p>
                  </label>

                  <label className={`p-3.5 rounded-xl border cursor-pointer transition-all ${importMode === 'update' ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="update"
                      checked={importMode === 'update'}
                      onChange={() => setImportMode('update')}
                      className="sr-only"
                    />
                    <p className="font-extrabold text-slate-900">Perbarui Saja</p>
                    <p className="text-[11px] text-slate-500 mt-1">Hanya perbarui mahasiswa yang NIM-nya sudah terdaftar.</p>
                  </label>

                  <label className={`p-3.5 rounded-xl border cursor-pointer transition-all ${importMode === 'add' ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="add"
                      checked={importMode === 'add'}
                      onChange={() => setImportMode('add')}
                      className="sr-only"
                    />
                    <p className="font-extrabold text-slate-900">Hanya Tambah Baru</p>
                    <p className="text-[11px] text-slate-500 mt-1">Lewati baris jika NIM mahasiswa sudah ada di database.</p>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedRows([]);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
                >
                  <Database className="w-4 h-4" />
                  <span>Proses Import ({parsedRows.length} Mahasiswa)</span>
                </button>
              </div>

            </div>
          )}

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Sedang mengimpor data ke Firestore...</span>
                <span className="text-emerald-700 font-mono">{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Import Summary Report */}
          {importSummary && (
            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500/40 shadow-sm space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <h4 className="font-extrabold text-base">Import Excel Berhasil Selesai!</h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Total Baris:</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{importSummary.total}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 block">Data Ditambahkan:</span>
                  <p className="text-xl font-black text-emerald-700 mt-1">{importSummary.inserted}</p>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                  <span className="text-teal-800 block">Data Diperbarui:</span>
                  <p className="text-xl font-black text-teal-700 mt-1">{importSummary.updated}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-amber-800 block">Duplikat / Dilewati:</span>
                  <p className="text-xl font-black text-amber-700 mt-1">{importSummary.duplicates}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Laporan Import (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedRows([]);
                    setImportSummary(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {activeTab === 'export' && (
        /* SECTION: EXPORT EXCEL */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Export Data Distribusi Mahasiswa
            </h3>
            <p className="text-xs text-slate-500">
              Unduh data mahasiswa dalam format spreadsheet Excel (.xlsx) atau CSV yang kompatibel dengan Microsoft Excel.
            </p>
          </div>

          <div className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-2">Cakupan Data yang Diekspor:</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="exportScope"
                    value="all"
                    checked={exportScope === 'all'}
                    onChange={() => setExportScope('all')}
                  />
                  <div>
                    <span className="font-bold text-slate-900">Seluruh Data Mahasiswa (1.089 Mhs)</span>
                    <p className="text-[11px] text-slate-500">Mencakup 6 program studi FEB S1 dan D3.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="exportScope"
                    value="prodi"
                    checked={exportScope === 'prodi'}
                    onChange={() => setExportScope('prodi')}
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">Berdasarkan Program Studi Tertentu</span>
                    {exportScope === 'prodi' && (
                      <select
                        value={selectedProdi}
                        onChange={(e) => setSelectedProdi(e.target.value)}
                        className="mt-2 w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="S1 Manajemen">S1 Manajemen</option>
                        <option value="S1 Akuntansi">S1 Akuntansi</option>
                        <option value="S1 Ekonomi Pembangunan">S1 Ekonomi Pembangunan</option>
                        <option value="S1 Ekonomi Syariah">S1 Ekonomi Syariah</option>
                        <option value="D3 Akuntansi">D3 Akuntansi</option>
                        <option value="D3 Perbankan dan Keuangan">D3 Perbankan dan Keuangan</option>
                      </select>
                    )}
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="exportScope"
                    value="status"
                    checked={exportScope === 'status'}
                    onChange={() => setExportScope('status')}
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">Berdasarkan Status Pembuatan KTM</span>
                    {exportScope === 'status' && (
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as KTMStatus)}
                        className="mt-2 w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Sudah jadi">Sudah jadi (Siap Diambil)</option>
                        <option value="Proses pembuatan">Proses pembuatan</option>
                        <option value="Sudah Didistribusikan">Sudah Didistribusikan</option>
                        <option value="Belum dijadwalkan">Belum dijadwalkan</option>
                      </select>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pilihan Format Berkas:</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="xlsx"
                    checked={exportFormat === 'xlsx'}
                    onChange={() => setExportFormat('xlsx')}
                  />
                  <span className="font-bold text-slate-800">Microsoft Excel (.xlsx)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                  />
                  <span className="font-bold text-slate-800">Comma Separated Values (.csv)</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleExecuteExport}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Spreadsheet Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteImport}
        title="Konfirmasi Import Excel ke Firestore"
        message={`Apakah Anda yakin ingin memproses ${parsedRows.length} data mahasiswa dengan mode "${importMode}"? Perubahan akan disimpan ke database Firestore.`}
        confirmText="Ya, Mulai Import"
        variant="info"
      />

    </div>
  );
};
