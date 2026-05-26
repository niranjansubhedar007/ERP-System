import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Plus, Truck, Pencil, Trash2 } from 'lucide-react';

const EMPTY = { name: '', email: '', phone: '', address: '' };

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchVendors = useCallback((p = 1) => {
    setLoading(true);
    api.get(`/products/meta/vendors?page=${p}&limit=10`)
      .then(r => { setVendors(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load vendors'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchVendors(1); }, [fetchVendors]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (v) => { setEditing(v); setForm({ name: v.name, email: v.email || '', phone: v.phone || '', address: v.address || '' }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/products/meta/vendors/${editing.id}`, form);
        toast.success('Vendor updated');
      } else {
        await api.post('/products/meta/vendors', form);
        toast.success('Vendor added');
      }
      setShowForm(false);
      fetchVendors(1);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/meta/vendors/${deleteTarget.id}`);
      toast.success('Vendor deleted');
      setDeleteTarget(null);
      fetchVendors(1);
    } catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  const columns = [
    { key: 'name', label: 'Vendor Name', render: v => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
          <Truck size={14} className="text-yellow-600" />
        </div>
        <span className="font-medium">{v}</span>
      </div>
    )},
    { key: 'email',   label: 'Email',   render: v => v || '—' },
    { key: 'phone',   label: 'Phone',   render: v => v || '—' },
    { key: 'address', label: 'Address', render: v => v || '—' },
    { key: 'created_at', label: 'Added On', render: v => new Date(v).toLocaleDateString('en-IN') },
    { key: 'id', label: 'Actions', render: (_, row) => (
      <div className="flex items-center gap-3">
        <button onClick={() => openEdit(row)} className="text-indigo-500 hover:text-indigo-700"><Pencil size={15} /></button>
        <button onClick={() => setDeleteTarget(row)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Vendors" subtitle="Manage your vendor / supplier list"
        action={<button onClick={openCreate} className="flex items-center gap-2 btn-primary"><Plus size={16} /> Add Vendor</button>}
      />
      <div className="bg-white border border-slate-100 rounded-xl shadow-card p-4 mb-6 inline-flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><Truck size={20} className="text-yellow-600" /></div>
        <div><p className="text-xs text-slate-500">Total Vendors</p><p className="text-2xl font-bold text-slate-900">{pagination ? pagination.total : vendors.length}</p></div>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={vendors} emptyMessage="No vendors yet" pagination={pagination} onPageChange={fetchVendors} />}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Vendor' : 'Add Vendor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Vendor Name <span className="text-red-500">*</span></label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="RawMat Suppliers"
              className="form-input" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="supply@vendor.com"
              className="form-input" />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210"
              className="form-input" />
          </div>
          <div>
            <label className="form-label">Address</label>
            <textarea rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Delhi, India"
              className="form-input resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add Vendor'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Vendor" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} />
    </div>
  );
}
