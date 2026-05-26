import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingCart, TruckIcon, PackageOpen,
  Factory, Send, BarChart3, Box, Archive, Users, Truck,
  Menu, X, LogOut, ChevronRight, User, Minus,
} from 'lucide-react';

// Divider helper
const DIVIDER = { divider: true, label: '' };

const navItems = [
  // ── Dashboard ─────────────────────────────
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin','sales','purchase','warehouse','production'] },

  DIVIDER,

  // ── Step 1: Master Setup ──────────────────
  { to: '/customers',  label: 'Customers',                   icon: User,      roles: ['admin','sales'] },
  { to: '/vendors',    label: 'Vendors',                     icon: Truck,     roles: ['admin','purchase'] },
  { to: '/products',   label: 'Products & Bill of Materials', icon: Box,       roles: ['admin'] },

  DIVIDER,

  // ── Step 2: Workflow ──────────────────────
  { to: '/customer-orders', label: 'Customer Orders', icon: ShoppingCart, roles: ['admin','sales'] },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: TruckIcon,    roles: ['admin','purchase'] },
  { to: '/inward',          label: 'Inward (GRN)',    icon: PackageOpen,  roles: ['admin','warehouse','purchase'] },
  { to: '/production',      label: 'Production',      icon: Factory,      roles: ['admin','production'] },
  { to: '/sales',           label: 'Sale / Outward',  icon: Send,         roles: ['admin','sales','warehouse'] },

  DIVIDER,

  // ── Step 3: Tracking & Reports ────────────
  { to: '/inventory', label: 'Inventory', icon: Archive,   roles: ['admin','warehouse','purchase','production','sales'] },
  { to: '/reports',   label: 'Reports',   icon: BarChart3, roles: ['admin','sales','purchase','warehouse','production'] },

  DIVIDER,

  // ── Admin ─────────────────────────────────
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
];

const ROLE_COLORS = {
  admin:      'bg-purple-100 text-purple-700',
  sales:      'bg-blue-100 text-blue-700',
  purchase:   'bg-yellow-100 text-yellow-700',
  warehouse:  'bg-green-100 text-green-700',
  production: 'bg-orange-100 text-orange-700',
};

const SECTION_LABELS = {
  '/customer-orders': 'WORKFLOW',
  '/inventory':       'MASTERS',
  '/reports':         'REPORTS & ADMIN',
};

export default function Layout({ children }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Build visible list — filter out dividers that have no visible items after them
  const visible = navItems.filter(item => {
    if (item.divider) return true;
    return hasRole(...item.roles);
  });

  // Remove leading/consecutive/trailing dividers
  const cleanNav = visible.reduce((acc, item, i) => {
    if (item.divider) {
      const prev = acc[acc.length - 1];
      const next = visible[i + 1];
      if (!prev || prev.divider || !next || next.divider) return acc;
      return [...acc, item];
    }
    return [...acc, item];
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${open ? 'w-64' : 'w-16'} bg-gray-900 flex flex-col transition-all duration-200 shrink-0`}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          {open && (
            <div>
              <p className="text-white font-bold text-base leading-tight">ERP System</p>
              <p className="text-gray-400 text-xs">Manufacturing Workflow</p>
            </div>
          )}
          <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white p-1 rounded">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {cleanNav.map((item, idx) => {
            if (item.divider) {
              return (
                <div key={`div-${idx}`} className="my-2 border-t border-gray-700/60" />
              );
            }
            const { to, label, icon: Icon } = item;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon size={17} className="shrink-0" />
                {open && <span className="truncate">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-gray-700 p-3">
          {open ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[user?.role] || 'bg-gray-700 text-gray-300'}`}>
                  {user?.role}
                </span>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-1" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 w-full flex justify-center p-1">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b flex items-center px-6 gap-2 shrink-0 shadow-sm">
          <ChevronRight size={16} className="text-gray-300" />
          <span className="text-gray-500 text-sm">Manufacturing ERP</span>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}
