import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Plus, Settings, Pencil, Trash2 } from 'lucide-react';

const EMPTY = { name: '', sku: '', description: '', unit: 'pcs', type: 'raw_material', unit_price: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [bomProduct, setBomProduct] = useState(null);
  const [bom, setBom] = useState([{ raw_material_id: '', quantity_required: '' }]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/products'), api.get('/products?type=raw_material')])
      .then(([all, rm]) => { setProducts(all.data); setRawMaterials(rm.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, description: p.description || '', unit: p.unit, type: p.type, unit_price: p.unit_price });
    setShowForm(true);
  };

  const openBom = async (product) => {
    const r = await api.get(`/products/${product.id}`);
    setBomProduct(r.data);
    setBom(r.data.bom?.length ? r.data.bom.map(b => ({ raw_material_id: b.raw_material_id, quantity_required: b.quantity_required })) : [{ raw_material_id: '', quantity_required: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      toast.success('Product deleted');
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  const handleSaveBom = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${bomProduct.id}/bom`, {
        bom: bom.filter(b => b.raw_material_id && b.quantity_required).map(b => ({
          raw_material_id: parseInt(b.raw_material_id),
          quantity_required: parseFloat(b.quantity_required),
        })),
      });
      toast.success('Bill of Materials saved');
      setBomProduct(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: v => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v === 'raw_material' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
        {v === 'raw_material' ? 'Raw Material' : 'Finished Good'}
      </span>
    )},
    { key: 'unit', label: 'Unit' },
    { key: 'unit_price', label: 'Unit Price', render: v => `₹${parseFloat(v).toLocaleString('en-IN')}` },
    { key: 'id', label: 'Actions', render: (id, row) => (
      <div className="flex items-center gap-3">
        <button onClick={() => openEdit(row)} className="text-blue-600 hover:text-blue-800"><Pencil size={15} /></button>
        {row.type === 'finished_good' && (
          <button onClick={() => openBom(row)} className="text-purple-600 hover:text-purple-800" title="Set Bill of Materials"><Settings size={15} /></button>
        )}
        <button onClick={() => setDeleteTarget(row)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Products & Bill of Materials" subtitle="Manage products and their Bill of Materials"
        action={<button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"><Plus size={16} /> New Product</button>}
      />

      {loading ? <Spinner /> : <Table columns={columns} data={products} emptyMessage="No products yet" />}

      {/* Create / Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Product' : 'Create Product'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} disabled={!!editing}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} disabled={!!editing}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                <option value="raw_material">Raw Material</option>
                <option value="finished_good">Finished Good</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <input required value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="pcs / kg / ltr"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
              <input type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Bill of Materials Modal */}
      <Modal open={!!bomProduct} onClose={() => setBomProduct(null)} title={`Bill of Materials: ${bomProduct?.name}`} size="md">
        {bomProduct && (
          <form onSubmit={handleSaveBom} className="space-y-4">
            <p className="text-sm text-gray-500">Raw materials needed to produce 1 unit of <strong>{bomProduct.name}</strong>.</p>
            {bom.map((b, i) => (
              <div key={i} className="flex gap-2">
                <select required value={b.raw_material_id} onChange={e => setBom(bom.map((x, idx) => idx === i ? { ...x, raw_material_id: e.target.value } : x))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select raw material</option>
                  {rawMaterials.map(r => <option key={r.id} value={r.id}>{r.name} ({r.sku})</option>)}
                </select>
                <input type="number" min="0.001" step="0.001" required placeholder="Qty per unit" value={b.quantity_required}
                  onChange={e => setBom(bom.map((x, idx) => idx === i ? { ...x, quantity_required: e.target.value } : x))}
                  className="w-36 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {bom.length > 1 && (
                  <button type="button" onClick={() => setBom(bom.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 px-2">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setBom([...bom, { raw_material_id: '', quantity_required: '' }])}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus size={12} /> Add Material</button>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setBomProduct(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save Bill of Materials</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Product" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} />
    </div>
  );
}
