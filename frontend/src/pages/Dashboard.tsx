import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { analyticsApi, googleAuthApi } from '../services/api';
import { AnalyticsOverview } from '../types';

export const Dashboard: React.FC = () => {
  const { data: analytics, isLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['analyticsOverview'],
    queryFn: analyticsApi.getOverview,
    refetchInterval: 10000,
  });

  const { data: googleStatus } = useQuery({
    queryKey: ['googleStatus'],
    queryFn: googleAuthApi.getStatus,
  });

  const kpis = analytics?.kpis || {
    totalEmails: 0,
    sent: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    failed: 0,
    totalRecipients: 0,
    campaigns: 0,
    approvalRate: 100,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome & System Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Outreach Operations Hub</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status of your autonomous Gmail outreach engine and approval queues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/ai-studio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Generate New Drafts
          </Link>
          <Link
            to="/approval"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-all"
          >
            <CheckCircle2 className="h-4 w-4 text-amber-400" />
            Review Queue ({kpis.pending})
          </Link>
        </div>
      </div>

      {/* Google OAuth Status Banner if Disconnected */}
      {!googleStatus?.isConnected && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-200">Gmail Integration Not Connected</h3>
              <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                Connect your Google account with OAuth 2.0 to enable sending approved emails directly through your official Gmail address.
              </p>
            </div>
          </div>
          <button
            onClick={() => googleAuthApi.initiateAuth()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
          >
            Authorize Gmail
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Approved & Delivered</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{kpis.sent}</span>
            <span className="text-xs text-emerald-400 font-medium">via Gmail API</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Failure Rate</span>
            <span className="font-medium text-slate-400">
              {kpis.totalEmails > 0 ? ((kpis.failed / kpis.totalEmails) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Human Review</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{kpis.pending}</span>
            <span className="text-xs text-slate-400 font-medium">Awaiting approval</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Safety Guardrail</span>
            <span className="font-semibold text-amber-400">Enforced</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Verified Prospects</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{kpis.totalRecipients}</span>
            <span className="text-xs text-slate-400 font-medium">In CRM repository</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Database</span>
            <span className="font-medium text-slate-400">Supabase PostgreSQL</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Campaigns</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{kpis.campaigns}</span>
            <span className="text-xs text-slate-400 font-medium">Campaign modules</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>AI Model</span>
            <span className="font-medium text-indigo-400">Google Gemini 1.5</span>
          </div>
        </div>
      </div>

      {/* Integration Details & Review Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gmail OAuth Guardrail Status Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Gmail Integration</h3>
                <p className="text-xs text-slate-400">Google APIs Official Node.js Client</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                googleStatus?.isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {googleStatus?.isConnected ? 'Active' : 'Unconnected'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Sender Identity</span>
              <span className="font-mono text-slate-200">
                {googleStatus?.account?.email || 'None connected'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Token Storage</span>
              <span className="text-emerald-400 font-mono">AES-256-GCM Encrypted</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Auto Token Refresh</span>
              <span className="text-emerald-400 font-medium">Enabled (Offline Access)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Outbound Policy</span>
              <span className="text-indigo-400 font-semibold">Explicit Approval Enforced</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/settings"
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              Configure OAuth Credentials & Keys
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Email Activity Stream */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white">Recent Email Transactions</h3>
            </div>
            <Link to="/history" className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
              View All History <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {item.recipient?.firstName || ''} {item.recipient?.lastName || item.recipient?.email}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono truncate">
                        &lt;{item.recipient?.email}&gt;
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{item.subject}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        item.status === 'SENT'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : item.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : item.status === 'APPROVED'
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No email activity recorded yet. Start by generating outreach drafts in AI Studio.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
