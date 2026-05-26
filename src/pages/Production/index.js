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
import { Plus, Eye, CheckCircle, Trash2 } from 'lucide-react';

export default function Production() {
  const { hasRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [form, setForm] = useState({ customer_order_id: '', notes: '', items: [{ product_id: '', quantity_planned: '' }] });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);

  const [pagination, setPagination] = useState(null);

  const fetchOrders = useCallback((p = 1) => {
    setLoading(true);
    api.get(`/production?page=${p}&limit=10`)
      .then(r => { setOrders(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load production orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders(1);
    api.get('/products?type=finished_good').then(r => setProducts(r.data));
    api.get('/customer-orders').then(r => setCustomerOrders(r.data));
  }, [fetchOrders]);

  const handleView = async (id) => {
    try {
      const r = await api.get(`/production/${id}`);
      setViewOrder(r.data);
    } catch { toast.error('Failed to load details'); }
  };

  const handleComplete = async () => {
    try {
      await api.patch(`/production/${completeTarget.id}/complete`);
      toast.success('Production completed — inventory updated');
      setCompleteTarget(null);

      fetchOrders(1);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/production/${deleteTarget.id}`);
      toast.success('Production order deleted');
      setDeleteTarget(null);
      fetchOrders(1);
    } catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity_planned: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production', { ...form, customer_order_id: form.customer_order_id || null });
      toast.success('Production order created');
      setShowCreate(false);
      setForm({ customer_order_id: '', notes: '', items: [{ product_id: '', quantity_planned: '' }] });
      fetchOrders(1);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const columns = [
    { key: 'production_number', label: 'PRD #' },
    { key: 'customer_order_number', label: 'Customer Order', render: v => v || '—' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
    { key: 'completed_at', label: 'Completed', render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'id', label: 'Actions', render: (id, row) => (
      <div className="flex items-center gap-3">
        <button onClick={() => handleView(id)} className="text-indigo-500 hover:text-indigo-700" title="View"><Eye size={15} /></button>
        {['planned', 'in_progress'].includes(row.status) && hasRole('admin', 'production') && (
          <button onClick={() => setCompleteTarget(row)} className="text-green-600 hover:text-green-800" title="Mark Complete">
            <CheckCircle size={15} />
          </button>
        )}
        {row.status === 'planned' && hasRole('admin', 'production') && (
          <button onClick={() => setDeleteTarget(row)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 size={15} /></button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Production" subtitle="Convert raw materials into finished goods"
        action={hasRole('admin', 'production') && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 btn-primary">
            <Plus size={16} /> New Production Order
          </button>
        )}
      />

      {loading ? <Spinner /> : <Table columns={columns} data={orders} emptyMessage="No production orders yet" pagination={pagination} onPageChange={fetchOrders} />}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Production Order" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Linked Customer Order</label>
              <select value={form.customer_order_id} onChange={e => setForm({ ...form, customer_order_id: e.target.value })}
                className="form-input">
                <option value="">None</option>
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
              <label className="text-sm font-medium text-gray-700">Finished Goods to Produce *</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select required value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select finished good</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <input type="number" min="0.001" step="0.001" required placeholder="Qty" value={item.quantity_planned}
                  onChange={e => updateItem(i, 'quantity_planned', e.target.value)}
                  className="w-32 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Production: ${viewOrder?.production_number}`} size="lg">
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Status:</span> <StatusBadge status={viewOrder.status} /></div>
              <div><span className="text-gray-500">Customer Order:</span> {viewOrder.customer_order_number || '—'}</div>
            </div>
            {viewOrder.items?.map((item, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex justify-between mb-3">
                  <h4 className="font-medium">{item.product_name} ({item.sku})</h4>
                  <span className="text-sm text-gray-500">Qty: {item.quantity_planned} {item.unit}</span>
                </div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Raw Materials Required:</p>
                <table className="min-w-full text-xs">
                  <thead><tr className="bg-gray-50">
                    <th className="px-3 py-1.5 text-left">Material</th>
                    <th className="px-3 py-1.5 text-right">Required</th>
                    <th className="px-3 py-1.5 text-right">In Stock</th>
                    <th className="px-3 py-1.5 text-center">Status</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {item.materials?.map((mat, j) => (
                      <tr key={j}>
                        <td className="px-3 py-1.5">{mat.raw_material_name}</td>
                        <td className="px-3 py-1.5 text-right">{parseFloat(mat.total_required).toFixed(3)} {mat.unit}</td>
                        <td className="px-3 py-1.5 text-right">{parseFloat(mat.in_stock).toFixed(3)} {mat.unit}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${parseFloat(mat.in_stock) >= parseFloat(mat.total_required) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {parseFloat(mat.in_stock) >= parseFloat(mat.total_required) ? 'OK' : 'Low'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!completeTarget} onClose={() => setCompleteTarget(null)} onConfirm={handleComplete}
        title="Complete Production Order"
        message={`Complete "${completeTarget?.production_number}"? Raw materials will be deducted and finished goods added to inventory.`}
        confirmLabel="Yes, Complete" variant="success" />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Production Order" message={`Delete "${deleteTarget?.production_number}"? This cannot be undone.`}
        confirmLabel="Delete" variant="danger" />
    </div>
  );
}
