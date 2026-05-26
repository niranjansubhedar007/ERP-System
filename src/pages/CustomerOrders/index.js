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

const EMPTY_FORM = { customer_id: '', notes: '', items: [{ product_id: '', quantity: '', unit_price: '' }] };

export default function CustomerOrders() {
  const { hasRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get('/customer-orders').then(r => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
    api.get('/products?type=finished_good').then(r => setProducts(r.data));
    api.get('/products/meta/customers').then(r => setCustomers(r.data));
  }, [fetchOrders]);

  const handleView = async (id) => {
    const r = await api.get(`/customer-orders/${id}`);
    setViewOrder(r.data);
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = async (row) => {
    const r = await api.get(`/customer-orders/${row.id}`);
    setEditing(r.data);
    setForm({
      customer_id: r.data.customer_id,
      notes: r.data.notes || '',
      items: r.data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
    });
    setShowForm(true);
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: '', unit_price: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/customer-orders/${editing.id}`, form);
        toast.success('Order updated');
      } else {
        await api.post('/customer-orders', form);
        toast.success('Order created');
      }
      setShowForm(false);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/customer-orders/${deleteTarget.id}`);
      toast.success('Order deleted');
      setDeleteTarget(null);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  const columns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'item_count', label: 'Items' },
    { key: 'total_amount', label: 'Total', render: v => v ? `₹${parseFloat(v).toLocaleString('en-IN')}` : '—' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
    { key: 'id', label: 'Actions', render: (id, row) => (
      <div className="flex items-center gap-3">
        <button onClick={() => handleView(id)} className="text-blue-600 hover:text-blue-800"><Eye size={15} /></button>
        {['pending','confirmed'].includes(row.status) && hasRole('admin','sales') && (
          <button onClick={() => openEdit(row)} className="text-green-600 hover:text-green-800"><Pencil size={15} /></button>
        )}
        {!['dispatched','in_production'].includes(row.status) && hasRole('admin','sales') && (
          <button onClick={() => setDeleteTarget(row)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Customer Orders" subtitle="Manage orders placed by customers"
        action={hasRole('admin','sales') && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"><Plus size={16} /> New Order</button>
        )}
      />
      {loading ? <Spinner /> : <Table columns={columns} data={orders} emptyMessage="No customer orders yet" />}

      {/* Create / Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? `Edit Order: ${editing.order_number}` : 'Create Customer Order'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Order Items *</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus size={12} /> Add Item</button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <select required value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <input type="number" min="0.001" step="0.001" required placeholder="Qty" value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <input type="number" min="0" step="0.01" required placeholder="Unit Price ₹" value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? 'Update Order' : 'Create Order'}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order: ${viewOrder?.order_number}`} size="lg">
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Customer:</span> <strong>{viewOrder.customer_name}</strong></div>
              <div><span className="text-gray-500">Status:</span> <StatusBadge status={viewOrder.status} /></div>
              <div><span className="text-gray-500">Email:</span> {viewOrder.customer_email || '—'}</div>
              <div><span className="text-gray-500">Phone:</span> {viewOrder.customer_phone || '—'}</div>
            </div>
            <table className="min-w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Product</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {viewOrder.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{item.product_name} <span className="text-gray-400">({item.sku})</span></td>
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

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Order" message={`Delete order "${deleteTarget?.order_number}"? This cannot be undone.`} />
    </div>
  );
}
