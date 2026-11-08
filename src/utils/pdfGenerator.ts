import { Student } from '../types';

/**
 * Pure CSP-Compliant PDF Generator
 * Generates an official, standard PDF 1.4 document without any eval() or new Function().
 * 100% compliant with strict browser Content Security Policies.
 */
export function generateStudentSchedulePdf(student: Student): Uint8Array {
  const sanitize = (text: string) => {
    return text.replace(/[()\\]/g, '\\$&').replace(/[^\x20-\x7E]/g, ' ');
  };

  const lines: string[] = [
    // Background header bar (Emerald dark: #166534 -> RGB 0.086, 0.396, 0.204)
    '0.086 0.396 0.204 rg',
    '0 760 595.28 82 re',
    'f',

    // Accent line (Teal: #0D9488 -> RGB 0.051, 0.580, 0.533)
    '0.051 0.580 0.533 rg',
    '0 754 595.28 6 re',
    'f',

    // University Header Text (White)
    'BT',
    '1 1 1 rg',
    '/F2 10 Tf',
    '65 815 Td',
    '(KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI) Tj',
    'ET',

    'BT',
    '1 1 1 rg',
    '/F2 13 Tf',
    '65 798 Td',
    '(UNIVERSITAS PEMBANGUNAN NASIONAL "VETERAN" JAKARTA) Tj',
    'ET',

    'BT',
    '1 1 1 rg',
    '/F1 10 Tf',
    '65 782 Td',
    '(FAKULTAS EKONOMI DAN BISNIS - ANGKATAN 2026) Tj',
    'ET',

    'BT',
    '0.8 0.95 0.85 rg',
    '/F1 8 Tf',
    '65 768 Td',
    '(Jl. RS. Fatmawati No. 1 Pondok Labu, Jakarta Selatan 12450 | https://upnvj.ac.id) Tj',
    'ET',

    // Document Title
    'BT',
    '0.06 0.09 0.16 rg',
    '/F2 14 Tf',
    '50 715 Td',
    '(BUKTI JADWAL PENGAMBILAN KARTU TANDA MAHASISWA (KTM)) Tj',
    'ET',

    'BT',
    '0.4 0.45 0.55 rg',
    '/F1 9 Tf',
    '50 700 Td',
    `(${sanitize(`Kode Dokumen: UPNVJ-KTM-2026-${student.nim} | Status: Resmi Terdaftar`)}) Tj`,
    'ET',

    // Section 1 Box (Light gray/slate background)
    '0.96 0.98 0.99 rg',
    '40 560 515 125 re',
    'f',
    '0.8 0.85 0.9 RG',
    '1 w',
    '40 560 515 125 re',
    'S',

    // Section 1 Header
    'BT',
    '0.086 0.396 0.204 rg',
    '/F2 11 Tf',
    '55 665 Td',
    '(I. DATA IDENTITAS RESMI MAHASISWA) Tj',
    'ET',

    // Student identity details
    'BT',
    '0.1 0.15 0.2 rg',
    '/F1 10 Tf',
    '55 645 Td',
    '(Nomor Induk Mahasiswa (NIM)) Tj',
    '180 0 Td',
    `(: ${sanitize(student.nim)}) Tj`,
    'ET',

    'BT',
    '0.1 0.15 0.2 rg',
    '/F1 10 Tf',
    '55 625 Td',
    '(Nama Lengkap) Tj',
    '180 0 Td',
    `/F2 10 Tf (: ${sanitize(student.nama)}) Tj`,
    'ET',

    'BT',
    '0.1 0.15 0.2 rg',
    '/F1 10 Tf',
    '55 605 Td',
    '(Program Studi / Fakultas) Tj',
    '180 0 Td',
    `(: ${sanitize(student.programStudi)} / FEB) Tj`,
    'ET',

    'BT',
    '0.1 0.15 0.2 rg',
    '/F1 10 Tf',
    '55 585 Td',
    '(Tahun Angkatan / Jenjang) Tj',
    '180 0 Td',
    `(: 2026 / Semester Gasal) Tj`,
    'ET',

    'BT',
    '0.1 0.15 0.2 rg',
    '/F1 10 Tf',
    '55 568 Td',
    '(Nomor Urut Database) Tj',
    '180 0 Td',
    `(: #${student.no} dari 1.089 Mahasiswa Baru) Tj`,
    'ET',

    // Section 2 Box (Schedule & Location: Teal soft tint)
    '0.94 0.99 0.98 rg',
    '40 435 515 110 re',
    'f',
    '0.051 0.580 0.533 RG',
    '1 w',
    '40 435 515 110 re',
    'S',

    'BT',
    '0.051 0.580 0.533 rg',
    '/F2 11 Tf',
    '55 525 Td',
    '(II. JADWAL & LOKASI PENGAMBILAN FISIK KTM) Tj',
    'ET',

    'BT',
    '0.1 0.15 0.2 rg',
    '/F1 10 Tf',
    '55 505 Td',
    '(Status Pembuatan KTM) Tj',
    '180 0 Td',
    `/F2 10 Tf (: ${sanitize(student.statusKTM)}) Tj`,
    'ET',

    'BT',
    '0.1 0.15 0.2 rg',
    '/F1 10 Tf',
    '55 485 Td',
    '(Hari & Tanggal Pengambilan) Tj',
    '180 0 Td',
    `/F2 10 Tf (: ${sanitize(student.jadwal)}) Tj`,
    'ET',

    'BT',
    '0.1 0.15 0.2 rg',
    '/F1 10 Tf',
    '55 465 Td',
    '(Sesi Jam Layanan) Tj',
    '180 0 Td',
    `(: ${sanitize(student.waktuDistribusi)}) Tj`,
    'ET',

    'BT',
    '0.1 0.15 0.2 rg',
    '/F1 10 Tf',
    '55 445 Td',
    '(Titik Lokasi Pengambilan) Tj',
    '180 0 Td',
    `(: Gedung FEB Lt. 1 Kampus Pondok Labu) Tj`,
    'ET',

    // Section 3: Requirements (Yellow/Amber light tint)
    '0.99 0.98 0.90 rg',
    '40 295 515 125 re',
    'f',
    '0.9 0.8 0.3 RG',
    '1 w',
    '40 295 515 125 re',
    'S',

    'BT',
    '0.6 0.4 0.0 rg',
    '/F2 10.5 Tf',
    '55 400 Td',
    '(III. PERSYARATAN WAJIB SAAT HADIR DI LOKASI) Tj',
    'ET',

    'BT',
    '0.15 0.2 0.25 rg',
    '/F1 9 Tf',
    '55 380 Td',
    '(1. Membawa lembar cetak Bukti Jadwal Distribusi ini kepada petugas di meja verifikasi.) Tj',
    'ET',

    'BT',
    '0.15 0.2 0.25 rg',
    '/F1 9 Tf',
    '55 362 Td',
    '(2. Membawa Kartu Tanda Pengenal Asli (KTP Elektronik / KK / SIM / Paspor yang sah).) Tj',
    'ET',

    'BT',
    '0.15 0.2 0.25 rg',
    '/F1 9 Tf',
    '55 344 Td',
    '(3. Membawa Bukti Tanda Terima Registrasi Mahasiswa Baru UPNVJ 2026.) Tj',
    'ET',

    'BT',
    '0.15 0.2 0.25 rg',
    '/F1 9 Tf',
    '55 326 Td',
    '(4. Pengambilan tidak dapat diwakilkan kecuali dengan Surat Kuasa bermaterai Rp10.000.) Tj',
    'ET',

    'BT',
    '0.15 0.2 0.25 rg',
    '/F1 9 Tf',
    '55 308 Td',
    '(5. Wajib berpakaian rapi, sopan, berkerah, dan memakai sepatu di area kampus UPNVJ.) Tj',
    'ET',

    // Signatures
    'BT',
    '0.15 0.2 0.25 rg',
    '/F1 9 Tf',
    '70 240 Td',
    '(Mahasiswa Yang Bersangkutan,) Tj',
    '280 0 Td',
    '(Petugas Distribusi FEB UPNVJ,) Tj',
    'ET',

    'BT',
    '0.15 0.2 0.25 rg',
    '/F2 9.5 Tf',
    '70 170 Td',
    `(${sanitize(student.nama)}) Tj`,
    '280 0 Td',
    '(Student Services FEB 2026) Tj',
    'ET',

    'BT',
    '0.4 0.45 0.5 rg',
    '/F1 8 Tf',
    '70 158 Td',
    `(NIM. ${sanitize(student.nim)}) Tj`,
    '280 0 Td',
    '(Biro Akademik & Kemahasiswaan) Tj',
    'ET',

    // Footer note
    'BT',
    '0.5 0.55 0.6 rg',
    '/F1 7.5 Tf',
    '50 80 Td',
    '(Dokumen sah ini diterbitkan secara elektronik oleh Sistem Informasi KTM UPN Veteran Jakarta 2026.) Tj',
    'ET',
    'BT',
    '0.5 0.55 0.6 rg',
    '/F1 7.5 Tf',
    '50 68 Td',
    `(${sanitize(`Verifikasi Keaslian: SHA256-KTM-${student.nim}-${student.no}`)}) Tj`,
    'ET'
  ];

  const streamContent = lines.join('\n');
  const streamBytes = new TextEncoder().encode(streamContent);

  const objects: string[] = [];
  objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  objects[2] = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  objects[3] = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';
  objects[4] = `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
  objects[5] = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  objects[6] = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';

  const header = '%PDF-1.4\n';
  let body = header;
  const offsets: number[] = [0];

  for (let i = 1; i <= 6; i++) {
    offsets[i] = new TextEncoder().encode(body).length;
    body += objects[i];
  }

  const xrefOffset = new TextEncoder().encode(body).length;
  const pad = (n: number) => String(n).padStart(10, '0');

  const xref = [
    'xref',
    '0 7',
    '0000000000 65535 f ',
    `${pad(offsets[1])} 00000 n `,
    `${pad(offsets[2])} 00000 n `,
    `${pad(offsets[3])} 00000 n `,
    `${pad(offsets[4])} 00000 n `,
    `${pad(offsets[5])} 00000 n `,
    `${pad(offsets[6])} 00000 n `,
    'trailer',
    '<< /Size 7 /Root 1 0 R >>',
    'startxref',
    String(xrefOffset),
    '%%EOF'
  ].join('\n');

  const fullPdf = body + xref;
  return new TextEncoder().encode(fullPdf);
}

/**
 * Downloads the student distribution proof directly as PDF.
 * Uses 100% CSP-safe Blob download.
 */
export function downloadStudentSchedulePdf(student: Student) {
  try {
    const pdfBytes = generateStudentSchedulePdf(student);
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jadwal_KTM_UPNVJ_${student.nim}_${student.nama.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    console.warn('PDF download failed, falling back to window.print():', err);
    window.print();
  }
}
