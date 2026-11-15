import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History as HistoryIcon,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { historyApi } from '../services/api';
import { EmailMessage } from '../types';

export const History: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data: historyList, isLoading } = useQuery<EmailMessage[]>({
    queryKey: ['emailHistory', selectedStatus],
    queryFn: () => historyApi.list(selectedStatus ? { status: selectedStatus } : undefined),
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <HistoryIcon className="h-6 w-6 text-brand-400" />
            Delivery Ledger & Audit History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable transaction log of all AI generated, approved, and dispatched emails with Gmail IDs.
          </p>
        </div>

        {/* Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="SENT">Sent via Gmail</option>
          <option value="APPROVED">Approved (Queued)</option>
          <option value="PENDING_APPROVAL">Pending Review</option>
          <option value="REJECTED">Rejected</option>
          <option value="FAILED">Delivery Failed</option>
        </select>
      </div>

      {/* History Ledger Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/40">
              <th className="py-3.5 px-6">Recipient</th>
              <th className="py-3.5 px-6">Subject Line</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">Gmail Message ID</th>
              <th className="py-3.5 px-6 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
            {historyList && historyList.length > 0 ? (
              historyList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-white">
                      {item.recipient?.firstName || ''} {item.recipient?.lastName || item.recipient?.email}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">{item.recipient?.email}</div>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="font-medium text-slate-200 line-clamp-1">{item.subject}</div>
                    <div className="text-[11px] text-slate-500">
                      Campaign: {item.campaign?.name || 'General Outreach'}
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
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
                  </td>
                  <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400">
                    {item.gmailMessageId ? (
                      <span className="text-emerald-400 truncate max-w-xs block" title={item.gmailMessageId}>
                        {item.gmailMessageId}
                      </span>
                    ) : item.errorLog ? (
                      <span className="text-rose-400 truncate max-w-xs block" title={item.errorLog}>
                        {item.errorLog}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right text-[11px] text-slate-400">
                    {new Date(item.sentAt || item.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No delivery records found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
