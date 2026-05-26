import React, { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import { BarChart3, Package, Factory } from 'lucide-react';

const TABS = [
  { key: 'orders', label: 'Order Report', icon: BarChart3 },
  { key: 'inventory', label: 'Inventory Report', icon: Package },
  { key: 'production', label: 'Production Report', icon: Factory },
];

export default function Reports() {
  const [tab, setTab] = useState('orders');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '', status: '', type: '' });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      const r = await api.get(`/reports/${tab}?${params}`);
      setData(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate report');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'item_count', label: 'Items' },
    { key: 'total_amount', label: 'Value', render: v => `₹${parseFloat(v || 0).toLocaleString('en-IN')}` },
    { key: 'po_count', label: 'POs' },
    { key: 'production_count', label: 'Productions' },
    { key: 'sale_count', label: 'Sales' },
    { key: 'created_at', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
  ];

  const inventoryColumns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'type', label: 'Type', render: v => v === 'raw_material' ? 'Raw Material' : 'Finished Good' },
    { key: 'unit', label: 'Unit' },
    { key: 'quantity', label: 'Stock', render: (v, row) => `${parseFloat(v).toFixed(3)} ${row.unit}` },
    { key: 'unit_price', label: 'Unit Price', render: v => `₹${parseFloat(v).toLocaleString('en-IN')}` },
    { key: 'stock_value', label: 'Stock Value', render: v => `₹${parseFloat(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
    { key: 'updated_at', label: 'Last Updated', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
  ];

  const productionColumns = [
    { key: 'production_number', label: 'PRD #' },
    { key: 'customer_order_number', label: 'Customer Order', render: v => v || '—' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'started_at', label: 'Started', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'completed_at', label: 'Completed', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'created_at', label: 'Created', render: v => new Date(v).toLocaleDateString('en-IN') },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Order, Inventory, and Production analytics" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); setData(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === key ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50 border-gray-200 text-gray-600'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {tab === 'orders' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                {['pending','confirmed','in_production','ready','dispatched','cancelled'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          )}
          {tab === 'inventory' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                <option value="raw_material">Raw Material</option>
                <option value="finished_good">Finished Good</option>
              </select>
            </div>
          )}
          {tab === 'production' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                {['planned','in_progress','completed','cancelled'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={fetchReport} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Generate Report
          </button>
        </div>
      </div>

      {loading && <Spinner />}

      {!loading && data && (
        <div className="space-y-4">
          {/* Summary */}
          {data.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(data.summary).map(([key, val]) => (
                <div key={key} className="bg-white border rounded-xl p-4">
                  <p className="text-xs text-gray-500 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {typeof val === 'object' ? JSON.stringify(val) :
                      key.includes('value') ? `₹${parseFloat(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : val}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {tab === 'orders' && <Table columns={orderColumns} data={data.orders || []} />}
          {tab === 'inventory' && <Table columns={inventoryColumns} data={data.inventory || []} />}
          {tab === 'production' && <Table columns={productionColumns} data={data.production_orders || []} />}
        </div>
      )}

      {!loading && !data && (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
          <p>Set filters and click "Generate Report" to view data</p>
        </div>
      )}
    </div>
  );
}
