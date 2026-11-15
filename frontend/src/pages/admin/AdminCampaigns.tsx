import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Send, User, Sparkles, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

export const AdminCampaigns: React.FC = () => {
  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['adminCampaigns'],
    queryFn: adminApi.listCampaigns,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Send className="h-6 w-6 text-rose-500" />
            Platform Campaign Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global oversight of active, drafted, and dispatched email campaigns orchestrated by employees.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Campaigns</span>
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading campaigns across platform...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No campaigns have been initiated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/90 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Employee Owner</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">AI Drafts Generated</th>
                  <th className="py-3 px-4">Sent Inboxes</th>
                  <th className="py-3 px-4 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{camp.name}</div>
                      {camp.description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {camp.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-slate-300">{camp.user.fullName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono ml-5">
                        {camp.user.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : camp.status === 'COMPLETED'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-purple-400 font-mono font-medium">
                        <Sparkles className="h-3 w-3" />
                        <span>{camp._count.generatedEmails}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-emerald-400 font-mono font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{camp._count.sentEmails}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                      {new Date(camp.createdAt).toLocaleDateString()}
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
