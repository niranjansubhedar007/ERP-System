import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import { ShoppingCart, TruckIcon, Factory, Send, Archive, TrendingUp } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, iconBg, valueColor, border }) => (
  <div className={`bg-white rounded-xl p-5 border ${border} shadow-card hover:shadow-card-hover transition-shadow`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
      <Icon size={20} className="text-white" />
    </div>
    <p className={`text-2xl font-bold ${valueColor} mb-0.5`}>{value}</p>
    <p className="text-xs font-medium text-slate-500">{label}</p>
  </div>
);

const StatusRow = ({ status, count }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
    <span className="text-sm text-slate-600 capitalize">{status.replace(/_/g, ' ')}</span>
    <span className="text-sm font-semibold text-slate-800 tabular-nums">{count}</span>
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Customer Orders"
          value={total(data?.customer_orders)}
          icon={ShoppingCart}
          iconBg="bg-blue-500"
          valueColor="text-blue-600"
          border="border-blue-50"
        />
        <StatCard
          label="Purchase Orders"
          value={total(data?.purchase_orders)}
          icon={TruckIcon}
          iconBg="bg-amber-500"
          valueColor="text-amber-600"
          border="border-amber-50"
        />
        <StatCard
          label="Production Orders"
          value={total(data?.production_orders)}
          icon={Factory}
          iconBg="bg-violet-500"
          valueColor="text-violet-600"
          border="border-violet-50"
        />
        <StatCard
          label="Sale Orders"
          value={total(data?.sale_orders)}
          icon={Send}
          iconBg="bg-emerald-500"
          valueColor="text-emerald-600"
          border="border-emerald-50"
        />
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Inventory */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Archive size={16} className="text-slate-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Inventory Value</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ₹{parseFloat(data?.inventory?.total_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <TrendingUp size={13} className="text-emerald-500" />
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">{data?.inventory?.total}</span> products in stock
            </p>
          </div>
        </div>

        {/* Customer Orders Status */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingCart size={15} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Customer Orders</h3>
          </div>
          <div>
            {data?.customer_orders?.map(r => (
              <StatusRow key={r.status} status={r.status} count={r.count} />
            ))}
          </div>
        </div>

        {/* Production + PO Status */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <Factory size={15} className="text-violet-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Production</h3>
          </div>
          {data?.production_orders?.map(r => (
            <StatusRow key={r.status} status={r.status} count={r.count} />
          ))}

          <div className="flex items-center gap-2 mt-5 mb-4">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <TruckIcon size={15} className="text-amber-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Purchase Orders</h3>
          </div>
          {data?.purchase_orders?.map(r => (
            <StatusRow key={r.status} status={r.status} count={r.count} />
          ))}
        </div>
      </div>
    </div>
  );
}
