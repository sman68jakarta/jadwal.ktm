import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminOverview } from './AdminOverview';
import { StudentManagement } from './StudentManagement';
import { ScheduleManagement } from './ScheduleManagement';
import { MonitoringDistribution } from './MonitoringDistribution';
import { ImportExportExcel } from './ImportExportExcel';
import { AnnouncementManagement } from './AnnouncementManagement';
import { UserManagement } from './UserManagement';
import { AuditLogViewer } from './AuditLogViewer';
import { AdminSettings } from './AdminSettings';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface AdminLayoutProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onNavigatePublic: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  onLogout,
  onNavigatePublic
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  // 1. Role Guard: Deny access if not logged in as Admin, Super Admin, or Petugas
  const isAuthorized = currentUser && (
    currentUser.role === 'super_admin' || 
    currentUser.role === 'admin' || 
    currentUser.role === 'petugas' ||
    currentUser.role === 'staff'
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Akses Ditolak (Unauthorized)</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Halaman ini merupakan portal khusus Administrator dan Petugas Distribusi FEB UPNVJ 2026. Anda tidak memiliki hak otorisasi untuk mengakses area ini.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigatePublic}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              type="button"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Mahasiswa</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleQuickSearch = (query: string) => {
    setQuickSearchQuery(query);
    setActiveTab('students');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-900 antialiased">
      
      {/* Sidebar Navigation */}
      <AdminSidebar
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={onLogout}
        onNavigatePublic={onNavigatePublic}
      />

      {/* Main Administrative Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header */}
        <AdminHeader
          currentUser={currentUser}
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigatePublic={onNavigatePublic}
          onQuickSearch={handleQuickSearch}
        />

        {/* Tab Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <AdminOverview
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'students' && (
            <StudentManagement
              currentUser={currentUser}
              initialSearch={quickSearchQuery}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'schedules' && (
            <ScheduleManagement currentUser={currentUser} />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringDistribution currentUser={currentUser} />
          )}

          {activeTab === 'import-export' && (
            <ImportExportExcel currentUser={currentUser} />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementManagement currentUser={currentUser} />
          )}

          {activeTab === 'users' && (
            <UserManagement currentUser={currentUser} />
          )}

          {activeTab === 'audit-logs' && (
            <AuditLogViewer currentUser={currentUser} />
          )}

          {activeTab === 'settings' && (
            <AdminSettings currentUser={currentUser} />
          )}
        </main>

        {/* Admin Footer bar */}
        <footer className="py-3 px-6 bg-white border-t border-slate-200/80 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
          <p>© 2026 Universitas Pembangunan Nasional &quot;Veteran&quot; Jakarta — Admin Panel FEB</p>
          <p className="font-mono text-slate-400 text-[10px]">v2.6.0 • Cloud Firestore Connected</p>
        </footer>

      </div>

    </div>
  );
};
