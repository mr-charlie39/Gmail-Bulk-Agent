import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Auth Pages
import { UserLogin } from './pages/user/UserLogin';
import { AdminLogin } from './pages/admin/AdminLogin';

// User Workspace Pages
import { Dashboard } from './pages/Dashboard';
import { ApprovalQueue } from './pages/ApprovalQueue';
import { Campaigns } from './pages/Campaigns';
import { Generator } from './pages/Generator';
import { Recipients } from './pages/Recipients';
import { History } from './pages/History';
import { Suppression } from './pages/Suppression';
import { Settings } from './pages/Settings';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminGmailAccounts } from './pages/admin/AdminGmailAccounts';
import { AdminCampaigns } from './pages/admin/AdminCampaigns';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSettings } from './pages/admin/AdminSettings';

// Guard for System Administrators
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-rose-400 font-mono text-sm">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/user/dashboard" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

// Guard for Employee Users
const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-brand-400 font-mono text-sm">
        Authenticating employee workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

// Root index routing dispatcher
const RootDispatcher: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Loading AeroReach Enterprise Outreach Platform...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/user/dashboard" replace />;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootDispatcher />} />

      {/* Authentication Pages */}
      <Route path="/login" element={<UserLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/gmail-accounts"
        element={
          <AdminRoute>
            <AdminGmailAccounts />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/campaigns"
        element={
          <AdminRoute>
            <AdminCampaigns />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <AdminRoute>
            <AdminAuditLogs />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <AdminSettings />
          </AdminRoute>
        }
      />

      {/* User Protected Workspace Routes */}
      <Route
        path="/user/dashboard"
        element={
          <UserRoute>
            <Dashboard />
          </UserRoute>
        }
      />
      <Route
        path="/user/approval"
        element={
          <UserRoute>
            <ApprovalQueue />
          </UserRoute>
        }
      />
      <Route
        path="/user/campaigns"
        element={
          <UserRoute>
            <Campaigns />
          </UserRoute>
        }
      />
      <Route
        path="/user/ai-studio"
        element={
          <UserRoute>
            <Generator />
          </UserRoute>
        }
      />
      <Route
        path="/user/recipients"
        element={
          <UserRoute>
            <Recipients />
          </UserRoute>
        }
      />
      <Route
        path="/user/history"
        element={
          <UserRoute>
            <History />
          </UserRoute>
        }
      />
      <Route
        path="/user/suppression"
        element={
          <UserRoute>
            <Suppression />
          </UserRoute>
        }
      />
      <Route
        path="/user/settings"
        element={
          <UserRoute>
            <Settings />
          </UserRoute>
        }
      />

      {/* Backward compatible routes for employee workspace */}
      <Route
        path="/approval"
        element={
          <UserRoute>
            <ApprovalQueue />
          </UserRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <UserRoute>
            <Campaigns />
          </UserRoute>
        }
      />
      <Route
        path="/ai-studio"
        element={
          <UserRoute>
            <Generator />
          </UserRoute>
        }
      />
      <Route
        path="/recipients"
        element={
          <UserRoute>
            <Recipients />
          </UserRoute>
        }
      />
      <Route
        path="/history"
        element={
          <UserRoute>
            <History />
          </UserRoute>
        }
      />
      <Route
        path="/suppression"
        element={
          <UserRoute>
            <Suppression />
          </UserRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <UserRoute>
            <Settings />
          </UserRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<RootDispatcher />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
