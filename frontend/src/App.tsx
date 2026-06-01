import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthState, useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastContainer } from '@/components/layout/ToastContainer';
import { LoginPage } from '@/pages/LoginPage';
import { KartodromesPage } from '@/pages/client/KartodromesPage';
import { BookingsPage } from '@/pages/client/BookingsPage';
import { StatisticsPage } from '@/pages/client/StatisticsPage';
import { ProfilePage } from '@/pages/client/ProfilePage';
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminKartsPage } from '@/pages/admin/AdminKartsPage';
import { AdminSessionsPage } from '@/pages/admin/AdminSessionsPage';
import type { User } from '@/types';

type ToastFn = (msg: string, type?: 'success' | 'error' | 'info') => void;

/**
 * Inner router — reads user directly from AuthContext.
 * When updateUser() is called (avatar upload, name change) it writes to localStorage
 * AND calls setUser() inside useAuthState, so every consumer re-renders with the
 * fresh user object — including Sidebar's avatar circle.
 */
function AppRoutes({ showToast }: { showToast: ToastFn }) {
  const { user, logout, updateUser } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Sidebar receives live `user` from context — re-renders on every updateUser() call */}
      <Sidebar user={user} onLogout={logout} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Routes>
          <Route path="/kartodromes"      element={<KartodromesPage user={user} onToast={showToast} />} />
          <Route path="/bookings"         element={<BookingsPage onToast={showToast} />} />
          <Route path="/statistics"       element={<StatisticsPage user={user} />} />
          <Route path="/profile"          element={<ProfilePage user={user} onUpdate={updateUser} onToast={showToast} />} />
          <Route path="/admin/bookings"   element={<AdminBookingsPage onToast={showToast} />} />
          <Route path="/admin/users"      element={<AdminUsersPage />} />
          <Route path="/admin/analytics"  element={<AdminAnalyticsPage />} />
          <Route path="/admin/karts"      element={<AdminKartsPage onToast={showToast} />} />
          <Route path="/admin/sessions"   element={<AdminSessionsPage onToast={showToast} />} />
          <Route path="/login"            element={<Navigate to="/kartodromes" replace />} />
          <Route path="*"                 element={<Navigate to="/kartodromes" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuthState();
  const { toasts, showToast, dismissToast } = useToast();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <AppRoutes showToast={showToast} />
      </BrowserRouter>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AuthContext.Provider>
  );
}
