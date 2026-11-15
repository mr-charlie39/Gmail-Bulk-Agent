import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { FileText, ShieldAlert, RefreshCw, Filter, Search } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [limit, setLimit] = useState<number>(50);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['adminAuditLogs', selectedAction, limit],
    queryFn: () => adminApi.getAuditLogs({ action: selectedAction || undefined, limit }),
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-rose-500" />
            Platform Security & Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable, compliance-grade audit trail capturing authentication, administration, and outreach events.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-slate-400 font-medium">Filter Action:</span>
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
        >
          <option value="">All Security Events</option>
          <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
          <option value="USER_LOGIN">USER_LOGIN</option>
          <option value="USER_CREATED">USER_CREATED</option>
          <option value="USER_UPDATED">USER_UPDATED</option>
          <option value="USER_ACTIVATED">USER_ACTIVATED</option>
          <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
          <option value="PASSWORD_RESET_BY_ADMIN">PASSWORD_RESET_BY_ADMIN</option>
          <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
          <option value="LOGIN_BLOCKED_INACTIVE">LOGIN_BLOCKED_INACTIVE</option>
          <option value="LOGIN_FAILED_BAD_PASSWORD">LOGIN_FAILED_BAD_PASSWORD</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-slate-400">Rows:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No audit records matching the specified criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/90 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Target User ID</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Event Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-slate-200">
                        {log.actor?.fullName || 'System / Platform'}
                      </div>
                      <div className="text-[10px] text-slate-400">{log.actor?.email || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
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
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] truncate max-w-xs">
                      {log.targetUserId || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <pre className="text-[10px] bg-slate-950 p-1.5 rounded text-slate-300 inline-block text-left max-w-xs overflow-x-auto">
                        {log.metadata ? JSON.stringify(log.metadata, null, 2) : '{}'}
                      </pre>
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
