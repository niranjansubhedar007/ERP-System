import React from 'react';

const STATUS_STYLES = {
  // Customer Orders
  pending:       'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  confirmed:     'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  in_production: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  ready:         'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  dispatched:    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  delivered:     'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  cancelled:     'bg-red-50 text-red-700 ring-1 ring-red-200',
  // PO
  draft:         'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  sent:          'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  partial:       'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  received:      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  // Production
  planned:       'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  in_progress:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  completed:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
