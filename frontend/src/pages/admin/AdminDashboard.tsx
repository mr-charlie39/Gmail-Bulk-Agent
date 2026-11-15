import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import {
  Users,
  UserCheck,
  UserX,
  Mail,
  Send,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Activity,
  ChevronRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 15000,
  });

  const stats = data?.stats;
  const auditLogs = data?.recentAuditLogs || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Platform Governance Overview
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Live Real-Time
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise RBAC telemetry and PostgreSQL outreach statistics across all employee workspaces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-rose-600/20"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/admin/audit-logs"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Full Audit Trail</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Registered Employees</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100">
              {isLoading ? '...' : stats?.totalUsers || 0}
            </span>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <UserCheck className="h-3 w-3" /> {stats?.activeUsers || 0} Active
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <UserX className="h-3 w-3" /> {stats?.inactiveUsers || 0} Inactive
              </span>
            </div>
          </div>
        </div>

        {/* Connected Gmails */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Connected Gmail Accounts</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100">
              {isLoading ? '...' : stats?.connectedGmailAccounts || 0}
            </span>
            <p className="text-[11px] text-emerald-400/90 mt-1.5 flex items-center gap-1">
              <span>AES-256-GCM Encrypted at Rest</span>
            </p>
          </div>
        </div>

        {/* Total Campaigns */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Outreach Campaigns</span>
            <div className="h-8 w-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100">
              {isLoading ? '...' : stats?.totalCampaigns || 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1.5">Across all employee workspaces</p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Approvals</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-300">
              {isLoading ? '...' : stats?.pendingApprovals || 0}
            </span>
            <p className="text-[11px] text-amber-400/80 mt-1.5">Awaiting human sign-off</p>
          </div>
        </div>

        {/* Generated Emails */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Gemini AI Emails Generated</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100">
              {isLoading ? '...' : stats?.totalGenerated || 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1.5">Deliverability optimized copy</p>
          </div>
        </div>

        {/* Total Sent */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Dispatched Inboxes</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400">
              {isLoading ? '...' : stats?.totalSent || 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1.5">RFC 5322 MIME verified</p>
          </div>
        </div>

        {/* Failed Dispatches */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Failed Dispatches</span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-400">
              {isLoading ? '...' : stats?.totalFailed || 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1.5">Auth/rate-limit anomalies</p>
          </div>
        </div>

        {/* Security Status */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Security Architecture</span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base font-bold text-rose-300">RBAC + Multi-Tenant</span>
            <p className="text-[11px] text-slate-400 mt-1.5">Node.js + Supabase Postgres</p>
          </div>
        </div>
      </div>

      {/* Recent Platform Audit Trail */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-400" />
              Recent Administrative & Security Events
            </h3>
            <p className="text-xs text-slate-400">
              Auditable log of user logins, role modifications, OAuth events, and outreach actions.
            </p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <span>View All Logs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No audit records captured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-sans whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <div className="font-medium text-slate-200">
                        {log.actor?.fullName || 'System / Platform'}
                      </div>
                      <div className="text-[10px] text-slate-400">{log.actor?.email || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                          log.action.includes('FAILED') || log.action.includes('BLOCKED')
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : log.action.includes('ADMIN')
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-3 text-right font-sans text-slate-400">
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 truncate max-w-[200px] inline-block">
                        {log.metadata ? JSON.stringify(log.metadata) : 'None'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
