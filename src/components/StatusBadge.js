import React from 'react';

const STATUS_STYLES = {
  // Customer Orders
  pending:      'bg-yellow-100 text-yellow-800',
  confirmed:    'bg-blue-100 text-blue-800',
  in_production:'bg-purple-100 text-purple-800',
  ready:        'bg-teal-100 text-teal-800',
  dispatched:   'bg-green-100 text-green-800',
  delivered:    'bg-green-200 text-green-900',
  cancelled:    'bg-red-100 text-red-800',
  // PO
  draft:        'bg-gray-100 text-gray-700',
  sent:         'bg-blue-100 text-blue-800',
  partial:      'bg-orange-100 text-orange-800',
  received:     'bg-green-100 text-green-800',
  // Production
  planned:      'bg-indigo-100 text-indigo-800',
  in_progress:  'bg-yellow-100 text-yellow-800',
  completed:    'bg-green-100 text-green-800',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
