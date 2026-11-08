# PANDUAN LENGKAP DEPLOYMENT & PENGGUNAAN
## SISTEM INFORMASI JADWAL DISTRIBUSI KTM UPNVJ 2026

Website resmi: **DATA PEMBUATAN DAN PEMBAGIAN KARTU TANDA MAHASISWA BARU UPNVJ 2026 (KTM UPNVJ 2026)**
Fakultas Ekonomi dan Bisnis (FEB) Universitas Pembangunan Nasional "Veteran" Jakarta.

---

### 1. Data 1.089 Mahasiswa Baru (Dari PDF & Excel Resmi)
Aplikasi ini sudah menyertakan seluruh **1.089 data mahasiswa baru FEB 2026** yang diekstrak langsung secara akurat dari file resmi:
- **6 Program Studi:**
  - S1 Manajemen (312 Mahasiswa)
  - S1 Akuntansi (313 Mahasiswa)
  - S1 Ekonomi Pembangunan (118 Mahasiswa)
  - S1 Ekonomi Syariah (114 Mahasiswa)
  - D3 Akuntansi (117 Mahasiswa)
  - D3 Perbankan dan Keuangan (115 Mahasiswa)
- **Status Cetak KTM:**
  - Sudah jadi: 945 Mahasiswa
  - Proses pembuatan: 144 Mahasiswa
- **Jadwal Distribusi:**
  - Senin, 9 November 2026: 303 Mahasiswa (09:00 - 16:00 WIB)
  - Selasa, 10 November 2026: 190 Mahasiswa (09:00 - 16:00 WIB)
  - Rabu, 11 November 2026: 223 Mahasiswa (09:00 - 16:00 WIB)
  - Kamis, 12 November 2026: 228 Mahasiswa (09:00 - 16:00 WIB)
  - Dijadwalkan kemudian: 145 Mahasiswa

---

### 2. Akun & Kredensial Pengujian

#### A. Akun Mahasiswa
- **Mahasiswa 1 (Status: Sudah Jadi)**
  - NIM: `2610111002`
  - Nama: AULIA RIFINA GANI
  - Sandi default awal: `2610111002` atau gunakan tombol **Aktivasi Akun Mahasiswa Baru**
- **Mahasiswa 2 (Status: Proses Pembuatan)**
  - NIM: `2610111139`
  - Nama: LUVENA SHARETA ATHAMI
  - Sandi default awal: `2610111139` atau aktivasi mandiri

#### B. Akun Administrator FEB
- Email/ID: `admin@upnvj.ac.id` (atau ketik `admin`)
- Kata Sandi: `adminupnvj2026`
- Fitur Admin: Manajemen seluruh 1.089 mahasiswa, edit jadwal/status, export Excel, import spreadsheet baru, dan sinkronisasi Firestore.

---

### 3. Konfigurasi Firebase (Auth & Firestore)
Kredensial Firebase project Anda telah terpasang di `src/services/firebase.ts`:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDl8RoTc39s2r8cyLL9JMRL8hpxn377d0M",
  authDomain: "data-pembagian-ktm.firebaseapp.com",
  projectId: "data-pembagian-ktm",
  storageBucket: "data-pembagian-ktm.firebasestorage.app",
  messagingSenderId: "276414422745",
  appId: "1:276414422745:web:f3820bee202f9c33bfe8c8"
};
```

#### Cara Mengatur Firestore Security Rules di Firebase Console:
1. Buka [Firebase Console](https://console.firebase.google.com/) -> Pilih project **data-pembagian-ktm**.
2. Masuk ke menu **Firestore Database** -> Klik tab **Rules**.
3. Salin isi file `firestore.rules` dari repository ini, tempelkan ke editor, lalu klik **Publish**.

#### Cara Sinkronisasi Data ke Firestore:
Login sebagai Admin di website, lalu klik tombol hijau **"Sync ke Firestore"**. Sistem akan menjalankan batch upload seluruh 1.089 record mahasiswa ke Firestore dengan progress bar interaktif.

---

### 4. Cara Push ke GitHub
Buka terminal lokal di folder project:
```bash
# 1. Inisialisasi git (jika belum)
git init

# 2. Tambahkan semua file
git add .

# 3. Commit
git commit -m "feat: Sistem Informasi Jadwal Distribusi KTM UPNVJ 2026"

# 4. Hubungkan remote repository GitHub Anda
git remote add origin https://github.com/USERNAME/ktm-upnvj-2026.git
git branch -M main
git push -u origin main
```

---

### 5. Cara Deploy ke Vercel (Sangat Mudah)
1. Buka [Vercel](https://vercel.com/) dan login dengan akun GitHub Anda.
2. Klik **"Add New Project"** -> Import repository `ktm-upnvj-2026` yang sudah di-push ke GitHub.
3. Vercel akan secara otomatis mendeteksi:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. (Opsional) Di bagian **Environment Variables**, Anda dapat menambahkan variabel jika ingin mengganti konfigurasi:
   - `VITE_FIREBASE_API_KEY`: `AIzaSyDl8RoTc39s2r8cyLL9JMRL8hpxn377d0M`
   - `VITE_FIREBASE_PROJECT_ID`: `data-pembagian-ktm`
5. Klik **"Deploy"**. Dalam ~30 detik, website langsung online dengan domain HTTPS (contoh: `https://ktm-upnvj-2026.vercel.app`).

File `vercel.json` sudah disediakan dalam repositori ini untuk menjamin routing SPA (Single Page Application) bekerja sempurna tanpa error 404 saat me-refresh halaman.

Seluruh aset logo dan poster UPNVJ telah diintegrasikan langsung ke dalam pipeline asset bundling Vite (`src/assets/logo.ts` & `public/logo-upnvj.png`), sehingga otomatis di-hash dan disajikan secara aman tanpa risiko 404 di Vercel, Netlify, maupun domain custom.

---

### 6. Cara Menjalankan Secara Lokal (Local Development)
```bash
# 1. Install dependensi
npm install

# 2. Jalankan server dev
npm run dev
# Buka http://localhost:3000
```
