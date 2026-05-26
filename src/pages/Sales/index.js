import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { Plus, Eye, Send, Trash2 } from 'lucide-react';

export default function Sales() {
  const { hasRole } = useAuth();
  const [saleOrders, setSaleOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewSale, setViewSale] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [form, setForm] = useState({ customer_order_id: '', notes: '', items: [{ product_id: '', quantity: '', unit_price: '' }] });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dispatchTarget, setDispatchTarget] = useState(null);

  const [pagination, setPagination] = useState(null);

  const fetchSales = useCallback((p = 1) => {
    setLoading(true);
    api.get(`/sales?page=${p}&limit=10`)
      .then(r => { setSaleOrders(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load sale orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSales(1);
    api.get('/customer-orders').then(r => setCustomerOrders(r.data));
    api.get('/products?type=finished_good').then(r => setFinishedGoods(r.data));
  }, [fetchSales]);

  const handleView = async (id) => { const r = await api.get(`/sales/${id}`); setViewSale(r.data); };

  const handleDispatch = async () => {
    try {
      await api.patch(`/sales/${dispatchTarget.id}/dispatch`);
      toast.success('Order dispatched');
      setDispatchTarget(null);
      fetchSales(1);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/sales/${deleteTarget.id}`); toast.success('Sale order deleted, inventory restored'); setDeleteTarget(null); fetchSales(1); }
    catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: '', unit_price: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sales', form);
      toast.success('Sale order created — inventory updated');
      setShowCreate(false);
      setForm({ customer_order_id: '', notes: '', items: [{ product_id: '', quantity: '', unit_price: '' }] });
      fetchSales(1);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const columns = [
    { key: 'sale_number', label: 'Sale #' },
    { key: 'customer_order_number', label: 'Customer Order' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'total_amount', label: 'Total', render: v => v ? `₹${parseFloat(v).toLocaleString('en-IN')}` : '—' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'dispatched_at', label: 'Dispatched', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'id', label: 'Actions', render: (id, row) => (
      <div className="flex items-center gap-3">
        <button onClick={() => handleView(id)} className="text-indigo-500 hover:text-indigo-700"><Eye size={15} /></button>
        {row.status === 'pending' && hasRole('admin','sales','warehouse') && (
          <button onClick={() => setDispatchTarget(row)} className="text-green-600 hover:text-green-800" title="Dispatch"><Send size={15} /></button>
        )}
        {row.status === 'pending' && hasRole('admin','sales') && (
          <button onClick={() => setDeleteTarget(row)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Sale / Outward" subtitle="Dispatch finished goods to customers"
        action={hasRole('admin','sales','warehouse') && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 btn-primary"><Plus size={16} /> New Sale Order</button>
        )}
      />
      {loading ? <Spinner /> : <Table columns={columns} data={saleOrders} emptyMessage="No sale orders yet" pagination={pagination} onPageChange={fetchSales} />}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Sale / Outward Order" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Customer Order *</label>
              <select required value={form.customer_order_id} onChange={e => setForm({ ...form, customer_order_id: e.target.value })}
                className="form-input">
                <option value="">Select customer order</option>
                {customerOrders.map(co => <option key={co.id} value={co.id}>{co.order_number} – {co.customer_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="form-input" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Items to Dispatch *</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus size={12} /> Add Item</button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <select required value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select product</option>
                  {finishedGoods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <input type="number" min="0.001" step="0.001" required placeholder="Qty" value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex gap-2">
                  <input type="number" min="0" step="0.01" required placeholder="Unit Price ₹" value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Sale Order</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewSale} onClose={() => setViewSale(null)} title={`Sale: ${viewSale?.sale_number}`} size="lg">
        {viewSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Customer:</span> <strong>{viewSale.customer_name}</strong></div>
              <div><span className="text-gray-500">Status:</span> <StatusBadge status={viewSale.status} /></div>
              <div><span className="text-gray-500">Customer Order:</span> {viewSale.customer_order_number}</div>
              <div><span className="text-gray-500">Dispatched:</span> {viewSale.dispatched_at ? new Date(viewSale.dispatched_at).toLocaleString('en-IN') : '—'}</div>
            </div>
            <table className="min-w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Product</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Unit Price</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Total</th>
              </tr></thead>
              <tbody className="divide-y">
                {viewSale.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{item.product_name} ({item.sku})</td>
                    <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-2 text-right">₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 text-right font-medium">₹{(item.quantity * item.unit_price).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!dispatchTarget} onClose={() => setDispatchTarget(null)} onConfirm={handleDispatch}
        title="Dispatch Order"
        message={`Dispatch "${dispatchTarget?.sale_number}" to ${dispatchTarget?.customer_name}? This action cannot be undone.`}
        confirmLabel="Yes, Dispatch" variant="success" />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Sale Order" message={`Delete "${deleteTarget?.sale_number}"? Inventory will be restored.`}
        confirmLabel="Delete" variant="danger" />
    </div>
  );
}
