import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, TruckIcon, PackageOpen,
  Factory, Send, BarChart3, Box, Archive, Users, Truck,
  Menu, X, LogOut, User,
} from 'lucide-react';

const DIVIDER = { divider: true };

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin','sales','purchase','warehouse','production'] },
  DIVIDER,
  { to: '/customers',  label: 'Customers',                   icon: User,      roles: ['admin','sales'] },
  { to: '/vendors',    label: 'Vendors',                     icon: Truck,     roles: ['admin','purchase'] },
  { to: '/products',   label: 'Products & Bill of Materials', icon: Box,       roles: ['admin'] },
  DIVIDER,
  { to: '/customer-orders', label: 'Customer Orders', icon: ShoppingCart, roles: ['admin','sales'] },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: TruckIcon,    roles: ['admin','purchase'] },
  { to: '/inward',          label: 'Inward (GRN)',    icon: PackageOpen,  roles: ['admin','warehouse','purchase'] },
  { to: '/production',      label: 'Production',      icon: Factory,      roles: ['admin','production'] },
  { to: '/sales',           label: 'Sale / Outward',  icon: Send,         roles: ['admin','sales','warehouse'] },
  DIVIDER,
  { to: '/inventory', label: 'Inventory', icon: Archive,   roles: ['admin','warehouse','purchase','production','sales'] },
  { to: '/reports',   label: 'Reports',   icon: BarChart3, roles: ['admin','sales','purchase','warehouse','production'] },
  DIVIDER,
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
];

const ROLE_STYLES = {
  admin:      'bg-violet-500/20 text-violet-300',
  sales:      'bg-blue-500/20 text-blue-300',
  purchase:   'bg-amber-500/20 text-amber-300',
  warehouse:  'bg-emerald-500/20 text-emerald-300',
  production: 'bg-orange-500/20 text-orange-300',
};

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/vendors': 'Vendors',
  '/products': 'Products & Bill of Materials',
  '/customer-orders': 'Customer Orders',
  '/purchase-orders': 'Purchase Orders',
  '/inward': 'Inward (GRN)',
  '/production': 'Production',
  '/sales': 'Sale / Outward',
  '/inventory': 'Inventory',
  '/reports': 'Reports',
  '/users': 'Users',
};

export default function Layout({ children }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  const visible = navItems.filter(item => {
    if (item.divider) return true;
    return hasRole(...item.roles);
  });

  const cleanNav = visible.reduce((acc, item, i) => {
    if (item.divider) {
      const prev = acc[acc.length - 1];
      const next = visible[i + 1];
      if (!prev || prev.divider || !next || next.divider) return acc;
      return [...acc, item];
    }
    return [...acc, item];
  }, []);

  const pageTitle = ROUTE_LABELS[location.pathname] || 'ERP System';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${open ? 'w-64' : 'w-16'} bg-slate-900 flex flex-col transition-all duration-200 shrink-0 border-r border-slate-800`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          {open && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30">
                <Factory size={15} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">ERP System</p>
                <p className="text-slate-500 text-xs">Manufacturing</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {cleanNav.map((item, idx) => {
            if (item.divider) {
              return <div key={`div-${idx}`} className="my-1.5 border-t border-slate-800" />;
            }
            const { to, label, icon: Icon } = item;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-white/[0.07] hover:text-slate-100'
                  }`
                }
              >
                <Icon size={15} className="shrink-0" />
                {open && <span className="truncate">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 p-3">
          {open ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-xs font-semibold truncate">{user?.name}</p>
                <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 ${ROLE_STYLES[user?.role] || 'bg-slate-700 text-slate-400'}`}>
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 w-full flex justify-center p-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Manufacturing ERP</span>
            <span className="text-slate-300 text-sm">/</span>
            <span className="text-sm font-semibold text-slate-700">{pageTitle}</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}
