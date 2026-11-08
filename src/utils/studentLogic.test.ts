import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNIM, calculateStudentStatistics, filterAndSearchStudents } from './studentLogic';
import { Student } from '../types';

const sampleStudents: Student[] = [
  {
    no: 1,
    nim: '2610111002',
    nama: 'AULIA RIFINA GANI',
    programStudi: 'S1 Manajemen',
    keterangan: 'Sudah jadi',
    statusKTM: 'Sudah jadi',
    jadwal: 'Senin, 9 November 2026',
    hariDistribusi: 'Senin',
    tanggalDistribusi: '9 November 2026',
    waktuDistribusi: '09:00 s.d 16:00 WIB',
    lokasiDistribusi: 'Gedung FEB Lt. 1',
    angkatan: '2026',
    syaratPengambilan: []
  },
  {
    no: 138,
    nim: '2610111139',
    nama: 'LUVENA SHARETA ATHAMI',
    programStudi: 'S1 Manajemen',
    keterangan: 'Proses pembuatan',
    statusKTM: 'Proses pembuatan',
    jadwal: 'Dijadwalkan kemudian',
    hariDistribusi: 'Dijadwalkan kemudian',
    tanggalDistribusi: 'Dijadwalkan kemudian',
    waktuDistribusi: 'Dijadwalkan kemudian',
    lokasiDistribusi: 'Gedung FEB Lt. 1',
    angkatan: '2026',
    syaratPengambilan: []
  },
  {
    no: 313,
    nim: '2610112001',
    nama: 'EDGINA KHANSA MARITZA',
    programStudi: 'S1 Akuntansi',
    keterangan: 'Sudah jadi',
    statusKTM: 'Sudah jadi',
    jadwal: 'Selasa, 10 November 2026',
    hariDistribusi: 'Selasa',
    tanggalDistribusi: '10 November 2026',
    waktuDistribusi: '09:00 s.d 16:00 WIB',
    lokasiDistribusi: 'Gedung FEB Lt. 1',
    angkatan: '2026',
    syaratPengambilan: []
  }
];

test('validateNIM handles valid and invalid NIM numbers', () => {
  assert.equal(validateNIM('2610111002').isValid, true);
  assert.equal(validateNIM('261011100').isValid, false);
  assert.equal(validateNIM('abc1234567').isValid, false);
  assert.equal(validateNIM('').isValid, false);
});

test('calculateStudentStatistics counts statuses and percentages correctly', () => {
  const stats = calculateStudentStatistics(sampleStudents);
  assert.equal(stats.totalStudents, 3);
  assert.equal(stats.totalSudahJadi, 2);
  assert.equal(stats.totalProses, 1);
  assert.equal(stats.percentageSudahJadi, 67);
  assert.equal(stats.prodiBreakdown['S1 Manajemen'].total, 2);
  assert.equal(stats.prodiBreakdown['S1 Akuntansi'].total, 1);
});

test('filterAndSearchStudents handles search queries, filtering, and pagination', () => {
  // Search by partial name
  const resName = filterAndSearchStudents(sampleStudents, { search: 'luvena' });
  assert.equal(resName.total, 1);
  assert.equal(resName.data[0].nim, '2610111139');

  // Search by NIM prefix
  const resNim = filterAndSearchStudents(sampleStudents, { search: '2610112' });
  assert.equal(resNim.total, 1);
  assert.equal(resNim.data[0].nama, 'EDGINA KHANSA MARITZA');

  // Filter by Prodi
  const resProdi = filterAndSearchStudents(sampleStudents, { prodi: 'S1 Manajemen' });
  assert.equal(resProdi.total, 2);

  // Filter by Status
  const resStatus = filterAndSearchStudents(sampleStudents, { status: 'Proses pembuatan' });
  assert.equal(resStatus.total, 1);
  assert.equal(resStatus.data[0].statusKTM, 'Proses pembuatan');
});
