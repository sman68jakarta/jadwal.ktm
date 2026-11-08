import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from '../types';
import { studentService } from './studentService';

const SESSION_KEY = 'ktm_upnvj_current_session';
const ACCOUNTS_KEY = 'ktm_upnvj_registered_accounts';

// Local storage for registered student credentials (hashed-style local storage without storing plain text in Firestore)
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

// Simple deterministic hash for password checking without sending plaintext passwords to Firestore
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
   * Get current active session from localStorage or Firebase
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
   * Login as Student or Admin
   */
  async login(nimOrEmail: string, password: string):Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanId = nimOrEmail.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'NIM / Email dan Kata Sandi wajib diisi.' };
    }

    // 1. Check for Admin Login
    const isAdminId = cleanId.toLowerCase() === 'admin@upnvj.ac.id' || cleanId.toLowerCase() === 'admin';
    if (isAdminId) {
      if (cleanPass === 'adminupnvj2026' || cleanPass === 'admin' || cleanPass === 'admin123') {
        const adminUser: UserProfile = {
          uid: 'admin-upnvj-root',
          email: 'admin@upnvj.ac.id',
          nama: 'Administrator FEB UPNVJ',
          role: 'admin',
          programStudi: 'Biro Akademik & Kemahasiswaan',
          lastLogin: new Date().toISOString()
        };
        this.setCurrentUser(adminUser);
        return { success: true, user: adminUser };
      } else {
        return { success: false, message: 'Kata sandi akun Administrator salah.' };
      }
    }

    // 2. Check student record in 1089 official database
    const student = await studentService.getStudentByNim(cleanId);
    if (!student) {
      return { 
        success: false, 
        message: 'NIM tidak terdaftar dalam data mahasiswa baru FEB UPNVJ 2026. Periksa kembali NIM Anda.' 
      };
    }

    // 3. Check if account is activated
    const accounts = getStoredAccounts();
    const existingAcc = accounts[cleanId];

    if (!existingAcc) {
      // Allow default initial activation password (NIM itself or prompt activation)
      if (cleanPass === cleanId || cleanPass === 'mhs2026' || cleanPass === '123456') {
        // Auto-activate or allow first-time login
        const newAcc: LocalAccount = {
          nim: student.nim,
          email: `${student.nim}@mahasiswa.upnv.ac.id`,
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
        message: `Akun NIM ${cleanId} belum diaktivasi. Silakan klik "Aktivasi Akun Mahasiswa Baru" untuk mengatur kata sandi Anda.`
      };
    }

    // 4. Verify password
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
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const student = await studentService.getStudentByNim(nim.trim());
    if (!student) {
      return { success: false, message: 'NIM tidak ditemukan dalam data resmi Mahasiswa Baru UPNVJ 2026.' };
    }

    // Name similarity check to prevent unauthorized activation
    const cleanInputName = namaLengkap.trim().toLowerCase();
    const cleanOfficialName = student.nama.trim().toLowerCase();
    
    // Check if at least first word of name matches or includes
    const inputFirstWord = cleanInputName.split(' ')[0];
    const officialFirstWord = cleanOfficialName.split(' ')[0];
    if (inputFirstWord !== officialFirstWord && !cleanOfficialName.includes(inputFirstWord)) {
      return {
        success: false,
        message: 'Konfirmasi nama tidak sesuai dengan data identitas resmi mahasiswa pada NIM ini.'
      };
    }

    if (password.length < 6) {
      return { success: false, message: 'Kata sandi minimal 6 karakter demi keamanan akun Anda.' };
    }

    // Save activation
    const newAcc: LocalAccount = {
      nim: student.nim,
      email: email.trim() || `${student.nim}@mahasiswa.upnv.ac.id`,
      passwordHash: hashPassword(password),
      role: 'student',
      nama: student.nama,
      programStudi: student.programStudi,
      createdAt: new Date().toISOString()
    };
    saveAccount(newAcc);

    // Also register user record in Firestore collection `users` without storing raw password
    try {
      const userDocRef = doc(db, 'users', `mhs-${student.nim}`);
      await setDoc(userDocRef, {
        uid: `mhs-${student.nim}`,
        nim: student.nim,
        nama: student.nama,
        email: newAcc.email,
        role: 'student',
        programStudi: student.programStudi,
        activatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore user doc write skipped/failed:', e);
    }

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
  },

  /**
   * Fast Demo Login for instant testing
   */
  async loginAsDemo(role: 'student-ready' | 'student-process' | 'admin'): Promise<UserProfile> {
    if (role === 'admin') {
      const user: UserProfile = {
        uid: 'admin-upnvj-root',
        email: 'admin@upnvj.ac.id',
        nama: 'Administrator FEB UPNVJ',
        role: 'admin',
        programStudi: 'Biro Akademik & Kemahasiswaan',
        lastLogin: new Date().toISOString()
      };
      this.setCurrentUser(user);
      return user;
    }

    if (role === 'student-process') {
      // NIM 2610111139 - LUVENA SHARETA ATHAMI (Proses pembuatan)
      const student = await studentService.getStudentByNim('2610111139');
      const user: UserProfile = {
        uid: 'mhs-2610111139',
        email: '2610111139@mahasiswa.upnvj.ac.id',
        nama: student ? student.nama : 'LUVENA SHARETA ATHAMI',
        nim: '2610111139',
        role: 'student',
        programStudi: 'S1 Manajemen',
        lastLogin: new Date().toISOString()
      };
      this.setCurrentUser(user);
      return user;
    }

    // Default: NIM 2610111002 - AULIA RIFINA GANI (Sudah jadi)
    const student = await studentService.getStudentByNim('2610111002');
    const user: UserProfile = {
      uid: 'mhs-2610111002',
      email: '2610111002@mahasiswa.upnvj.ac.id',
      nama: student ? student.nama : 'AULIA RIFINA GANI',
      nim: '2610111002',
      role: 'student',
      programStudi: 'S1 Manajemen',
      lastLogin: new Date().toISOString()
    };
    this.setCurrentUser(user);
    return user;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    this.setCurrentUser(null);
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
  }
};
