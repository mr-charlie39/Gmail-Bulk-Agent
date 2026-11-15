import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Mail, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Lock } from 'lucide-react';

export const AdminGmailAccounts: React.FC = () => {
  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ['adminGmailAccounts'],
    queryFn: adminApi.listGmailAccounts,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Mail className="h-6 w-6 text-rose-500" />
            Connected Gmail Accounts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise monitoring of authenticated Google OAuth 2.0 sending credentials across employee accounts.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Connections</span>
        </button>
      </div>

      {/* Security Compliance Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-rose-200">
            Enterprise Cryptographic Boundary (AES-256-GCM)
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All Google OAuth refresh tokens are encrypted at rest with AES-256-GCM using unique initialization vectors (IV) and authentication tags. Plaintext refresh tokens and client secrets are strictly isolated on the backend and are never transmitted over API responses, ensuring total compliance with Google API Services User Data Policy.
          </p>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading Gmail connections...</div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No employee has connected a Gmail account yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/90 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Employee Account</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Connected Gmail Address</th>
                  <th className="py-3 px-4">OAuth Status</th>
                  <th className="py-3 px-4">Token Version</th>
                  <th className="py-3 px-4 text-right">Last Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-slate-200">{acc.employeeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{acc.employeeLoginEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          acc.employeeStatus === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {acc.employeeStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-brand-400" />
                        <span>{acc.gmailAddress}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      {acc.connected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Authenticated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertCircle className="h-3 w-3" />
                          Disconnected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      v{acc.tokenVersion}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                      {new Date(acc.lastVerified).toLocaleString()}
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
