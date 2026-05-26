import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { Plus, Eye } from 'lucide-react';

export default function Inward() {
  const { hasRole } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poItems, setPoItems] = useState([]);
  const [form, setForm] = useState({ po_id: '', notes: '', items: [] });

  const fetchRecords = useCallback(() => {
    setLoading(true);
    api.get('/inward').then(r => setRecords(r.data)).finally(() => setLoading(false));
  }, []);
console.log(poItems);

  useEffect(() => {
    fetchRecords();
    api.get('/purchase-orders').then(r => setPurchaseOrders(r.data.filter(po => po.status !== 'cancelled' && po.status !== 'received')));
  }, [fetchRecords]);

  const loadPOItems = async (poId) => {
    if (!poId) { setPoItems([]); return; }
    const r = await api.get(`/inward/po/${poId}/items`);
    setPoItems(r.data);
    setForm(f => ({
      ...f,
      po_id: poId,
      items: r.data.map(item => ({
        po_item_id: item.id,
        product_id: item.product_id,
        quantity_received: '',
        product_name: item.product_name,
        pending_qty: item.pending_qty,
        unit: item.unit,
      })),
    }));
  };

  const updateQty = (i, val) => setForm(f => ({
    ...f, items: f.items.map((item, idx) => idx === i ? { ...item, quantity_received: val } : item),
  }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      po_id: parseInt(form.po_id),
      notes: form.notes,
      items: form.items.filter(i => i.quantity_received > 0).map(i => ({
        po_item_id: i.po_item_id,
        product_id: i.product_id,
        quantity_received: parseFloat(i.quantity_received),
      })),
    };
    if (!payload.items.length) return toast.error('Enter at least one received quantity');
    try {
      await api.post('/inward', payload);
      toast.success('Inward record created, inventory updated');
      setShowCreate(false);
      setForm({ po_id: '', notes: '', items: [] });
      setPoItems([]);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleView = async (id) => {
    const r = await api.get(`/inward/${id}`);
    setViewRecord(r.data);
  };

  const columns = [
    { key: 'inward_number', label: 'GRN #' },
    { key: 'po_number', label: 'PO #' },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'received_by_name', label: 'Received By', render: v => v || '—' },
    { key: 'created_at', label: 'Date', render: v => new Date(v).toLocaleDateString('en-IN') },
    { key: 'id', label: 'Action', render: (id) => (
      <button onClick={() => handleView(id)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs">
        <Eye size={14} /> View
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Inward (GRN)"
        subtitle="Record goods received from vendors — automatically updates inventory"
        action={hasRole('admin', 'warehouse', 'purchase') && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> New GRN
          </button>
        )}
      />

      {loading ? <Spinner /> : <Table columns={columns} data={records} emptyMessage="No inward records yet" />}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm({ po_id: '', notes: '', items: [] }); setPoItems([]); }} title="Create Inward Record (GRN)" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order *</label>
              <select required value={form.po_id} onChange={e => loadPOItems(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select PO</option>
                {purchaseOrders.map(po => <option key={po.id} value={po.id}>{po.po_number} – {po.vendor_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {form.items.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items Received</label>
              <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Material</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Pending</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Qty Received *</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {form.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{item.product_name}</td>
                      <td className="px-3 py-2 text-right">{parseFloat(item.pending_qty).toFixed(3)} {item.unit}</td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" step="0.001" max={item.pending_qty} value={item.quantity_received}
                          onChange={e => updateQty(i, e.target.value)} placeholder="0"
                          className="w-full border rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-1">Inventory will be updated automatically upon save.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowCreate(false); setForm({ po_id: '', notes: '', items: [] }); setPoItems([]); }}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save GRN</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewRecord} onClose={() => setViewRecord(null)} title={`GRN: ${viewRecord?.inward_number}`}>
        {viewRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">PO #:</span> {viewRecord.po_number}</div>
              <div><span className="text-gray-500">Vendor:</span> {viewRecord.vendor_name}</div>
              <div><span className="text-gray-500">Received By:</span> {viewRecord.received_by_name || '—'}</div>
              <div><span className="text-gray-500">Date:</span> {new Date(viewRecord.created_at).toLocaleString('en-IN')}</div>
            </div>
            <table className="min-w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Material</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Qty Received</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {viewRecord.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{item.product_name} <span className="text-gray-400">({item.sku})</span></td>
                    <td className="px-4 py-2 text-right">{item.quantity_received} {item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
