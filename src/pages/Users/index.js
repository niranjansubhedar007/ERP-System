import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { Plus } from 'lucide-react';

const ROLE_COLORS = {
  admin:      'bg-purple-100 text-purple-700',
  sales:      'bg-blue-100 text-blue-700',
  purchase:   'bg-yellow-100 text-yellow-700',
  warehouse:  'bg-green-100 text-green-700',
  production: 'bg-orange-100 text-orange-700',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales' });

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api.get('/auth/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', form);
      toast.success('User created');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'sales' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/auth/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: v => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[v] || 'bg-gray-100 text-gray-700'}`}>{v}</span>
    )},
    { key: 'is_active', label: 'Status', render: v => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {v ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'created_at', label: 'Created', render: v => new Date(v).toLocaleDateString('en-IN') },
    { key: 'id', label: 'Action', render: (id, row) => (
      <button onClick={() => toggleActive(row)}
        className={`text-xs px-3 py-1 rounded-lg border ${row.is_active ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
        {row.is_active ? 'Deactivate' : 'Activate'}
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage system users and role-based access"
        action={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> New User
          </button>
        }
      />

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(ROLE_COLORS).map(([role, cls]) => (
          <span key={role} className={`text-xs px-3 py-1 rounded-full font-medium ${cls}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        ))}
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={users} emptyMessage="No users found" />}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="sales">Sales</option>
              <option value="purchase">Purchase</option>
              <option value="warehouse">Warehouse</option>
              <option value="production">Production</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p><strong>Admin:</strong> Full access to all modules</p>
            <p><strong>Sales:</strong> Customer orders, sale/outward</p>
            <p><strong>Purchase:</strong> Purchase orders, inward</p>
            <p><strong>Warehouse:</strong> Inward, inventory, sale dispatch</p>
            <p><strong>Production:</strong> Production orders</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Create User</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
