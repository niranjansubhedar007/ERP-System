import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Spinner from './components/Spinner';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerOrders from './pages/CustomerOrders';
import PurchaseOrders from './pages/PurchaseOrders';
import Inward from './pages/Inward';
import Production from './pages/Production';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';

function PrivateRoute({ children, roles }) {
  const { user, loading, hasRole } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/customer-orders" element={<PrivateRoute roles={['admin','sales']}><CustomerOrders /></PrivateRoute>} />
      <Route path="/purchase-orders" element={<PrivateRoute roles={['admin','purchase']}><PurchaseOrders /></PrivateRoute>} />
      <Route path="/inward" element={<PrivateRoute roles={['admin','warehouse','purchase']}><Inward /></PrivateRoute>} />
      <Route path="/production" element={<PrivateRoute roles={['admin','production']}><Production /></PrivateRoute>} />
      <Route path="/sales" element={<PrivateRoute roles={['admin','sales','warehouse']}><Sales /></PrivateRoute>} />
      <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute roles={['admin']}><Products /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute roles={['admin','sales']}><Customers /></PrivateRoute>} />
      <Route path="/vendors" element={<PrivateRoute roles={['admin','purchase']}><Vendors /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
