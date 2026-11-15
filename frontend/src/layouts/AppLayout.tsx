import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CheckCircle2,
  Send,
  Users,
  Sparkles,
  History,
  ShieldAlert,
  Settings,
  Mail,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { googleAuthApi, approvalApi } from '../services/api';
import { PasswordChangeModal } from '../components/PasswordChangeModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const { data: googleStatus } = useQuery({
    queryKey: ['googleStatus'],
    queryFn: googleAuthApi.getStatus,
    refetchInterval: 15000,
  });

  const { data: pendingList } = useQuery({
    queryKey: ['pendingApproval'],
    queryFn: approvalApi.getPending,
    refetchInterval: 10000,
  });

  const pendingCount = pendingList?.length || 0;

  const navItems = [
    { label: 'Overview', path: '/user/dashboard', icon: LayoutDashboard },
    {
      label: 'Approval Queue',
      path: '/user/approval',
      icon: CheckCircle2,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    { label: 'My Campaigns', path: '/user/campaigns', icon: Send },
    { label: 'AI Email Studio', path: '/user/ai-studio', icon: Sparkles },
    { label: 'My Recipients', path: '/user/recipients', icon: Users },
    { label: 'Sending History', path: '/user/history', icon: History },
    { label: 'Suppression List', path: '/user/suppression', icon: ShieldAlert },
    { label: 'Gmail & Profile', path: '/user/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <PasswordChangeModal />

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AeroReach
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  WORKSPACE
                </span>
              </span>
              <p className="text-xs text-slate-400 font-medium">Employee Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === '/user/dashboard' && location.pathname === '/');

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-brand-500 text-white'}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer — Gmail Security Status & User Card */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/40 space-y-3">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                My Gmail Account
              </span>
              <span className="relative flex h-2 w-2">
                {googleStatus?.isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                )}
              </span>
            </div>

            {googleStatus?.isConnected ? (
              <div>
                <p className="text-xs font-mono text-slate-300 truncate" title={googleStatus.account?.email}>
                  {googleStatus.account?.email}
                </p>
                <p className="text-[10px] text-emerald-400 mt-0.5">OAuth 2.0 Active</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-amber-300 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Not Connected
                </p>
                <button
                  onClick={() => googleAuthApi.initiateAuth()}
                  className="mt-2 w-full text-xs font-semibold py-1.5 px-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  Connect Gmail
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold transition-colors border border-slate-700/60"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>My Workspace</span>
              <span>/</span>
              <span className="text-slate-200 capitalize">
                {location.pathname.replace('/user/', '').replace('/', '') || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {googleStatus?.isConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                {googleStatus.account?.email}
              </div>
            ) : (
              <button
                onClick={() => googleAuthApi.initiateAuth()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                Authorize Gmail Account
              </button>
            )}

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 border border-brand-500/30 flex items-center justify-center text-xs font-semibold text-white">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-200">{user?.fullName || 'Employee'}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{user?.email}</p>
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
