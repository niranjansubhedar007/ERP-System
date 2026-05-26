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
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';

const EMPTY_FORM = { vendor_id: '', customer_order_id: '', notes: '', items: [{ product_id: '', quantity_ordered: '', unit_price: '' }] };

export default function PurchaseOrders() {
  const { hasRole } = useAuth();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewPO, setViewPO] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [pagination, setPagination] = useState(null);

  const fetchPOs = useCallback((p = 1) => {
    setLoading(true);
    api.get(`/purchase-orders?page=${p}&limit=10`)
      .then(r => { setPos(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load purchase orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPOs(1);
    api.get('/products?type=raw_material').then(r => setRawMaterials(r.data));
    api.get('/products/meta/vendors').then(r => setVendors(r.data));
    api.get('/customer-orders').then(r => setCustomerOrders(r.data));
  }, [fetchPOs]);

  const handleView = async (id) => {
    try {
      const r = await api.get(`/purchase-orders/${id}`);
      setViewPO(r.data);
    } catch { toast.error('Failed to load PO details'); }
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = async (row) => {
    try {
      const r = await api.get(`/purchase-orders/${row.id}`);
      setEditing(r.data);
      setForm({
        vendor_id: r.data.vendor_id,
        customer_order_id: r.data.customer_order_id || '',
        notes: r.data.notes || '',
        items: r.data.items.map(i => ({
          product_id: i.product_id,
          quantity_ordered: i.quantity_ordered,
          unit_price: i.unit_price,
        })),
      });
      setShowForm(true);
    } catch { toast.error('Failed to load PO'); }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity_ordered: '', unit_price: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(f => ({
    ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/purchase-orders/${editing.id}`, { ...form, customer_order_id: form.customer_order_id || null });
        toast.success('Purchase order updated');
      } else {
        await api.post('/purchase-orders', { ...form, customer_order_id: form.customer_order_id || null });
        toast.success('Purchase order created');
      }
      setShowForm(false);
      fetchPOs(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/purchase-orders/${deleteTarget.id}`);
      toast.success('Purchase order deleted');
      setDeleteTarget(null);
      fetchPOs(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete');
    }
  };

  const columns = [
    { key: 'po_number', label: 'PO #' },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'customer_order_number', label: 'Customer Order', render: v => v || '—' },
    { key: 'total_amount', label: 'Total', render: v => v ? `₹${parseFloat(v).toLocaleString('en-IN')}` : '—' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
    { key: 'id', label: 'Actions', render: (id, row) => (
      <div className="flex items-center gap-3">
        <button onClick={() => handleView(id)} className="text-indigo-500 hover:text-indigo-700" title="View"><Eye size={15} /></button>
        {row.status === 'draft' && hasRole('admin', 'purchase') && (
          <button onClick={() => openEdit(row)} className="text-green-600 hover:text-green-800" title="Edit"><Pencil size={15} /></button>
        )}
        {['draft', 'cancelled'].includes(row.status) && hasRole('admin', 'purchase') && (
          <button onClick={() => setDeleteTarget(row)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 size={15} /></button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Raise POs for raw material procurement"
        action={hasRole('admin', 'purchase') && (
          <button onClick={openCreate} className="flex items-center gap-2 btn-primary">
            <Plus size={16} /> New PO
          </button>
        )}
      />

      {loading ? <Spinner /> : <Table columns={columns} data={pos} emptyMessage="No purchase orders yet" pagination={pagination} onPageChange={fetchPOs} />}

      {/* Create / Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? `Edit PO: ${editing.po_number}` : 'Create Purchase Order'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vendor *</label>
              <select required value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })}
                className="form-input">
                <option value="">Select vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Linked Customer Order</label>
              <select value={form.customer_order_id} onChange={e => setForm({ ...form, customer_order_id: e.target.value })}
                className="form-input">
                <option value="">None</option>
                {customerOrders.map(co => <option key={co.id} value={co.id}>{co.order_number} – {co.customer_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Notes</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="form-input" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Items *</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Item
              </button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <select required value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select material</option>
                  {rawMaterials.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <input type="number" min="0.001" step="0.001" required placeholder="Qty" value={item.quantity_ordered}
                  onChange={e => updateItem(i, 'quantity_ordered', e.target.value)}
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
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {editing ? 'Update PO' : 'Create PO'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewPO} onClose={() => setViewPO(null)} title={`PO: ${viewPO?.po_number}`} size="lg">
        {viewPO && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Vendor:</span> <strong>{viewPO.vendor_name}</strong></div>
              <div><span className="text-gray-500">Status:</span> <StatusBadge status={viewPO.status} /></div>
              <div><span className="text-gray-500">Customer Order:</span> {viewPO.customer_order_number || '—'}</div>
              <div><span className="text-gray-500">Created By:</span> {viewPO.created_by_name}</div>
              {viewPO.notes && <div className="col-span-2"><span className="text-gray-500">Notes:</span> {viewPO.notes}</div>}
            </div>
            <table className="min-w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Material</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Ordered</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Received</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {viewPO.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{item.product_name} <span className="text-gray-400">({item.sku})</span></td>
                    <td className="px-4 py-2 text-right">{item.quantity_ordered} {item.unit}</td>
                    <td className="px-4 py-2 text-right">{item.quantity_received} {item.unit}</td>
                    <td className="px-4 py-2 text-right">₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 text-right font-medium">₹{(item.quantity_ordered * item.unit_price).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Purchase Order" message={`Delete "${deleteTarget?.po_number}"? This cannot be undone.`} />
    </div>
  );
}
