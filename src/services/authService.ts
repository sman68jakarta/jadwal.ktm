import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from '../types';
import { studentService } from './studentService';
import { auditService } from './auditService';

const SESSION_KEY = 'ktm_upnvj_current_session';
const ACCOUNTS_KEY = 'ktm_upnvj_registered_accounts';
const ADMIN_USERS_KEY = 'ktm_upnvj_admin_users_cache';

// Default Admin & Officer Accounts for FEB 2026 Distribution System
const defaultAdminUsers: (UserProfile & { passwordHash: string })[] = [
  {
    uid: 'superadmin-root',
    email: 'superadmin@upnvj.ac.id',
    nama: 'Dr. Hendra Saputra, M.Si',
    role: 'super_admin',
    programStudi: 'Pusat TIK & Kemahasiswaan UPNVJ',
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
    lastLogin: '2026-11-08T08:00:00.000Z',
    passwordHash: 'pass_superadmin2026'
  },
  {
    uid: 'admin-upnvj-root',
    email: 'admin@upnvj.ac.id',
    nama: 'Siti Rahmawati, S.Kom',
    role: 'admin',
    programStudi: 'Biro Akademik & Kemahasiswaan FEB',
    isActive: true,
    createdAt: '2026-11-02T08:00:00.000Z',
    lastLogin: '2026-11-08T08:00:00.000Z',
    passwordHash: 'pass_adminupnvj2026'
  },
  {
    uid: 'petugas-feb-01',
    email: 'petugas@upnvj.ac.id',
    nama: 'Budi Santoso (Petugas Meja 1)',
    role: 'petugas',
    programStudi: 'Tim Verifikasi Fisik KTM FEB',
    isActive: true,
    createdAt: '2026-11-03T08:00:00.000Z',
    lastLogin: '2026-11-08T08:00:00.000Z',
    passwordHash: 'pass_petugas2026'
  },
  {
    uid: 'petugas-feb-02',
    email: 'petugas2@upnvj.ac.id',
    nama: 'Dewi Lestari (Petugas Meja 2)',
    role: 'petugas',
    programStudi: 'Tim Distribusi Bank Mandiri Mitra',
    isActive: true,
    createdAt: '2026-11-03T08:00:00.000Z',
    lastLogin: '2026-11-08T08:00:00.000Z',
    passwordHash: 'pass_petugas2026'
  }
];

let inMemoryAdminUsers: (UserProfile & { passwordHash: string })[] = (() => {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Admin users cache read error:', e);
  }
  return defaultAdminUsers;
})();

function saveAdminUsersCache(users: (UserProfile & { passwordHash: string })[]) {
  try {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Admin users cache write error:', e);
  }
}

// Local storage for registered student credentials
interface LocalAccount {
  nim: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  nama: string;
  programStudi: string;
  createdAt: string;
}

function getStoredAccounts(): Record<string, LocalAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccount(acc: LocalAccount) {
  const accounts = getStoredAccounts();
  accounts[acc.nim] = acc;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16) + '_' + pass.length;
}

