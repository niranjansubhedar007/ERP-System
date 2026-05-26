import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import { ShoppingCart, TruckIcon, Factory, Send, Archive } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </div>
);

const StatusRow = ({ status, count }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-gray-600 capitalize">{status.replace(/_/g, ' ')}</span>
    <span className="text-sm font-semibold text-gray-900">{count}</span>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const total = (arr) => arr?.reduce((s, r) => s + parseInt(r.count), 0) || 0;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Manufacturing workflow overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Customer Orders" value={total(data?.customer_orders)} icon={ShoppingCart} color="bg-blue-500" />
        <StatCard label="Purchase Orders" value={total(data?.purchase_orders)} icon={TruckIcon} color="bg-yellow-500" />
        <StatCard label="Production Orders" value={total(data?.production_orders)} icon={Factory} color="bg-purple-500" />
        <StatCard label="Sale Orders" value={total(data?.sale_orders)} icon={Send} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Archive size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800">Inventory Value</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₹{parseFloat(data?.inventory?.total_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-500 mt-1">{data?.inventory?.total} products in stock</p>
        </div>

        {/* Customer Orders by status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Customer Orders by Status</h3>
          {data?.customer_orders?.map(r => <StatusRow key={r.status} status={r.status} count={r.count} />)}
        </div>

        {/* Production orders by status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Production by Status</h3>
          {data?.production_orders?.map(r => <StatusRow key={r.status} status={r.status} count={r.count} />)}
          <hr className="my-3" />
          <h3 className="font-semibold text-gray-800 mb-3">Purchase Orders by Status</h3>
          {data?.purchase_orders?.map(r => <StatusRow key={r.status} status={r.status} count={r.count} />)}
        </div>
      </div>
    </div>
  );
}
