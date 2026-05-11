import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthState } from '@/hooks/useAuth';
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

function AppRoutes({ showToast }: { showToast: ToastFn }) {
  const { user, logout } = useAuthState_ctx();
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  // Keep local user in sync when auth changes
  React.useEffect(() => { setCurrentUser(user); }, [user]);

  const handleUpdateUser = useCallback((updated: User) => {
    setCurrentUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  }, []);

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar user={currentUser} onLogout={logout} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Routes>
          <Route path="/kartodromes" element={<KartodromesPage user={currentUser} onToast={showToast} />} />
          <Route path="/bookings" element={<BookingsPage onToast={showToast} />} />
          <Route path="/statistics" element={<StatisticsPage user={currentUser} />} />
          <Route path="/profile" element={<ProfilePage user={currentUser} onUpdate={handleUpdateUser} onToast={showToast} />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage onToast={showToast} />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/karts" element={<AdminKartsPage onToast={showToast} />} />
          <Route path="/admin/sessions" element={<AdminSessionsPage onToast={showToast} />} />
          <Route path="/login" element={<Navigate to="/kartodromes" replace />} />
          <Route path="*" element={<Navigate to="/kartodromes" replace />} />
        </Routes>
      </div>
    </div>
  );
}

// Helper to read from context (avoids circular import)
function useAuthState_ctx() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('No AuthContext');
  return ctx;
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
