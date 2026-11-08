import React, { useState, useEffect, useMemo } from 'react';
import { AuditLog, UserProfile } from '../../types';
import { auditService } from '../../services/auditService';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Calendar, 
  User, 
  Download, 
  RefreshCw,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AuditLogViewerProps {
  currentUser: UserProfile;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await auditService.getAuditLogs(100);
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (searchVal.trim()) {
        const q = searchVal.toLowerCase().trim();
        const matchDesc = log.description.toLowerCase().includes(q);
        const matchActor = log.actorName.toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        if (!matchDesc && !matchActor && !matchAction) return false;
      }

      if (filterAction !== 'all') {
        if (!log.action.toLowerCase().includes(filterAction.toLowerCase())) return false;
      }

      return true;
    });
  }, [logs, searchVal, filterAction]);

  const handleExportLogs = () => {
    const exportData = filteredLogs.map((l, i) => ({
      'No': i + 1,
      'Waktu (WIB)': new Date(l.timestamp).toLocaleString('id-ID'),
      'Pelaksana': l.actorName,
      'Role': l.actorRole,
      'Aksi': l.action,
      'Entitas': l.entityType,
      'ID Entitas': l.entityId,
      'Keterangan Aktivitas': l.description
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Trail');
    XLSX.writeFile(wb, `Audit_Trail_KTM_UPNVJ_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Audit Trail & Riwayat Aktivitas Sistem
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              IMMUTABLE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap aksi penting (login, perubahan jadwal, impor Excel, serah terima KTM) dicatat secara permanen untuk integritas data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors border border-slate-200"
            title="Muat Ulang Log"
            type="button"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
            type="button"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log (Excel)</span>
          </button>
        </div>
      </div>

      {/* Security Rules Banner Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <p className="font-extrabold text-white">Perlindungan Integritas Koleksi `audit_logs`</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Berdasarkan Firestore Security Rules: <code>allow update, delete: if false;</code>. Riwayat audit tidak dapat dimanipulasi atau dihapus oleh siapapun.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block px-3 py-1 bg-white/10 text-emerald-300 rounded-xl font-mono text-[11px] font-bold shrink-0">
          Enforced by Firestore
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari dalam riwayat aktivitas..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-emerald-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 font-semibold shrink-0">Jenis Aksi:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold w-full sm:w-auto"
          >
            <option value="all">Semua Aksi</option>
            <option value="login">Login / Autentikasi</option>
            <option value="serah terima">Serah Terima KTM</option>
            <option value="mahasiswa">Data Mahasiswa</option>
            <option value="jadwal">Jadwal Distribusi</option>
            <option value="import">Import Excel</option>
            <option value="pengumuman">Pengumuman</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3 w-40">Waktu (WIB)</th>
                <th className="p-3">Pelaksana (Actor)</th>
                <th className="p-3">Tindakan / Aksi</th>
                <th className="p-3">Keterangan Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <span className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin inline-block mr-2" />
                    Memuat catatan audit...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                    Tidak ada catatan audit yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                          {log.actorName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{log.actorName}</p>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
                            {log.actorRole}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 leading-relaxed">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