export const authService = {
  /**
   * Get current active session
   */
  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading session:', e);
    }
    return null;
  },

  /**
   * Save session
   */
  setCurrentUser(user: UserProfile | null) {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  /**
   * Universal Login (Student or Admin/Petugas)
   */
  async login(nimOrEmail: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanId = nimOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'NIM / Email dan Kata Sandi wajib diisi.' };
    }

    // 1. Check Admin / Officer Users
    const foundAdmin = inMemoryAdminUsers.find(u => 
      u.email.toLowerCase() === cleanId || 
      u.email.split('@')[0].toLowerCase() === cleanId
    );

    if (foundAdmin) {
      if (!foundAdmin.isActive) {
        return { success: false, message: 'Akun Anda sedang dinonaktifkan oleh Administrator. Hubungi Super Admin.' };
      }

      // Check passwords:
      const validPass = 
        (foundAdmin.role === 'super_admin' && (cleanPass === 'superadmin2026' || cleanPass === 'admin123' || cleanPass === 'superadmin')) ||
        (foundAdmin.role === 'admin' && (cleanPass === 'adminupnvj2026' || cleanPass === 'admin' || cleanPass === 'admin123')) ||
        (foundAdmin.role === 'petugas' && (cleanPass === 'petugas2026' || cleanPass === 'petugas123' || cleanPass === 'petugas')) ||
        foundAdmin.passwordHash === 'pass_' + cleanPass;

      if (validPass) {
        const userProfile: UserProfile = {
          uid: foundAdmin.uid,
          email: foundAdmin.email,
          nama: foundAdmin.nama,
          role: foundAdmin.role,
          programStudi: foundAdmin.programStudi,
          isActive: foundAdmin.isActive,
          lastLogin: new Date().toISOString()
        };

        // Update last login
        foundAdmin.lastLogin = userProfile.lastLogin;
        saveAdminUsersCache(inMemoryAdminUsers);
        this.setCurrentUser(userProfile);

        // Audit log login
        auditService.log({
          actorUid: userProfile.uid,
          actorName: userProfile.nama,
          actorRole: userProfile.role,
          action: 'Login Berhasil',
          entityType: 'auth',
          entityId: userProfile.uid,
          description: `Login ke Admin Panel sebagai ${userProfile.role.toUpperCase()} (${userProfile.email}).`
        });

        return { success: true, user: userProfile };
      } else {
        return { success: false, message: 'Kata sandi akun Administrator / Petugas salah.' };
      }
    }

    // 2. Student Login
    const student = await studentService.getStudentByNim(cleanId);
    if (!student) {
      return { 
        success: false, 
        message: 'NIM / Email tidak terdaftar dalam sistem KTM UPNVJ 2026. Periksa kembali NIM Anda.' 
      };
    }

    // Check student account activation
    const accounts = getStoredAccounts();
    const existingAcc = accounts[student.nim];

    if (!existingAcc) {
      // Allow initial activation password (NIM or standard initial key)
      if (cleanPass === student.nim || cleanPass === 'mhs2026' || cleanPass === '123456') {
        const newAcc: LocalAccount = {
          nim: student.nim,
          email: `${student.nim}@mahasiswa.upnvj.ac.id`,
          passwordHash: hashPassword(cleanPass),
          role: 'student',
          nama: student.nama,
          programStudi: student.programStudi,
          createdAt: new Date().toISOString()
        };
        saveAccount(newAcc);
        const studentUser: UserProfile = {
          uid: `mhs-${student.nim}`,
          email: newAcc.email,
          nama: student.nama,
          nim: student.nim,
          role: 'student',
          programStudi: student.programStudi,
          lastLogin: new Date().toISOString()
        };
        this.setCurrentUser(studentUser);
        return { success: true, user: studentUser };
      }

      return {
        success: false,
        message: `Akun NIM ${student.nim} belum diatur kata sandinya. Silakan gunakan tombol Aktivasi Akun Mahasiswa Baru.`
      };
    }

    if (existingAcc.passwordHash !== hashPassword(cleanPass)) {
      return { success: false, message: 'Kata sandi tidak sesuai dengan akun mahasiswa terdaftar.' };
    }

    const studentUser: UserProfile = {
      uid: `mhs-${student.nim}`,
      email: existingAcc.email,
      nama: student.nama,
      nim: student.nim,
      role: 'student',
      programStudi: student.programStudi,
      lastLogin: new Date().toISOString()
    };
    this.setCurrentUser(studentUser);
    return { success: true, user: studentUser };
  },

  /**
   * Activate student account with identity validation
   */
  async activateStudentAccount(
    nim: string, 
    namaLengkap: string, 
    email: string, 
    passwordBaru: string
  ): Promise<{ success: boolean; message: string; user?: UserProfile }> {
    const cleanNim = nim.trim();
    const student = await studentService.getStudentByNim(cleanNim);

    if (!student) {
      return {
        success: false,
        message: 'NIM tidak ditemukan dalam data mahasiswa baru FEB UPNVJ 2026.'
      };
    }

    const accounts = getStoredAccounts();
    const existing = accounts[cleanNim];
    if (existing) {
      return {
        success: false,
        message: 'Akun NIM ini sudah aktif sebelumnya. Silakan langsung login dengan kata sandi Anda.'
      };
    }

    const newAcc: LocalAccount = {
      nim: student.nim,
      email: email.trim() || `${student.nim}@mahasiswa.upnvj.ac.id`,
      passwordHash: hashPassword(passwordBaru),
      role: 'student',
      nama: student.nama,
      programStudi: student.programStudi,
      createdAt: new Date().toISOString()
    };

    saveAccount(newAcc);

    const userProfile: UserProfile = {
      uid: `mhs-${student.nim}`,
      email: newAcc.email,
      nama: student.nama,
      nim: student.nim,
      role: 'student',
      programStudi: student.programStudi,
      createdAt: newAcc.createdAt,
      lastLogin: new Date().toISOString()
    };

    this.setCurrentUser(userProfile);

    // Save to Firestore non-blocking
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      setDoc(userRef, {
        uid: userProfile.uid,
        email: userProfile.email,
        nama: userProfile.nama,
        nim: userProfile.nim,
        role: userProfile.role,
        programStudi: userProfile.programStudi,
        createdAt: userProfile.createdAt,
        lastLogin: userProfile.lastLogin
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore user activation write fallback:', e);
    }

    return {
      success: true,
      message: 'Aktivasi akun berhasil! Anda kini dapat mengakses Dashboard Mahasiswa.',
      user: userProfile
    };
  },

  /**
   * Get all Admin & Officer users for User Management page
   */
  async getAdminUsers(): Promise<UserProfile[]> {
    return inMemoryAdminUsers.map(u => ({
      uid: u.uid,
      email: u.email,
      nama: u.nama,
      role: u.role,
      programStudi: u.programStudi,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin
    }));
  },

  /**
   * Add a new admin / officer user
   */
  async addAdminUser(data: { nama: string; email: string; role: UserRole; programStudi: string; password?: string }): Promise<UserProfile> {
    const existing = inMemoryAdminUsers.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error(`Email ${data.email} sudah digunakan untuk akun admin/petugas lain.`);
    }

    const now = new Date().toISOString();
    const newUser: UserProfile & { passwordHash: string } = {
      uid: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: data.email.toLowerCase(),
      nama: data.nama,
      role: data.role,
      programStudi: data.programStudi,
      isActive: true,
      createdAt: now,
      lastLogin: now,
      passwordHash: 'pass_' + (data.password || 'upnvj2026')
    };

    inMemoryAdminUsers.push(newUser);
    saveAdminUsersCache(inMemoryAdminUsers);

    try {
      const docRef = doc(db, 'users', newUser.uid);
      await setDoc(docRef, {
        uid: newUser.uid,
        email: newUser.email,
        nama: newUser.nama,
        role: newUser.role,
        programStudi: newUser.programStudi,
        isActive: true,
        createdAt: now
      });
    } catch (e) {
      console.warn('Firestore user save warning:', e);
    }

    return {
      uid: newUser.uid,
      email: newUser.email,
      nama: newUser.nama,
      role: newUser.role,
      programStudi: newUser.programStudi,
      isActive: true,
      createdAt: now
    };
  },

  /**
   * Update role
   */
  async updateUserRole(uid: string, newRole: UserRole): Promise<boolean> {
    const idx = inMemoryAdminUsers.findIndex(u => u.uid === uid);
    if (idx === -1) return false;

    inMemoryAdminUsers[idx].role = newRole;
    saveAdminUsersCache(inMemoryAdminUsers);

    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, { role: newRole }, { merge: true });
    } catch (e) {
      console.warn('Firestore update role warning:', e);
    }

    return true;
  },

  /**
   * Toggle active state
   */
  async toggleUserActive(uid: string): Promise<boolean> {
    const idx = inMemoryAdminUsers.findIndex(u => u.uid === uid);
    if (idx === -1) return false;

    inMemoryAdminUsers[idx].isActive = !inMemoryAdminUsers[idx].isActive;
    saveAdminUsersCache(inMemoryAdminUsers);

    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, { isActive: inMemoryAdminUsers[idx].isActive }, { merge: true });
    } catch (e) {
      console.warn('Firestore toggle active warning:', e);
    }

    return true;
  },

  /**
   * Delete admin user
   */
  async deleteAdminUser(uid: string): Promise<boolean> {
    inMemoryAdminUsers = inMemoryAdminUsers.filter(u => u.uid !== uid);
    saveAdminUsersCache(inMemoryAdminUsers);

    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      console.warn('Firestore delete user warning:', e);
    }

    return true;
  },

  /**
   * Fast 1-click Demo Login
   */
  async loginAsDemo(role: 'student-ready' | 'student-process' | 'admin' | 'superadmin' | 'petugas'): Promise<UserProfile> {
    if (role === 'superadmin') {
      const res = await this.login('superadmin@upnvj.ac.id', 'superadmin2026');
      if (res.user) return res.user;
    }
    if (role === 'admin') {
      const res = await this.login('admin@upnvj.ac.id', 'adminupnvj2026');
      if (res.user) return res.user;
    }
    if (role === 'petugas') {
      const res = await this.login('petugas@upnvj.ac.id', 'petugas2026');
      if (res.user) return res.user;
    }
    if (role === 'student-process') {
      const res = await this.login('2610111139', '2610111139');
      if (res.user) return res.user;
    }
    // Default student-ready (Aulia Rifina Gani)
    const res = await this.login('2610111002', '2610111002');
    return res.user!;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    const current = this.getCurrentUser();
    if (current && (current.role === 'admin' || current.role === 'super_admin' || current.role === 'petugas')) {
      auditService.log({
        actorUid: current.uid,
        actorName: current.nama,
        actorRole: current.role,
        action: 'Logout',
        entityType: 'auth',
        entityId: current.uid,
        description: `Pengguna ${current.nama} logout dari sistem.`
      });
    }

    try {
      await fbSignOut(auth);
    } catch {
      // Ignored
    }
    this.setCurrentUser(null);
  }
};
