import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const VARIANTS = {
  danger:  { icon: AlertTriangle, iconBg: 'bg-red-50',   iconColor: 'text-red-500',   btnClass: 'bg-red-600 hover:bg-red-500 shadow-red-600/20' },
  success: { icon: CheckCircle,   iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', btnClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' },
};

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger' }) {
  if (!open) return null;
  const { icon: Icon, iconBg, iconColor, btnClass } = VARIANTS[variant] || VARIANTS.danger;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={19} className={iconColor} />
          </div>
          <div className="pt-0.5">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium shadow-lg transition-colors ${btnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
