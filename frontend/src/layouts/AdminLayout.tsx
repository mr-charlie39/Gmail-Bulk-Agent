import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Users,
  Mail,
  Send,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { PasswordChangeModal } from '../components/PasswordChangeModal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Gmail Accounts', path: '/admin/gmail-accounts', icon: Mail },
    { label: 'Campaign Monitoring', path: '/admin/campaigns', icon: Send },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <PasswordChangeModal />

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/70 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-600/20">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AeroReach
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  ADMIN
                </span>
              </span>
              <p className="text-xs text-slate-400 font-medium">Platform Governance</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-rose-200" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/40 space-y-3">
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-semibold text-slate-200">Security Profile</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wide">
                RBAC Enforcement Active
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 text-xs font-semibold transition-colors border border-slate-700/60"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Administrator Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Governance Portal</span>
            <span>/</span>
            <span className="text-slate-200 capitalize">
              {location.pathname.replace('/admin/', '').replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
              System Administrator
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                AD
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-200">{user?.fullName || 'Super Admin'}</p>
                <p className="text-[10px] text-slate-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
};
