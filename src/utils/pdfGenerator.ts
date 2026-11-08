import { jsPDF } from 'jspdf';
import { Student } from '../types';

export function downloadStudentSchedulePdf(student: Student) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background banner (Hijau gelap & Biru tosca)
  doc.setFillColor(22, 101, 52); // #166534
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFillColor(13, 148, 136); // #0D9488
  doc.rect(0, 38, pageWidth, 3, 'F');

  // University Header text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(13);
  doc.text('UNIVERSITAS PEMBANGUNAN NASIONAL "VETERAN" JAKARTA', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('FAKULTAS EKONOMI DAN BISNIS - ANGKATAN 2026', pageWidth / 2, 24, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Jl. RS. Fatmawati No. 1 Pondok Labu, Jakarta Selatan 12450 | https://upnvj.ac.id', pageWidth / 2, 30, { align: 'center' });

  // Document Title
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BUKTI JADWAL PENGAMBILAN KARTU TANDA MAHASISWA (KTM)', pageWidth / 2, 50, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB`, pageWidth / 2, 56, { align: 'center' });

  // Border frame for student identity
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 62, pageWidth - 30, 48, 3, 3, 'FD');

  // Section: Identitas Mahasiswa
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('I. DATA IDENTITAS MAHASISWA', 20, 70);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const leftColX = 22;
  const valueColX = 65;

  doc.text('Nomor Induk Mahasiswa (NIM)', leftColX, 78);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${student.nim}`, valueColX, 78);

  doc.setFont('helvetica', 'normal');
  doc.text('Nama Lengkap', leftColX, 85);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${student.nama}`, valueColX, 85);

  doc.setFont('helvetica', 'normal');
  doc.text('Program Studi', leftColX, 92);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${student.programStudi}`, valueColX, 92);

  doc.setFont('helvetica', 'normal');
  doc.text('Tahun Angkatan / Jenjang', leftColX, 99);
  doc.setFont('helvetica', 'bold');
  doc.text(`: 2026 / Mahasiswa Baru (FEB UPNVJ)`, valueColX, 99);

  // Border frame for Distribution Schedule
  doc.setDrawColor(13, 148, 136);
  doc.setFillColor(240, 253, 250); // teal-50
  doc.roundedRect(15, 115, pageWidth - 30, 50, 3, 3, 'FD');

  // Section: Jadwal Distribusi
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('II. JADWAL & STATUS DISTRIBUSI KTM', 20, 123);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  doc.text('Status Pembuatan KTM', leftColX, 131);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${student.statusKTM}`, valueColX, 131);

  doc.setFont('helvetica', 'normal');
  doc.text('Hari & Tanggal Pengambilan', leftColX, 138);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${student.jadwal}`, valueColX, 138);

  doc.setFont('helvetica', 'normal');
  doc.text('Sesi Waktu Layanan', leftColX, 145);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${student.waktuDistribusi}`, valueColX, 145);

  doc.setFont('helvetica', 'normal');
  doc.text('Lokasi Pengambilan', leftColX, 152);
  doc.setFont('helvetica', 'bold');
  const splitLokasi = doc.splitTextToSize(`: ${student.lokasiDistribusi}`, pageWidth - 30 - 55);
  doc.text(splitLokasi, valueColX, 152);

  // Requirements Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(254, 249, 195); // yellow-100 / soft amber
  doc.roundedRect(15, 172, pageWidth - 30, 42, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text('III. PERSYARATAN WAJIB SAAT PENGAMBILAN', 20, 180);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const requirements = [
    '1. Menunjukkan lembar cetak bukti jadwal distribusi KTM ini kepada petugas.',
    '2. Membawa Kartu Tanda Pengenal Asli (KTP / KK / SIM / Paspor yang berlaku).',
    '3. Membawa Bukti Tanda Terima Registrasi Mahasiswa Baru UPNVJ 2026.',
    '4. Pengambilan tidak dapat diwakilkan kecuali dengan Surat Kuasa asli bermaterai Rp10.000.',
    '5. Wajib mengenakan pakaian rapi, sopan, bersepatu (tidak diperkenankan memakai kaos oblong/sandal).'
  ];

  let reqY = 186;
  for (const req of requirements) {
    doc.text(req, 22, reqY);
    reqY += 5;
  }

  // Signatures Area
  const sigY = 224;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  // Left signature (Mahasiswa)
  doc.text('Mahasiswa yang bersangkutan,', 30, sigY);
  doc.text('(Tanda tangan & Nama Terang)', 30, sigY + 24);
  doc.setFont('helvetica', 'bold');
  doc.text(student.nama, 30, sigY + 28);

  // Right signature (Petugas)
  doc.setFont('helvetica', 'normal');
  doc.text('Petugas Distribusi KTM FEB,', pageWidth - 80, sigY);
  doc.text('(Tanda tangan & Cap Validasi)', pageWidth - 80, sigY + 24);
  doc.setFont('helvetica', 'bold');
  doc.text('UPNVJ Student Services', pageWidth - 80, sigY + 28);

  // Footer security notice
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen ini dihasilkan secara otomatis oleh Sistem Informasi Distribusi KTM Baru UPN Veteran Jakarta 2026.', pageWidth / 2, 280, { align: 'center' });
  doc.text(`Kode Validasi Digital: UPNVJ-KTM-${student.nim}-${student.no}`, pageWidth / 2, 284, { align: 'center' });

  // Save the PDF
  doc.save(`Jadwal_KTM_UPNVJ_${student.nim}_${student.nama.replace(/\s+/g, '_')}.pdf`);
}
