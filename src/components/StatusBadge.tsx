import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { KTMStatus } from '../types';

interface StatusBadgeProps {
  status: KTMStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  showIcon = true 
}) => {
  const isSudahJadi = status === 'Sudah jadi';
  const isProses = status === 'Proses pembuatan';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1',
    md: 'text-xs font-semibold px-3 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3.5 py-1.5 gap-2'
  }[size];

  if (isSudahJadi) {
    return (
      <span 
        className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium shadow-xs ${sizeClasses}`}
        title="KTM telah selesai dicetak dan siap diambil sesuai jadwal"
      >
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
        <span>Sudah jadi</span>
      </span>
    );
  }

  if (isProses) {
    return (
      <span 
        className={`inline-flex items-center rounded-full bg-teal-50 text-teal-800 border border-teal-300 font-medium shadow-xs ${sizeClasses}`}
        title="KTM sedang dalam tahap pencetakan dan verifikasi bank mitra"
      >
        {showIcon && <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
        <span>Proses pembuatan</span>
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-medium shadow-xs ${sizeClasses}`}
      title="Jadwal distribusi KTM belum ditentukan, pantau berkala"
    >
      {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
      <span>{status || 'Belum dijadwalkan'}</span>
    </span>
  );
};
