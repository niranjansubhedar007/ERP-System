import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Spinner from '../../components/Spinner';
import { RefreshCw } from 'lucide-react';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [pagination, setPagination] = useState(null);

  const fetchInventory = useCallback((p = 1) => {
    setLoading(true);
    api.get(`/inventory?page=${p}&limit=10`)
      .then(r => { setInventory(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const filtered = inventory.filter(i => filter === 'all' || i.type === filter);

  const totalValue = filtered.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.unit_price), 0);

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'type', label: 'Type', render: v => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v === 'raw_material' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
        {v === 'raw_material' ? 'Raw Material' : 'Finished Good'}
      </span>
    )},
    { key: 'quantity', label: 'Qty in Stock', render: (v, row) => (
      <span className={parseFloat(v) <= 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
        {parseFloat(v).toFixed(3)} {row.unit}
      </span>
    )},
    { key: 'unit_price', label: 'Unit Price', render: v => `₹${parseFloat(v).toLocaleString('en-IN')}` },
    { key: 'quantity', label: 'Stock Value', render: (v, row) => `₹${(parseFloat(v) * parseFloat(row.unit_price)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
    { key: 'updated_at', label: 'Last Updated', render: v => v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—' },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Real-time stock levels — updated automatically by all modules"
        action={
          <button onClick={fetchInventory} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            <RefreshCw size={16} /> Refresh
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Stock Value</p>
          <p className="text-2xl font-bold text-slate-900">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-slate-900">{filtered.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Zero / Low Stock</p>
          <p className="text-2xl font-bold text-red-600">{filtered.filter(i => parseFloat(i.quantity) <= 0).length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'raw_material', 'finished_good'].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${filter === t ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-slate-50 border-slate-200 text-slate-600'}`}>
            {t === 'all' ? 'All' : t === 'raw_material' ? 'Raw Materials' : 'Finished Goods'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={filtered} emptyMessage="No inventory records" pagination={pagination} onPageChange={fetchInventory} />}
    </div>
  );
}
