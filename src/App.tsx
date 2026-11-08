/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { authService } from './services/authService';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentSchedule } from './pages/StudentSchedule';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { HelpPage } from './pages/HelpPage';
import { ArrowUp, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [currentView, setCurrentView] = useState<string>('landing');
  const [prefilledNim, setPrefilledNim] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdminRole = (user: UserProfile | null) => {
    return user && (
      user.role === 'super_admin' || 
      user.role === 'admin' || 
      user.role === 'petugas' || 
      user.role === 'staff'
    );
  };

  const handleNavigate = (view: string) => {
    // Protected route check
    if ((view === 'dashboard' || view === 'schedule') && !currentUser) {
      setCurrentView('login');
      return;
    }
    if (view === 'admin-dashboard' && !isAdminRole(currentUser)) {
      // Direct to admin-login if not authenticated as admin
      setCurrentView('admin-login');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (isAdminRole(user)) {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToLogin = (nim?: string) => {
    if (nim) setPrefilledNim(nim);
    setCurrentView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If in dedicated Admin Panel, render AdminLayout as a separate, self-contained dashboard
  if (currentView === 'admin-dashboard') {
    return (
      <AdminLayout
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigatePublic={() => handleNavigate('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Universal Navigation for Public & Student Views */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onNavigateLogin={handleGoToLogin}
            onNavigateAdminLogin={() => handleNavigate('admin-login')}
            onNavigateHelp={() => handleNavigate('help')}
          />
        )}

        {currentView === 'login' && (
          <LoginPage
            initialNim={prefilledNim}
            initialMode="student"
            onLoginSuccess={handleLoginSuccess}
            onNavigateHelp={() => handleNavigate('help')}
          />
        )}

        {currentView === 'admin-login' && (
          <LoginPage
            initialMode="admin"
            onLoginSuccess={handleLoginSuccess}
            onNavigateHelp={() => handleNavigate('help')}
          />
        )}

        {currentView === 'dashboard' && currentUser?.role === 'student' && (
          <StudentDashboard
            currentUser={currentUser}
            onNavigateSchedule={() => handleNavigate('schedule')}
            onNavigateAnnouncements={() => handleNavigate('announcements')}
          />
        )}

        {currentView === 'schedule' && currentUser?.role === 'student' && (
          <StudentSchedule
            currentUser={currentUser}
            onBackToDashboard={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'announcements' && (
          <AnnouncementsPage currentUser={currentUser} />
        )}

        {currentView === 'help' && (
          <HelpPage />
        )}

        {/* Fallback Unauthorized State */}
        {((currentView === 'dashboard' || currentView === 'schedule') && !currentUser) && (
          <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">Akses Terbatas</h2>
            <p className="text-xs text-slate-600">
              Anda harus login sebagai mahasiswa untuk mengakses informasi jadwal dan KTM pribadi Anda.
            </p>
            <button
              onClick={() => handleNavigate('login')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
            >
              Menuju Halaman Login
            </button>
          </div>
        )}
      </main>

      {/* Universal University Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Back to top floating button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800 transition-all z-30 focus:outline-hidden hover:scale-105"
          title="Kembali ke atas"
          type="button"
          aria-label="Kembali ke atas"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

    </div>
  );
}
