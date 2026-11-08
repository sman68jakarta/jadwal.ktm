import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'warning',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          btn: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
          bg: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'info':
        return {
          icon: <AlertCircle className="w-6 h-6 text-teal-600" />,
          btn: 'bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-500',
          bg: 'bg-teal-50 text-teal-700 border-teal-200'
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          btn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
          bg: 'bg-amber-50 text-amber-700 border-amber-200'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${styles.bg}`}>
              {styles.icon}
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 text-sm text-slate-600 leading-relaxed">
          {message}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 ${styles.btn}`}
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
