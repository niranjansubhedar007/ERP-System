import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const VARIANTS = {
  danger:  { icon: AlertTriangle, iconBg: 'bg-red-100',   iconColor: 'text-red-600',   btnClass: 'bg-red-600 hover:bg-red-700' },
  success: { icon: CheckCircle,   iconBg: 'bg-green-100', iconColor: 'text-green-600', btnClass: 'bg-green-600 hover:bg-green-700' },
};

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger' }) {
  if (!open) return null;
  const { icon: Icon, iconBg, iconColor, btnClass } = VARIANTS[variant] || VARIANTS.danger;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={20} className={iconColor} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-lg text-sm ${btnClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
